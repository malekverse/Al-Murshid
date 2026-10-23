package expo.modules.fajrrise

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/** One alarm or backup from the app's plan (packages/core `planRise`). Times are epoch ms. */
data class RiseAlarm(
  val id: String,
  val morning: String,
  val at: Long,
  val backup: Int,
  val sunrise: Long,
)

/** What the ring needs without JavaScript: the sound, the notification's words, the app's link. */
data class RiseConfig(
  val sound: String,
  val title: String,
  val body: String,
  val channel: String,
  /** The deep link that opens the ring screen, such as "almurshid://rise". */
  val link: String,
)

/**
 * The plan the app last handed over, kept so the alarms can be armed again after a restart
 * (the system forgets alarms on reboot) and so an alarm the app has since removed never rings.
 */
object RiseStore {
  private const val PREFS = "fajr_rise"
  private const val PLAN = "plan"
  private const val CONFIG = "config"

  private fun prefs(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  fun save(context: Context, alarms: List<RiseAlarm>, config: RiseConfig) {
    val plan = JSONArray()
    for (alarm in alarms) {
      plan.put(
        JSONObject()
          .put("id", alarm.id)
          .put("morning", alarm.morning)
          .put("at", alarm.at)
          .put("backup", alarm.backup)
          .put("sunrise", alarm.sunrise),
      )
    }
    val settings = JSONObject()
      .put("sound", config.sound)
      .put("title", config.title)
      .put("body", config.body)
      .put("channel", config.channel)
      .put("link", config.link)
    prefs(context).edit()
      .putString(PLAN, plan.toString())
      .putString(CONFIG, settings.toString())
      .apply()
  }

  fun savePlan(context: Context, alarms: List<RiseAlarm>) = save(context, alarms, config(context))

  fun plan(context: Context): List<RiseAlarm> {
    val raw = prefs(context).getString(PLAN, null) ?: return emptyList()
    return try {
      val array = JSONArray(raw)
      (0 until array.length()).map { i ->
        val o = array.getJSONObject(i)
        RiseAlarm(
          id = o.getString("id"),
          morning = o.getString("morning"),
          at = o.getLong("at"),
          backup = o.getInt("backup"),
          sunrise = o.getLong("sunrise"),
        )
      }
    } catch (_: Exception) {
      emptyList()
    }
  }

  fun config(context: Context): RiseConfig {
    val fallback = RiseConfig("alarm", "Fajr Rise", "", "Fajr Rise", "")
    val raw = prefs(context).getString(CONFIG, null) ?: return fallback
    return try {
      val o = JSONObject(raw)
      RiseConfig(
        sound = o.optString("sound", fallback.sound),
        title = o.optString("title", fallback.title),
        body = o.optString("body", fallback.body),
        channel = o.optString("channel", fallback.channel),
        link = o.optString("link", fallback.link),
      )
    } catch (_: Exception) {
      fallback
    }
  }
}
