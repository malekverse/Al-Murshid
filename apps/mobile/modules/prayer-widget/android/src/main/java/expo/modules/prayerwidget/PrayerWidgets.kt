package expo.modules.prayerwidget

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Shader
import android.graphics.Typeface
import android.os.Build
import android.text.SpannableString
import android.text.Spanned
import android.text.style.StyleSpan
import android.view.View
import android.widget.RemoteViews

// Draws the widgets and keeps their countdown right (SPEC 5.9). A widget cannot tick on its own,
// so it is drawn again at each minute while the phone is awake: the alarm is not a wake-up one, so
// while the phone sleeps it waits, and the first look at the screen brings the widget up to date.

internal object PrayerWidgets {
  private val providers =
    listOf(SmallPrayerWidget::class.java to false, MediumPrayerWidget::class.java to true)

  private val nameIds =
    intArrayOf(
      R.id.prayer_widget_row0_name,
      R.id.prayer_widget_row1_name,
      R.id.prayer_widget_row2_name,
      R.id.prayer_widget_row3_name,
      R.id.prayer_widget_row4_name,
    )
  private val timeIds =
    intArrayOf(
      R.id.prayer_widget_row0_time,
      R.id.prayer_widget_row1_time,
      R.id.prayer_widget_row2_time,
      R.id.prayer_widget_row3_time,
      R.id.prayer_widget_row4_time,
    )

  fun updateAll(context: Context) {
    val manager = AppWidgetManager.getInstance(context)
    val data = WidgetData.load(context)
    var shown = false
    for ((provider, medium) in providers) {
      for (id in manager.getAppWidgetIds(ComponentName(context, provider))) {
        manager.updateAppWidget(id, render(context, manager, id, medium, data))
        shown = true
      }
    }
    if (shown) scheduleTick(context) else cancelTick(context)
  }

  private fun render(
    context: Context,
    manager: AppWidgetManager,
    id: Int,
    medium: Boolean,
    data: WidgetData?,
  ): RemoteViews {
    val layout = if (medium) R.layout.prayer_widget_medium else R.layout.prayer_widget_small
    val views = RemoteViews(context.packageName, layout)
    launchIntent(context)?.let { views.setOnClickPendingIntent(R.id.prayer_widget_root, it) }

    val now = System.currentTimeMillis()
    val next = data?.nextAt(now)
    val sky = data?.skyAt(now)
    if (sky != null) {
      views.setImageViewBitmap(R.id.prayer_widget_sky, skyBitmap(context, manager, id, medium, sky))
    }
    if (data == null || next == null || sky == null) {
      val empty = data?.empty ?: context.getString(R.string.prayer_widget_empty)
      views.setTextViewText(R.id.prayer_widget_label, "")
      views.setTextViewText(R.id.prayer_widget_name, "")
      views.setTextViewText(R.id.prayer_widget_time, empty)
      views.setTextViewText(R.id.prayer_widget_countdown, "")
      views.setContentDescription(R.id.prayer_widget_root, empty)
      if (medium) views.setViewVisibility(R.id.prayer_widget_rows, View.GONE)
      return views
    }

    views.setInt(
      R.id.prayer_widget_root,
      "setLayoutDirection",
      if (data.rtl) View.LAYOUT_DIRECTION_RTL else View.LAYOUT_DIRECTION_LTR,
    )
    val (day, index) = next
    val row = data.days[day][index]
    val countdown = data.countdown(row.at - now)
    views.setTextViewText(R.id.prayer_widget_label, data.next)
    views.setTextViewText(R.id.prayer_widget_name, row.name)
    views.setTextViewText(R.id.prayer_widget_time, row.time)
    views.setTextViewText(R.id.prayer_widget_countdown, countdown)
    views.setTextColor(R.id.prayer_widget_label, sky.muted)
    views.setTextColor(R.id.prayer_widget_name, sky.ink)
    views.setTextColor(R.id.prayer_widget_time, sky.ink)
    views.setTextColor(R.id.prayer_widget_countdown, sky.accent)
    views.setContentDescription(
      R.id.prayer_widget_root,
      "${data.next}: ${row.name}, ${row.time}, $countdown",
    )

    if (medium) {
      views.setViewVisibility(R.id.prayer_widget_rows, View.VISIBLE)
      data.days[day].forEachIndexed { i, r ->
        if (i >= nameIds.size) return@forEachIndexed
        val isNext = i == index
        views.setTextViewText(nameIds[i], if (isNext) bold(r.name) else r.name)
        views.setTextViewText(timeIds[i], if (isNext) bold(r.time) else r.time)
        val color = if (isNext) sky.accent else sky.ink
        views.setTextColor(nameIds[i], color)
        views.setTextColor(timeIds[i], color)
      }
    }
    return views
  }

  private fun bold(text: String): CharSequence =
    SpannableString(text).apply {
      setSpan(StyleSpan(Typeface.BOLD), 0, text.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
    }

  /** The sky behind the widget: its two colors top to bottom, with rounded corners. */
  private fun skyBitmap(
    context: Context,
    manager: AppWidgetManager,
    id: Int,
    medium: Boolean,
    sky: Sky,
  ): Bitmap {
    val options = manager.getAppWidgetOptions(id)
    val widthDp =
      options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH).takeIf { it > 0 }
        ?: if (medium) 250 else 110
    val heightDp =
      options.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT).takeIf { it > 0 } ?: 110
    // Half the screen density is plenty for a gradient, and keeps the bitmap small.
    val scale = context.resources.displayMetrics.density / 2
    val width = (widthDp * scale).toInt().coerceIn(32, 720)
    val height = (heightDp * scale).toInt().coerceIn(32, 720)
    val radius = context.resources.getDimension(R.dimen.prayer_widget_radius) / 2

    val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
    val paint =
      Paint(Paint.ANTI_ALIAS_FLAG).apply {
        shader =
          LinearGradient(0f, 0f, 0f, height.toFloat(), sky.top, sky.bottom, Shader.TileMode.CLAMP)
      }
    Canvas(bitmap).drawRoundRect(RectF(0f, 0f, width.toFloat(), height.toFloat()), radius, radius, paint)
    return bitmap
  }

  private fun launchIntent(context: Context): PendingIntent? {
    val intent = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: return null
    return PendingIntent.getActivity(
      context,
      0,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
  }

  private fun tickIntent(context: Context): PendingIntent =
    PendingIntent.getBroadcast(
      context,
      0,
      Intent(context, PrayerWidgetTicker::class.java).setAction(PrayerWidgetTicker.ACTION_TICK),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )

  private fun scheduleTick(context: Context) {
    val alarms = context.getSystemService(AlarmManager::class.java) ?: return
    val next = (System.currentTimeMillis() / 60_000 + 1) * 60_000
    val intent = tickIntent(context)
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarms.canScheduleExactAlarms()) {
      alarms.setExact(AlarmManager.RTC, next, intent)
    } else {
      alarms.setWindow(AlarmManager.RTC, next, 15_000, intent)
    }
  }

  private fun cancelTick(context: Context) {
    context.getSystemService(AlarmManager::class.java)?.cancel(tickIntent(context))
  }
}
