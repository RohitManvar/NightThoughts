package com.nightthoughts

import android.content.Intent
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.uimanager.ViewManager

/**
 * Bridges the Quick Settings tile launch into JS. On cold start the action is
 * held in [pendingAction] until JS asks for it via getInitialAction(); on warm
 * start (app already running) it is emitted as a device event instead.
 */
class QuickRecordModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  init {
    instance = this
  }

  override fun getName(): String = "QuickRecord"

  @ReactMethod
  fun getInitialAction(promise: Promise) {
    promise.resolve(pendingAction)
    pendingAction = null
  }

  private fun emitQuickRecord() {
    reactApplicationContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit(EVENT_NAME, null)
  }

  companion object {
    const val ACTION_QUICK_RECORD = "com.nightthoughts.QUICK_RECORD"
    const val EVENT_NAME = "nightthoughts.quickRecord"

    private var pendingAction: String? = null
    private var instance: QuickRecordModule? = null

    fun handleIntent(intent: Intent?) {
      if (intent?.action != ACTION_QUICK_RECORD) return
      val module = instance
      if (module != null && module.reactApplicationContext.hasActiveReactInstance()) {
        module.emitQuickRecord()
      } else {
        pendingAction = ACTION_QUICK_RECORD
      }
    }
  }
}

class QuickRecordPackage : ReactPackage {
  override fun createNativeModules(
      reactContext: ReactApplicationContext,
  ): List<NativeModule> = listOf(QuickRecordModule(reactContext))

  override fun createViewManagers(
      reactContext: ReactApplicationContext,
  ): List<ViewManager<*, *>> = emptyList()
}
