import ExpoModulesCore
import Foundation

/**
 * What the app target provides (ios-app/FajrRiseAlarms.swift, added by the config plugin). The
 * alarms and their "Open" intent live there because iOS finds App Intents only in the app's own
 * code; this module reaches them by class name, so it builds without them.
 */
@objc public protocol FajrRiseBackend: NSObjectProtocol {
  /** "authorized", "denied", "notDetermined", or "unsupported" before iOS 26. */
  static func authorization() -> String
  static func requestAuthorization(_ done: @escaping (String) -> Void)
  /** Replaces every alarm with the plan (JSON); `done` gets an error message or nil. */
  static func schedule(_ plan: String, config: String, done: @escaping (String?) -> Void)
  /** The alarm ringing or just opened from its button, as JSON, or nil. */
  static func ringing() -> String?
  /** The person is up: the morning's remaining alarms are cancelled. */
  static func finish(_ morning: String?)
}

struct AlarmRecord: Record {
  @Field var id: String = ""
  @Field var morning: String = ""
  @Field var at: Double = 0
  @Field var backup: Int = 0
  @Field var sunrise: Double = 0
}

struct ConfigRecord: Record {
  @Field var sound: String = "alarm"
  @Field var title: String = ""
  @Field var stop: String = ""
  @Field var open: String = ""
  @Field var tint: String = ""
}

public class FajrRiseModule: Module {
  private var backend: FajrRiseBackend.Type? {
    NSClassFromString("FajrRiseAlarms") as? FajrRiseBackend.Type
  }

  public func definition() -> ModuleDefinition {
    Name("FajrRise")
    Events("onRing")

    AsyncFunction("schedule") { (alarms: [AlarmRecord], config: ConfigRecord, promise: Promise) in
      guard let backend = self.backend else {
        promise.resolve(nil)
        return
      }
      let plan = alarms.map {
        ["id": $0.id, "morning": $0.morning, "at": $0.at, "backup": $0.backup, "sunrise": $0.sunrise]
      }
      let settings: [String: Any] = [
        "sound": config.sound, "title": config.title, "stop": config.stop, "open": config.open,
        "tint": config.tint,
      ]
      guard
        let planJson = try? JSONSerialization.data(withJSONObject: plan),
        let configJson = try? JSONSerialization.data(withJSONObject: settings)
      else {
        promise.reject("ERR_FAJR_RISE", "The plan could not be encoded")
        return
      }
      backend.schedule(
        String(decoding: planJson, as: UTF8.self),
        config: String(decoding: configJson, as: UTF8.self)
      ) { error in
        if let error {
          promise.reject("ERR_FAJR_RISE", error)
        } else {
          promise.resolve(nil)
        }
      }
    }

    Function("ringing") { () -> [String: Any]? in
      guard
        let json = self.backend?.ringing(),
        let object = try? JSONSerialization.jsonObject(with: Data(json.utf8)) as? [String: Any]
      else { return nil }
      return object
    }

    AsyncFunction("finish") { (morning: String?, _: Bool) in
      self.backend?.finish(morning)
    }

    // iOS plays and presents the alarm itself: nothing to lower or fold away.
    Function("duck") { (_: Bool) in }
    Function("shown") {}

    Function("permissions") { () -> [String: Any] in
      ["exact": true, "fullScreen": true, "alarms": self.backend?.authorization() ?? "unsupported"]
    }

    AsyncFunction("requestAlarms") { (promise: Promise) in
      guard let backend = self.backend else {
        promise.resolve("unsupported")
        return
      }
      backend.requestAuthorization { promise.resolve($0) }
    }

    AsyncFunction("openExactSettings") {}
    AsyncFunction("openFullScreenSettings") {}
  }
}
