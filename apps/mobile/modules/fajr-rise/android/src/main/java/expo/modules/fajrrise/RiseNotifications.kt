package expo.modules.fajrrise

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat

/**
 * The ringing alarm's notification. Its full-screen intent opens the ring screen over the lock
 * screen; when the phone is in use it shows as a heads-up instead, and a tap opens the same screen.
 */
object RiseNotifications {
  const val ID = 4417
  /** The service plays the sound itself, so this channel is silent. */
  private const val CHANNEL = "fajr-rise-1"
  /** Used only if Android refuses the service: the channel rings the alarm sound on its own. */
  private const val FALLBACK_CHANNEL = "fajr-rise-fallback-1"
  const val EXTRA_RISE = "expo.modules.fajrrise.RISE"

  val alarmAttributes: AudioAttributes = AudioAttributes.Builder()
    .setUsage(AudioAttributes.USAGE_ALARM)
    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
    .build()

  fun alarmSound(context: Context): Uri? =
    RingtoneManager.getActualDefaultRingtoneUri(context, RingtoneManager.TYPE_ALARM)
      ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
      ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)

  private fun ensureChannels(context: Context, name: String) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = context.getSystemService(NotificationManager::class.java)
    manager.createNotificationChannel(
      NotificationChannel(CHANNEL, name, NotificationManager.IMPORTANCE_HIGH).apply {
        setSound(null, null)
        enableVibration(false)
        lockscreenVisibility = Notification.VISIBILITY_PUBLIC
      },
    )
    manager.createNotificationChannel(
      NotificationChannel(FALLBACK_CHANNEL, name, NotificationManager.IMPORTANCE_HIGH).apply {
        setSound(alarmSound(context), alarmAttributes)
        enableVibration(true)
        vibrationPattern = longArrayOf(0, 700, 800)
        lockscreenVisibility = Notification.VISIBILITY_PUBLIC
      },
    )
  }

  /** Opens the app's ring screen, flagged so the app shows it over the lock screen. */
  fun openIntent(context: Context, config: RiseConfig): PendingIntent? {
    val launch = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: return null
    val intent = Intent(Intent.ACTION_VIEW)
      .setComponent(launch.component)
      .putExtra(EXTRA_RISE, true)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
    if (config.link.isNotEmpty()) intent.data = Uri.parse(config.link)
    return PendingIntent.getActivity(
      context,
      ID,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
  }

  private fun smallIcon(context: Context): Int {
    val id = context.resources.getIdentifier("notification_icon", "drawable", context.packageName)
    return if (id != 0) id else context.applicationInfo.icon
  }

  /**
   * With `quiet`, once the ring screen is up: no full-screen intent and no new alert, so a
   * heads-up shown while the phone was in use folds away instead of covering the screen.
   */
  fun build(
    context: Context,
    config: RiseConfig,
    fallback: Boolean = false,
    quiet: Boolean = false,
  ): Notification {
    ensureChannels(context, config.channel)
    val open = openIntent(context, config)
    val builder = NotificationCompat.Builder(context, if (fallback) FALLBACK_CHANNEL else CHANNEL)
      .setSmallIcon(smallIcon(context))
      .setContentTitle(config.title)
      .setContentText(config.body)
      .setCategory(NotificationCompat.CATEGORY_ALARM)
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setOngoing(true)
      .setAutoCancel(false)
      .setContentIntent(open)
    if (quiet) builder.setOnlyAlertOnce(true).setSilent(true) else builder.setFullScreenIntent(open, true)
    val notification = builder.build()
    // Without the service, the channel's sound repeats until the alarm screen is opened.
    if (fallback) notification.flags = notification.flags or Notification.FLAG_INSISTENT
    return notification
  }

  fun postFallback(context: Context) {
    val manager = context.getSystemService(NotificationManager::class.java)
    manager.notify(ID, build(context, RiseStore.config(context), fallback = true))
  }

  fun cancel(context: Context) {
    context.getSystemService(NotificationManager::class.java).cancel(ID)
  }
}
