import { App, Plugin, getCurrentInstance, onUnmounted, isRef, unref } from 'vue';
import { ClientHistoryState } from './history_state.client'
import { ServerHistoryState } from "./history_state.server"

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

export declare type HistoryLocationRaw = {
  path?: string
  query?: Record<string, (string | number | null)[] | string | number | null>
  hash?: string
  name?: string | symbol | null
  params?: Record<string, (string | number | null)[] | string | number | null>
}

export declare type HistoryLocation = {
  path?: string
  query?: Record<string, string[] | string>
  hash?: string
  name?: string | symbol
  params?: Record<string, (string | null)[] | string | null>
}

export declare type HistoryItem = {
  location: HistoryLocation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any> | undefined
  scrollPositions?: Record<string, { left: number, top: number }>
}

export interface HistoryState {
  get action(): string

  get page(): number

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get data(): Record<string, any> | undefined

  get length(): number

  getItem(page: number): HistoryItem | undefined

  getItems(): Array<HistoryItem>

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

function deepUnref(value: unknown) {
  value = isRef(value) ? unref(value) : value

  if (value != null && typeof value === 'object') {
    const newValue: Record<string, unknown> = {}
    for (const key in value) {
      const unrefed = deepUnref((value as Record<string, unknown>)[key])
      if (unrefed !== undefined) {
        newValue[key] = unrefed
      }
    }
    return newValue
  } else if (Array.isArray(value)) {
    const newValue = new Array(value.length)
    for (let i = 0; i < value.length; i++) {
      const unrefed = deepUnref(value[i])
      if (unrefed !== undefined) {
        newValue[i] = unrefed
      } else {
        newValue[i] = null
      }
    }
    return newValue
  } else if (value != null && (typeof value === 'function' || typeof value === 'symbol')) {
    return undefined
  } else {
    return value
  }
}

export function useHistoryState(): HistoryState {
  const instance = getCurrentInstance()
  if (instance == null) {
    throw new Error("Current instance is not found.")
  }
  return instance.appContext.config.globalProperties.$historyState
}
