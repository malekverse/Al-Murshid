package expo.modules.fajrrise

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** An alarm or backup is due; or the phone restarted and the alarms must be armed again. */
class RiseReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    when (intent.action) {
      RiseScheduler.ACTION_RING -> {
        val id = intent.data?.lastPathSegment ?: return
        // Only alarms still in the plan ring: one finished or replaced since stays quiet.
        val alarm = RiseStore.plan(context).find { it.id == id } ?: return
        RiseService.ring(context, alarm)
      }
      Intent.ACTION_BOOT_COMPLETED,
      Intent.ACTION_MY_PACKAGE_REPLACED,
      "android.app.action.SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED" ->
        RiseScheduler.rearm(context)
    }
  }
}
