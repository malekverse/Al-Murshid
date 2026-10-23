package expo.modules.fajrrise

import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.MediaPlayer
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.os.VibrationAttributes
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import androidx.core.content.ContextCompat
import java.lang.ref.WeakReference

/**
 * Rings: the sound on the alarm channel, fading in over 30 seconds, and vibration, until the app
 * says the person is up (or 30 minutes pass; the backups stop at 20). A backup arriving while it
 * rings changes nothing. While the person works on the challenge the sound is lowered, and it
 * comes back if they stop (the app decides when).
 */
class RiseService : Service() {
  private val handler = Handler(Looper.getMainLooper())
  private var player: MediaPlayer? = null
  private var vibrator: Vibrator? = null
  private var wakeLock: PowerManager.WakeLock? = null
  private var focus: AudioFocusRequest? = null
  private var savedVolume: Int? = null
  private var level = START_LEVEL
  private var ducked = false
  /** The ring screen is up: the notification stays quiet, even when a backup arrives. */
  private var quiet = false

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onCreate() {
    super.onCreate()
    instance = WeakReference(this)
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val alarm = intent?.let { alarmFrom(it) }
    val config = RiseStore.config(this)
    val notification = RiseNotifications.build(this, config, quiet = quiet)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      startForeground(
        RiseNotifications.ID,
        notification,
        ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK,
      )
    } else {
      startForeground(RiseNotifications.ID, notification)
    }
    if (alarm == null) {
      finish()
      return START_NOT_STICKY
    }
    val already = ringing
    ringing = alarm
    if (already == null) begin(config)
    onRing?.invoke(alarm)
    return START_NOT_STICKY
  }

  private fun begin(config: RiseConfig) {
    val power = getSystemService(PowerManager::class.java)
    wakeLock = power.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "AlMurshid:FajrRise").apply {
      acquire(MAX_RING_MS)
    }
    raiseVolumeFloor()
    requestFocus()
    play(config)
    vibrate()
    handler.postDelayed(fade, STEP_MS)
    handler.postDelayed({ finish() }, MAX_RING_MS)
  }

  /** A quiet alarm volume would defeat the point: at least half, put back afterwards. */
  private fun raiseVolumeFloor() {
    val audio = getSystemService(AudioManager::class.java)
    val max = audio.getStreamMaxVolume(AudioManager.STREAM_ALARM)
    val current = audio.getStreamVolume(AudioManager.STREAM_ALARM)
    if (current >= max / 2) return
    try {
      audio.setStreamVolume(AudioManager.STREAM_ALARM, max / 2, 0)
      savedVolume = current
    } catch (_: SecurityException) {
      // Do Not Disturb can refuse it; the alarm still rings at the person's own volume.
    }
  }

  private fun requestFocus() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val request = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
      .setAudioAttributes(RiseNotifications.alarmAttributes)
      .build()
    getSystemService(AudioManager::class.java).requestAudioFocus(request)
    focus = request
  }

  private fun soundUri(sound: String): Uri? {
    if (sound == "soft") {
      val id = resources.getIdentifier("soft_tone", "raw", packageName)
      if (id != 0) return Uri.parse("android.resource://$packageName/$id")
    }
    return RiseNotifications.alarmSound(this)
  }

  private fun play(config: RiseConfig) {
    val sources = listOfNotNull(soundUri(config.sound), RiseNotifications.alarmSound(this))
    for (uri in sources.distinct()) {
      try {
        player = MediaPlayer().apply {
          setAudioAttributes(RiseNotifications.alarmAttributes)
          setDataSource(this@RiseService, uri)
          isLooping = true
          setVolume(level, level)
          prepare()
          start()
        }
        return
      } catch (_: Exception) {
        player?.release()
        player = null
      }
    }
    // No playable sound on this phone: the vibration and the screen still wake.
  }

  private fun vibrate() {
    val device = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      getSystemService(VibratorManager::class.java).defaultVibrator
    } else {
      @Suppress("DEPRECATION")
      getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
    }
    if (!device.hasVibrator()) return
    val pattern = longArrayOf(0, 700, 800)
    when {
      Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU ->
        device.vibrate(
          VibrationEffect.createWaveform(pattern, 0),
          VibrationAttributes.createForUsage(VibrationAttributes.USAGE_ALARM),
        )
      Build.VERSION.SDK_INT >= Build.VERSION_CODES.O ->
        @Suppress("DEPRECATION")
        device.vibrate(VibrationEffect.createWaveform(pattern, 0), RiseNotifications.alarmAttributes)
      else ->
        @Suppress("DEPRECATION")
        device.vibrate(pattern, 0)
    }
    vibrator = device
  }

  private val fade = object : Runnable {
    override fun run() {
      if (level < 1f) {
        level = (level + (1f - START_LEVEL) * STEP_MS / FADE_MS).coerceAtMost(1f)
        applyVolume()
        handler.postDelayed(this, STEP_MS)
      }
    }
  }

  private fun applyVolume() {
    val volume = if (ducked) level * DUCKED else level
    try {
      player?.setVolume(volume, volume)
    } catch (_: IllegalStateException) {
      // Already released.
    }
  }

  fun setQuiet() {
    if (quiet || ringing == null) return
    quiet = true
    val notification = RiseNotifications.build(this, RiseStore.config(this), quiet = true)
    getSystemService(android.app.NotificationManager::class.java).notify(RiseNotifications.ID, notification)
  }

  fun setDucked(value: Boolean) {
    ducked = value
    applyVolume()
  }

  fun finish() {
    handler.removeCallbacksAndMessages(null)
    player?.let {
      try {
        it.stop()
      } catch (_: IllegalStateException) {
      }
      it.release()
    }
    player = null
    vibrator?.cancel()
    vibrator = null
    val audio = getSystemService(AudioManager::class.java)
    focus?.let { if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) audio.abandonAudioFocusRequest(it) }
    focus = null
    savedVolume?.let {
      try {
        audio.setStreamVolume(AudioManager.STREAM_ALARM, it, 0)
      } catch (_: SecurityException) {
      }
    }
    savedVolume = null
    wakeLock?.let { if (it.isHeld) it.release() }
    wakeLock = null
    ringing = null
    RiseLockScreen.release(unlock = false)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      stopForeground(STOP_FOREGROUND_REMOVE)
    } else {
      @Suppress("DEPRECATION")
      stopForeground(true)
    }
    stopSelf()
  }

  override fun onDestroy() {
    if (ringing != null) finish()
    instance = null
    super.onDestroy()
  }

  companion object {
    private const val START_LEVEL = 0.12f
    private const val DUCKED = 0.3f
    private const val FADE_MS = 30_000L
    private const val STEP_MS = 500L
    private const val MAX_RING_MS = 30 * 60_000L
    private const val EXTRA_ID = "id"
    private const val EXTRA_MORNING = "morning"
    private const val EXTRA_AT = "at"
    private const val EXTRA_BACKUP = "backup"
    private const val EXTRA_SUNRISE = "sunrise"

    /** The alarm ringing now, if any. */
    @Volatile
    var ringing: RiseAlarm? = null
      private set

    /** Told when an alarm rings, so an open app can show the ring screen at once. */
    var onRing: ((RiseAlarm) -> Unit)? = null

    private var instance: WeakReference<RiseService>? = null

    fun ring(context: Context, alarm: RiseAlarm) {
      val intent = Intent(context, RiseService::class.java)
        .putExtra(EXTRA_ID, alarm.id)
        .putExtra(EXTRA_MORNING, alarm.morning)
        .putExtra(EXTRA_AT, alarm.at)
        .putExtra(EXTRA_BACKUP, alarm.backup)
        .putExtra(EXTRA_SUNRISE, alarm.sunrise)
      try {
        ContextCompat.startForegroundService(context, intent)
      } catch (_: Exception) {
        // Android refused the service (an alarm without exact timing may not start one): the
        // notification alone rings and opens the ring screen.
        RiseNotifications.postFallback(context)
      }
    }

    fun stop(context: Context) {
      val service = instance?.get()
      if (service != null) service.finish() else RiseNotifications.cancel(context)
      ringing = null
    }

    /** The ring screen is showing: fold the heads-up away. */
    fun shown() {
      val service = instance?.get() ?: return
      Handler(Looper.getMainLooper()).post { service.setQuiet() }
    }

    fun duck(ducked: Boolean) {
      val service = instance?.get() ?: return
      Handler(Looper.getMainLooper()).post { service.setDucked(ducked) }
    }

    private fun alarmFrom(intent: Intent): RiseAlarm? {
      val id = intent.getStringExtra(EXTRA_ID) ?: return null
      return RiseAlarm(
        id = id,
        morning = intent.getStringExtra(EXTRA_MORNING) ?: return null,
        at = intent.getLongExtra(EXTRA_AT, 0),
        backup = intent.getIntExtra(EXTRA_BACKUP, 0),
        sunrise = intent.getLongExtra(EXTRA_SUNRISE, 0),
      )
    }
  }
}
