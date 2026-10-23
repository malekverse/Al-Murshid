import * as BackgroundTask from 'expo-background-task';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { handleReminderResponse, rescheduleReminders } from './reminders';
import { handleRiseResponse, rescheduleRise } from './rise';
import { syncWidgets } from './widgets';

// Background work, defined at module scope so it exists when the OS wakes the app (the app's
// entry, index.ts, imports this module before Expo Router).
//  - Android delivers a tap on "I prayed" here even when the app is closed (SPEC 5.2).
//  - A periodic task keeps about six days of reminders scheduled (iOS allows 64 pending).

export const NOTIFICATION_TASK = 'murshid-notification-response';
export const REFRESH_TASK = 'murshid-refresh-reminders';

/**
 * Android hands the task the raw response, where a local notification's data is still a JSON
 * string (`content.dataString`), not the parsed `content.data` the app's listeners receive.
 */
function withData(
  response: Notifications.NotificationResponse,
): Notifications.NotificationResponse {
  const { request } = response.notification;
  const content = request.content as Notifications.NotificationContent & { dataString?: string };
  if (content.data || !content.dataString) return response;
  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(content.dataString) as Record<string, unknown>;
  } catch {
    // Not ours, or malformed: the handler ignores a reminder without data.
  }
  return {
    ...response,
    notification: {
      ...response.notification,
      request: { ...request, content: { ...content, data } },
    },
  };
}

TaskManager.defineTask<Notifications.NotificationTaskPayload>(
  NOTIFICATION_TASK,
  async ({ data }) => {
    if (data && 'actionIdentifier' in data) {
      const response = withData(data);
      if (!handleRiseResponse(response)) handleReminderResponse(response);
    }
    return Notifications.BackgroundNotificationTaskResult.NoData;
  },
);

TaskManager.defineTask(REFRESH_TASK, async () => {
  try {
    await rescheduleReminders();
    await rescheduleRise();
    await syncWidgets();
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerBackgroundTasks() {
  try {
    await Notifications.registerTaskAsync(NOTIFICATION_TASK);
    await BackgroundTask.registerTaskAsync(REFRESH_TASK, { minimumInterval: 12 * 60 });
  } catch {
    // Not available (for example in a simulator without background modes): the app still
    // reschedules on every open.
  }
}
