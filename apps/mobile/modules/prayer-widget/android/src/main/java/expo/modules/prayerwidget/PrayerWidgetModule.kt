package expo.modules.prayerwidget

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/** The app hands its widgets the coming week (JSON), or nothing after "Delete everything". */
class PrayerWidgetModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PrayerWidget")

    AsyncFunction("setData") { json: String? ->
      val context = appContext.reactContext?.applicationContext ?: return@AsyncFunction
      WidgetData.save(context, json)
      PrayerWidgets.updateAll(context)
    }
  }
}
