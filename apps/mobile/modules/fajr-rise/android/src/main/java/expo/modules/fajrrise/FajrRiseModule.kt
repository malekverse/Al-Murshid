package expo.modules.fajrrise

import android.app.NotificationManager
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class AlarmRecord : Record {
  @Field val id: String = ""
  @Field val morning: String = ""
  @Field val at: Double = 0.0
  @Field val backup: Int = 0
  @Field val sunrise: Double = 0.0
}

class ConfigRecord : Record {
  @Field val sound: String = "alarm"
  @Field val title: String = ""
  @Field val body: String = ""
  @Field val channel: String = ""
  @Field val link: String = ""
}

private fun RiseAlarm.toMap() = mapOf(
  "id" to id,
  "morning" to morning,
  "at" to at.toDouble(),
  "backup" to backup,
  "sunrise" to sunrise.toDouble(),
)

/**
 * Fajr Rise (SPEC 5.10) for the app: it hands over the whole plan from packages/core, and says
 * when the person is up. Everything that must work with the app closed lives in the receiver
 * and the service.
 */
class FajrRiseModule : Module() {
  private val context
    get() = requireNotNull(appContext.reactContext?.applicationContext)

  override fun definition() = ModuleDefinition {
    Name("FajrRise")
    Events("onRing")

    OnCreate { RiseService.onRing = { alarm -> sendEvent("onRing", alarm.toMap()) } }
    OnDestroy { RiseService.onRing = null }

    AsyncFunction("schedule") { alarms: List<AlarmRecord>, config: ConfigRecord ->
      // A trial ring still to come survives a new plan.
      val now = System.currentTimeMillis()
      val trial = RiseStore.plan(context).filter { it.morning == TRY_MORNING && it.at > now }
      RiseScheduler.replace(
        context,
        alarms.map { RiseAlarm(it.id, it.morning, it.at.toLong(), it.backup, it.sunrise.toLong()) } + trial,
        RiseConfig(config.sound, config.title, config.body, config.channel, config.link),
      )
    }

    /** The alarm ringing now, or null. */
    Function("ringing") { RiseService.ringing?.toMap() }

    /** The person is up (or turned it off): silence, cancel the morning's backups, unlock. */
    AsyncFunction("finish") { morning: String?, unlock: Boolean ->
      RiseService.stop(context)
      if (morning != null) RiseScheduler.cancelMorning(context, morning)
      RiseLockScreen.release(unlock)
    }

    /** The ring screen is up: the notification stops covering it. */
    Function("shown") { RiseService.shown() }

    /** Lower the sound while the challenge is being worked on. */
    Function("duck") { ducked: Boolean -> RiseService.duck(ducked) }

    /** Rings once in a few seconds, outside the plan: for trying the alarm. */
    AsyncFunction("ringSoon") { seconds: Int ->
      val now = System.currentTimeMillis()
      val plan = RiseStore.plan(context).filter { it.morning != TRY_MORNING }
      val trial = RiseAlarm("$TRY_MORNING-0", TRY_MORNING, now + seconds * 1000L, 0, now + 3_600_000L)
      RiseScheduler.replace(context, plan + trial, RiseStore.config(context))
    }

    Function("permissions") {
      val fullScreen = if (Build.VERSION.SDK_INT >= 34) {
        context.getSystemService(NotificationManager::class.java).canUseFullScreenIntent()
      } else {
        true
      }
      mapOf("exact" to RiseScheduler.canBeExact(context), "fullScreen" to fullScreen)
    }

    AsyncFunction("openExactSettings") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        open(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM)
      }
    }

    AsyncFunction("openFullScreenSettings") {
      if (Build.VERSION.SDK_INT >= 34) open(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT)
    }
  }

  private fun open(action: String) {
    val intent = Intent(action, Uri.parse("package:${context.packageName}"))
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    try {
      context.startActivity(intent)
    } catch (_: Exception) {
      context.startActivity(
        Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:${context.packageName}"))
          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
      )
    }
  }

  companion object {
    const val TRY_MORNING = "try"
  }
}
