package expo.modules.fajrrise

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build

/**
 * Arms each alarm and backup with AlarmManager. With the exact-alarm permission they are alarm
 * clocks (exact, through Doze, with the system's alarm icon); without it Android may deliver them
 * a little late, which the setup screen says.
 */
object RiseScheduler {
  const val ACTION_RING = "expo.modules.fajrrise.RING"

  fun canBeExact(context: Context): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true
    return context.getSystemService(AlarmManager::class.java).canScheduleExactAlarms()
  }

  /** Replaces the whole plan: what is no longer in it is cancelled. */
  fun replace(context: Context, alarms: List<RiseAlarm>, config: RiseConfig) {
    cancel(context, RiseStore.plan(context))
    RiseStore.save(context, alarms, config)
    arm(context, alarms)
  }

  /** After a restart, an app update or a change of the exact-alarm permission. */
  fun rearm(context: Context) = arm(context, RiseStore.plan(context))

  /** A morning is over: its remaining backups never ring. */
  fun cancelMorning(context: Context, morning: String) {
    val plan = RiseStore.plan(context)
    val (gone, kept) = plan.partition { it.morning == morning }
    cancel(context, gone)
    RiseStore.savePlan(context, kept)
  }

  private fun arm(context: Context, alarms: List<RiseAlarm>) {
    val manager = context.getSystemService(AlarmManager::class.java)
    val now = System.currentTimeMillis()
    val exact = canBeExact(context)
    for (alarm in alarms) {
      if (alarm.at <= now) continue
      val operation = pending(context, alarm.id, PendingIntent.FLAG_UPDATE_CURRENT) ?: continue
      if (exact) {
        manager.setAlarmClock(AlarmManager.AlarmClockInfo(alarm.at, showIntent(context)), operation)
      } else {
        manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, alarm.at, operation)
      }
    }
  }

  private fun cancel(context: Context, alarms: List<RiseAlarm>) {
    val manager = context.getSystemService(AlarmManager::class.java)
    for (alarm in alarms) {
      val operation = pending(context, alarm.id, PendingIntent.FLAG_NO_CREATE) ?: continue
      manager.cancel(operation)
      operation.cancel()
    }
  }

  /** Each alarm is its own intent, told apart by its address. */
  private fun pending(context: Context, id: String, flag: Int): PendingIntent? {
    val intent = Intent(context, RiseReceiver::class.java)
      .setAction(ACTION_RING)
      .setData(Uri.parse("fajr-rise://alarm/$id"))
    return PendingIntent.getBroadcast(context, 0, intent, flag or PendingIntent.FLAG_IMMUTABLE)
  }

  /** What tapping the system's alarm icon opens: the app. */
  private fun showIntent(context: Context): PendingIntent? {
    val launch = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: return null
    return PendingIntent.getActivity(context, 0, launch, PendingIntent.FLAG_IMMUTABLE)
  }
}
