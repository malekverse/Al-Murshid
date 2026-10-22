package expo.modules.prayerwidget

import android.content.Context
import android.graphics.Color
import org.json.JSONObject

// What the app wrote for its widgets (apps/mobile/src/lib/widget-data.ts): the coming week's
// prayers, already in the person's language and digits, and the sky every half hour. The widget
// only picks the entry for "now", so it works offline.

internal data class Row(val at: Long, val name: String, val time: String)

internal data class Sky(
  val from: Long,
  val top: Int,
  val bottom: Int,
  val ink: Int,
  val muted: Int,
  val accent: Int,
)

internal class WidgetData(
  val rtl: Boolean,
  private val digits: String,
  val next: String,
  private val inText: String,
  val empty: String,
  private val minutes: List<String>,
  val days: List<List<Row>>,
  private val sky: List<Sky>,
) {
  /** The day and row of the first prayer still to come, or null once the week has run out. */
  fun nextAt(now: Long): Pair<Int, Int>? {
    days.forEachIndexed { d, rows ->
      rows.forEachIndexed { i, row -> if (row.at > now) return d to i }
    }
    return null
  }

  fun skyAt(now: Long): Sky? = sky.lastOrNull { it.from <= now } ?: sky.firstOrNull()

  /** "in 1:23" or "in 45 minutes", rounded up to the minute like the app's countdown. */
  fun countdown(millis: Long): String {
    val total = ((millis + 59_999) / 60_000).coerceAtLeast(1)
    val text =
      if (total < 60) {
        minutes.getOrNull(total.toInt()) ?: localize(total.toString())
      } else {
        localize("${total / 60}:${(total % 60).toString().padStart(2, '0')}")
      }
    return inText.replace(COUNTDOWN_SLOT, text)
  }

  private fun localize(text: String): String =
    if (digits.length != 10) text
    else text.map { c -> if (c in '0'..'9') digits[c - '0'] else c }.joinToString("")

  companion object {
    private const val PREFS = "murshid_prayer_widget"
    private const val KEY = "data"
    private const val COUNTDOWN_SLOT = "%T%"

    fun save(context: Context, json: String?) {
      val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
      if (json == null) prefs.remove(KEY) else prefs.putString(KEY, json)
      prefs.apply()
    }

    fun load(context: Context): WidgetData? {
      val json =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, null)
          ?: return null
      return try {
        parse(JSONObject(json))
      } catch (_: Exception) {
        null
      }
    }

    private fun parse(o: JSONObject): WidgetData {
      val text = o.getJSONObject("text")
      val minutes = text.getJSONArray("minutes")
      val days = o.getJSONArray("days")
      val sky = o.getJSONArray("sky")
      return WidgetData(
        rtl = o.getBoolean("rtl"),
        digits = o.getString("digits"),
        next = text.getString("next"),
        inText = text.getString("in"),
        empty = text.getString("empty"),
        minutes = List(minutes.length()) { minutes.getString(it) },
        days =
          List(days.length()) { d ->
            val rows = days.getJSONArray(d)
            List(rows.length()) { i ->
              val row = rows.getJSONObject(i)
              Row(row.getLong("at"), row.getString("name"), row.getString("time"))
            }
          },
        sky =
          List(sky.length()) { i ->
            val s = sky.getJSONObject(i)
            Sky(
              from = s.getLong("from"),
              top = Color.parseColor(s.getString("top")),
              bottom = Color.parseColor(s.getString("bottom")),
              ink = Color.parseColor(s.getString("ink")),
              muted = Color.parseColor(s.getString("muted")),
              accent = Color.parseColor(s.getString("accent")),
            )
          },
      )
    }
  }
}
