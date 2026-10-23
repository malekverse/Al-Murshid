// Fajr Rise on iOS (SPEC 5.10): AlarmKit alarms that ring through silent mode and Focus, with an
// "Open" button that brings up the ring screen. Copied into the app target by the fajr-rise config
// plugin, because iOS finds App Intents (the button) only in the app's own code.

import ActivityKit
import AlarmKit
import AppIntents
import CryptoKit
// Internal, like the import Expo generates for every module (ExpoModulesProvider.swift).
internal import FajrRise
import Foundation
import SwiftUI

private struct Planned: Codable {
  let id: String
  let morning: String
  let at: Double
  let backup: Int
  let sunrise: Double
}

private struct Settings: Codable {
  let sound: String
  let title: String
  let stop: String
  let open: String
  let tint: String
}

@available(iOS 26.0, *)
struct FajrRiseMetadata: AlarmMetadata {}

/** The alarm's "Open" button: the app opens on the ring screen. */
@available(iOS 26.0, *)
struct OpenFajrRiseIntent: LiveActivityIntent {
  static let title: LocalizedStringResource = "Fajr Rise"
  static let openAppWhenRun = true
  static let isDiscoverable = false

  @Parameter(title: "Alarm")
  var alarm: String

  init() {
    alarm = ""
  }

  init(alarm: String) {
    self.alarm = alarm
  }

  func perform() async throws -> some IntentResult {
    FajrRiseAlarms.markOpened(alarm)
    return .result()
  }
}

@objc(FajrRiseAlarms)
final class FajrRiseAlarms: NSObject, FajrRiseBackend {
  private static let planKey = "fajrRise.plan"
  private static let openedKey = "fajrRise.opened"
  /** An "Open" tap counts as ringing for this long, while the challenge is worked on. */
  private static let openedFor: TimeInterval = 30 * 60

  static func markOpened(_ id: String) {
    UserDefaults.standard.set(["id": id, "at": Date().timeIntervalSince1970], forKey: openedKey)
  }

  private static var plan: [Planned] {
    get {
      guard let data = UserDefaults.standard.data(forKey: planKey) else { return [] }
      return (try? JSONDecoder().decode([Planned].self, from: data)) ?? []
    }
    set {
      UserDefaults.standard.set(try? JSONEncoder().encode(newValue), forKey: planKey)
    }
  }

  /** One stable alarm id per alarm and time, so an unchanged plan schedules nothing new. */
  private static func uuid(_ alarm: Planned) -> UUID {
    let digest = Array(SHA256.hash(data: Data("\(alarm.id)@\(Int(alarm.at))".utf8)))
    var b = Array(digest.prefix(16))
    b[6] = (b[6] & 0x0F) | 0x50
    b[8] = (b[8] & 0x3F) | 0x80
    return UUID(
      uuid: (b[0], b[1], b[2], b[3], b[4], b[5], b[6], b[7], b[8], b[9], b[10], b[11], b[12], b[13], b[14], b[15])
    )
  }

  private static func json(_ alarm: Planned) -> String? {
    guard let data = try? JSONEncoder().encode(alarm) else { return nil }
    return String(decoding: data, as: UTF8.self)
  }

  static func authorization() -> String {
    guard #available(iOS 26.0, *) else { return "unsupported" }
    switch AlarmManager.shared.authorizationState {
    case .authorized: return "authorized"
    case .denied: return "denied"
    case .notDetermined: return "notDetermined"
    @unknown default: return "denied"
    }
  }

  static func requestAuthorization(_ done: @escaping (String) -> Void) {
    guard #available(iOS 26.0, *) else { return done("unsupported") }
    Task {
      _ = try? await AlarmManager.shared.requestAuthorization()
      done(authorization())
    }
  }

  static func schedule(_ planJson: String, config: String, done: @escaping (String?) -> Void) {
    guard #available(iOS 26.0, *) else { return done(nil) }
    guard
      let alarms = try? JSONDecoder().decode([Planned].self, from: Data(planJson.utf8)),
      let settings = try? JSONDecoder().decode(Settings.self, from: Data(config.utf8))
    else { return done("The plan could not be read") }
    Task {
      do {
        try await replace(alarms, settings)
        done(nil)
      } catch {
        done(error.localizedDescription)
      }
    }
  }

  @available(iOS 26.0, *)
  private static func replace(_ alarms: [Planned], _ settings: Settings) async throws {
    let manager = AlarmManager.shared
    plan = alarms
    // Only scheduled when allowed; setup asks first.
    guard manager.authorizationState == .authorized else { return }
    let wanted = Dictionary(alarms.map { (uuid($0), $0) }, uniquingKeysWith: { first, _ in first })
    let existing = try manager.alarms
    for alarm in existing where wanted[alarm.id] == nil {
      try? manager.cancel(id: alarm.id)
    }
    let scheduled = Set(existing.map(\.id))
    let now = Date().timeIntervalSince1970 * 1000
    let tint = color(settings.tint)
    for (id, alarm) in wanted where !scheduled.contains(id) && alarm.at > now {
      let alert = AlarmPresentation.Alert(
        title: LocalizedStringResource(stringLiteral: settings.title),
        stopButton: AlarmButton(
          text: LocalizedStringResource(stringLiteral: settings.stop),
          textColor: .white,
          systemImageName: "stop.fill"
        ),
        secondaryButton: AlarmButton(
          text: LocalizedStringResource(stringLiteral: settings.open),
          textColor: .black,
          systemImageName: "sun.horizon.fill"
        ),
        secondaryButtonBehavior: .custom
      )
      let attributes = AlarmAttributes<FajrRiseMetadata>(
        presentation: AlarmPresentation(alert: alert),
        metadata: FajrRiseMetadata(),
        tintColor: tint
      )
      let configuration = AlarmManager.AlarmConfiguration<FajrRiseMetadata>(
        schedule: .fixed(Date(timeIntervalSince1970: alarm.at / 1000)),
        attributes: attributes,
        secondaryIntent: OpenFajrRiseIntent(alarm: alarm.id),
        sound: settings.sound == "soft" ? .named("soft_tone.wav") : .default
      )
      _ = try await manager.schedule(id: id, configuration: configuration)
    }
  }

  static func ringing() -> String? {
    guard #available(iOS 26.0, *) else { return nil }
    let alarms = plan
    if let alerting = (try? AlarmManager.shared.alarms)?.first(where: { $0.state == .alerting }),
      let match = alarms.first(where: { uuid($0) == alerting.id })
    {
      return json(match)
    }
    if let opened = UserDefaults.standard.dictionary(forKey: openedKey),
      let id = opened["id"] as? String,
      let at = opened["at"] as? Double,
      Date().timeIntervalSince1970 - at < openedFor,
      let match = alarms.first(where: { $0.id == id })
    {
      return json(match)
    }
    return nil
  }

  static func finish(_ morning: String?) {
    UserDefaults.standard.removeObject(forKey: openedKey)
    guard #available(iOS 26.0, *), let morning else { return }
    let alarms = plan
    for alarm in alarms where alarm.morning == morning {
      let id = uuid(alarm)
      try? AlarmManager.shared.stop(id: id)
      try? AlarmManager.shared.cancel(id: id)
    }
    plan = alarms.filter { $0.morning != morning }
  }

  /** The night lantern from the tokens ("#E8B25A") as a color; the system accent if unreadable. */
  private static func color(_ hex: String) -> Color {
    guard let value = UInt64(hex.trimmingCharacters(in: CharacterSet(charactersIn: "#")), radix: 16)
    else { return .accentColor }
    return Color(
      red: Double((value >> 16) & 0xFF) / 255,
      green: Double((value >> 8) & 0xFF) / 255,
      blue: Double(value & 0xFF) / 255
    )
  }
}
