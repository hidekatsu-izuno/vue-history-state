import { App, Plugin, getCurrentInstance, onBeforeMount, onUnmounted, reactive } from "vue"
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

export function useRestorableData<T extends object>(
  data: T,
  fn?: (historyState: HistoryState) => (undefined | Partial<T>) | Promise<(undefined | Partial<T>)>,
) {
  const result = reactive(data)
  if ((process as any).server) {
    return result
  }

  const historyState = useHistoryState()
  onBackupState(() => data as any)

  const fnResult = fn ? fn(historyState) : undefined
  if (fnResult || (historyState.visited && historyState.data)) {
    onBeforeMount(async () => {
      await Promise.resolve()

      const hasOwnProperty = Object.prototype.hasOwnProperty

      if (historyState.visited && historyState.data) {
        for (const key in historyState.data) {
          if (hasOwnProperty.call(historyState.data, key)) {
            (result as any)[key] = historyState.data[key]
          }
        }
      }

      const res = await fnResult
      if (res && typeof res === "object") {
        for (const key in res) {
          if (hasOwnProperty.call(res, key)) {
            (result as any)[key] = res[key]
          }
        }
      }
    })
  }

  return result as T
}
