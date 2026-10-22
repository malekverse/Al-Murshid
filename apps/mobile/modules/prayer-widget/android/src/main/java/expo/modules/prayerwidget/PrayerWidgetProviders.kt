package expo.modules.prayerwidget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Bundle

/** Both sizes draw from the same data; the system calls them when added, resized or restored. */
abstract class PrayerWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) =
    PrayerWidgets.updateAll(context)

  override fun onAppWidgetOptionsChanged(
    context: Context,
    manager: AppWidgetManager,
    id: Int,
    options: Bundle,
  ) = PrayerWidgets.updateAll(context)

  // The last widget removed: the minute tick stops.
  override fun onDisabled(context: Context) = PrayerWidgets.updateAll(context)
}

class SmallPrayerWidget : PrayerWidgetProvider()

class MediumPrayerWidget : PrayerWidgetProvider()

/** The minute tick, and a change of the clock or the time zone. */
class PrayerWidgetTicker : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    when (intent.action) {
      ACTION_TICK,
      Intent.ACTION_TIME_CHANGED,
      Intent.ACTION_TIMEZONE_CHANGED -> PrayerWidgets.updateAll(context)
    }
  }

  companion object {
    const val ACTION_TICK = "expo.modules.prayerwidget.TICK"
  }
}
