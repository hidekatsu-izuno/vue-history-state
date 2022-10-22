import { App, Plugin, getCurrentInstance, onUnmounted } from 'vue';
import { HistoryState } from 'vue-router';
import { HistoryStateOptions } from './history_state';
import { ClientHistoryState } from './history_state.client'
import { ServerHistoryState } from "./history_state.server"
import { deepUnref } from './utils/functions'

export * from './history_state'

const HistoryStatePlugin: Plugin = {
  install(app: App, options: HistoryStateOptions) {
    options = options || {}

    if (typeof window === 'undefined') {
      app.config.globalProperties.$historyState = new ServerHistoryState(app, options)
    } else {
      app.config.globalProperties.$historyState = new ClientHistoryState(app, options)

      app.mixin({
        created() {
          if (typeof this.$options.backupData === 'function') {
            onBackupState(this.$options.backupData)
          }
        }
      })
    }
  }
}

export default HistoryStatePlugin

export function onBackupState(fn: () => Record<string, unknown>) {
  if (typeof window === 'undefined') {
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
