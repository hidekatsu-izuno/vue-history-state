import { App, Plugin, getCurrentInstance, onBeforeMount, onUnmounted, reactive } from "vue"
import { HistoryState, HistoryStateOptions } from "./history_state.js"
import { ClientHistoryState } from "./history_state.client.js"
import { ServerHistoryState } from "./history_state.server.js"
import { deepUnref } from "./utils/functions.js"

export * from "./history_state.js"

const hasOwnProperty = Object.prototype.hasOwnProperty

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
  const result = reactive<T>(target)
  if ((process as any).server) {
    return result
  }

  const historyState = useHistoryState()
  onBackupState(() => result as any)

  if (historyState.visited) {
    const resPromise = Promise.resolve()
    onBeforeMount(async () => {
      await resPromise
      if (historyState.data) {
        for (const key in historyState.data) {
          if (hasOwnProperty.call(historyState.data, key)) {
            (result as any)[key] = historyState.data[key]
          }
        }
      }
    })
  }

  return result
}

export async function useRestorableAsyncData<T extends object>(
  target: T,
  fn: (historyState: HistoryState) => Partial<T> | Promise<Partial<T>>,
) {
  const result = reactive(target)
  if ((process as any).server) {
    return result
  }

  const historyState = useHistoryState()
  onBackupState(() => result as any)

  const resPromise = fn(historyState)
  onBeforeMount(async () => {
    const res = await resPromise

    if (historyState.visited && historyState.data) {
      for (const key in historyState.data) {
        if (hasOwnProperty.call(historyState.data, key)) {
          (result as any)[key] = historyState.data[key]
        }
      }
    }

    if (res && typeof res === "object") {
      for (const key in res) {
        if (hasOwnProperty.call(res, key)) {
          (result as any)[key] = res[key]
        }
      }
    }
  })

  await resPromise
  return result
}
