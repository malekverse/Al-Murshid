package expo.modules.fajrrise

import android.app.Activity
import android.app.KeyguardManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.WindowManager
import expo.modules.core.interfaces.Package
import expo.modules.core.interfaces.ReactActivityLifecycleListener
import java.lang.ref.WeakReference

/** Lets the app's activity show the ring screen over the lock screen while an alarm rings. */
class FajrRisePackage : Package {
  override fun createReactActivityLifecycleListeners(
    activityContext: Context,
  ): List<ReactActivityLifecycleListener> = listOf(RiseActivityListener())
}

class RiseActivityListener : ReactActivityLifecycleListener {
  override fun onCreate(activity: Activity, savedInstanceState: Bundle?) {
    RiseLockScreen.track(activity)
    // Set before the first frame, so the screen turns on and shows over the lock screen.
    if (activity.intent?.getBooleanExtra(RiseNotifications.EXTRA_RISE, false) == true) {
      RiseLockScreen.show(activity)
    }
  }

  override fun onResume(activity: Activity) = RiseLockScreen.track(activity)

  override fun onNewIntent(intent: Intent?): Boolean {
    if (intent?.getBooleanExtra(RiseNotifications.EXTRA_RISE, false) == true) {
      RiseLockScreen.current()?.let { RiseLockScreen.show(it) }
    }
    return false
  }
}

/**
 * Only while an alarm rings does the app show over the lock screen; as soon as the person is up
 * (or the ring stops on its own) the app goes back behind it, so nobody can open it unlocked.
 */
object RiseLockScreen {
  private var activity: WeakReference<Activity>? = null

  fun track(activity: Activity) {
    this.activity = WeakReference(activity)
  }

  fun current(): Activity? = activity?.get()

  fun show(activity: Activity) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      activity.setShowWhenLocked(true)
      activity.setTurnScreenOn(true)
    } else {
      @Suppress("DEPRECATION")
      activity.window.addFlags(
        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON,
      )
    }
    activity.window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
  }

  /** Back behind the lock screen; with `unlock`, the phone asks to be unlocked to carry on. */
  fun release(unlock: Boolean) {
    val activity = current() ?: return
    Handler(Looper.getMainLooper()).post {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
        activity.setShowWhenLocked(false)
        activity.setTurnScreenOn(false)
      } else {
        @Suppress("DEPRECATION")
        activity.window.clearFlags(
          WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON,
        )
      }
      activity.window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
      if (unlock && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val keyguard = activity.getSystemService(KeyguardManager::class.java)
        if (keyguard.isKeyguardLocked) keyguard.requestDismissKeyguard(activity, null)
      }
    }
  }
}
