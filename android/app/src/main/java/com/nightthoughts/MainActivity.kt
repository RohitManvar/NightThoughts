package com.nightthoughts

import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "NightThoughts"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    handleQuickRecordIntent(intent)
  }

  override fun onNewIntent(intent: Intent?) {
    super.onNewIntent(intent)
    setIntent(intent)
    handleQuickRecordIntent(intent)
  }

  /**
   * When launched from the Quick Settings tile, show over the lock screen and
   * wake the display so the user can record without unlocking. Any other
   * launch must explicitly turn this back off — MainActivity is singleTask,
   * so the same instance (and its show-when-locked flag) survives across
   * launches, and a normal launch must never inherit it.
   */
  private fun handleQuickRecordIntent(intent: Intent?) {
    val isQuickRecord = intent?.action == QuickRecordModule.ACTION_QUICK_RECORD
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(isQuickRecord)
      if (isQuickRecord) setTurnScreenOn(true)
    } else {
      @Suppress("DEPRECATION")
      if (isQuickRecord) {
        window.addFlags(
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON,
        )
      } else {
        window.clearFlags(
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON,
        )
      }
    }
    if (isQuickRecord) QuickRecordModule.handleIntent(intent)
  }
}
