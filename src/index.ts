import { App, Plugin, getCurrentInstance, onMounted, onUnmounted, reactive } from "vue"
import { HistoryState, HistoryStateOptions } from "./history_state.js"
import { ClientHistoryState } from "./history_state.client.js"
import { ServerHistoryState } from "./history_state.server.js"
import { deepUnref } from "./utils/functions.js"

export * from "./history_state.js"

const HistoryStatePlugin: Plugin = {
  install(app: App, options: HistoryStateOptions) {
    options = options || {}

    if (typeof window === "undefined") {
      app.config.globalProperties.$historyState = new ServerHistoryState(app, options)
    } else {
      app.config.globalProperties.$historyState = new ClientHistoryState(app, options)

      app.mixin({
        created() {
          if (typeof this.$options.backupData === "function") {
            onBackupState(() => this.$options.backupData.call(this))
          }
        }
      })
    }
  }
}

export default HistoryStatePlugin

export function onBackupState(fn: () => Record<string, unknown>) {
  if (typeof window === "undefined") {
    // no handle
  } else {
    const instance = getCurrentInstance()
    if (instance == null) {
      throw new Error("Current instance is not found.")
    }

    const backupDataFn = () => deepUnref(fn.call(instance))

    const historyState = instance.appContext.config.globalProperties.$historyState
    historyState._register(backupDataFn)

    onUnmounted(() => {
      historyState._unregister(backupDataFn)
    })
  }
}

export function useHistoryState(): HistoryState {
  const instance = getCurrentInstance()
  if (instance == null) {
    throw new Error("Current instance is not found.")
  }
  return instance.appContext.config.globalProperties.$historyState
}

export function useRestorableData<T extends object>(target: T) {
  const keys = Object.keys(target)
  const result = reactive<T>(target)

  if (!(process as any).server) {
    onBackupState(() => result as any)
  }

  onMounted(() => {
    const historyState = useHistoryState()
    if (historyState.data) {
      for (const key of keys) {
        result[key] = historyState.data[key]
      }
    }
  })

  return result
}
