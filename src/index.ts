import { App, Plugin, getCurrentInstance, onUnmounted } from 'vue';
import { ClientHistoryState } from './history_state.client'
import { ServerHistoryState } from "./history_state.server"
import { deepUnref } from './utils/functions'

const HistoryStatePlugin: Plugin = {
  install(app: App, options: HistoryStatePluginOptions) {
    options = options || {}

    if (typeof window === 'undefined') {
      app.config.globalProperties.$historyState = new ServerHistoryState(app, options)
    } else {
      app.config.globalProperties.$historyState = new ClientHistoryState(app, options)
    }
  }
}

export default HistoryStatePlugin

export declare type HistoryStatePluginOptions = {
  maxHistoryLength?: number
  overrideDefaultScrollBehavior?: boolean
  scrollingElements?: string | string[]
  debug?: boolean
}

export declare type HistoryLocationRaw = string | {
  path?: string
  query?: Record<string, (string | number | null)[] | string | number | null>
  hash?: string
  name?: string | symbol | null
  params?: Record<string, (string | number | null)[] | string | number | null>
  partial?: boolean
}

export declare type HistoryLocation = {
  path?: string
  query?: Record<string, string[] | string>
  hash?: string
  name?: string | symbol
  params?: Record<string, (string | null)[] | string | null>
}

export interface HistoryItem {
  get location(): HistoryLocation

  get data(): Record<string, any> | undefined

  set data(value: Record<string, any> | undefined)

  get scrollPositions(): Record<string, { left: number, top: number }> | undefined
}

export interface HistoryState {
  get action(): string

  get page(): number

  get data(): Record<string, any> | undefined

  get length(): number

  getItem(page: number): HistoryItem | undefined

  getItems(): Array<HistoryItem>

  clearItemData(page: number): Record<string, any> | undefined

  findBackPage(location: HistoryLocationRaw, partial?: boolean): number | undefined
}

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
