import { App, Plugin, getCurrentInstance, onUnmounted, useSSRContext, isRef, unref } from 'vue';
import { Router } from 'vue-router'
import { ClientHistoryState } from "./history_state.client"
import { ServerHistoryState } from "./history_state.server"

const HistoryStatePlugin: Plugin = {
  install(app: App, options: HistoryStatePluginOptions) {
    options = options || {}

    const router: Router = app.config.globalProperties.$router
    if (router == null) {
      throw new Error("Vue Router is needed.")
    }

    if (router && router.options.scrollBehavior) {
      options.overrideDefaultScrollBehavior = false;
    } else if (options.overrideDefaultScrollBehavior == null) {
      options.overrideDefaultScrollBehavior = true;
    }

    if ((import.meta as any).env && (import.meta as any).env.SSR) {
      const historyState = new ServerHistoryState(options)
      app.config.globalProperties.$historyState = historyState as HistoryState

      let init = false
      app.mixin({
        beforeCreate() {
          if (init) {
            return
          }

          const context = useSSRContext()
          if (!context) {
            throw new Error('SSRContext is not found')
          }
          historyState._init(context)
          init = true
        }
      })
    } else {
      const historyState = new ClientHistoryState(options || {}, router)
      app.config.globalProperties.$historyState = historyState as HistoryState

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
  data: any
}

export interface HistoryState {
  get action(): string

  get page(): number

  get data(): any

  get length(): number

  getItem(page: number): HistoryItem | undefined

  getItems(): Array<HistoryItem | undefined>

  clearItemData(page: number): HistoryItem | undefined

  findBackPage(location: HistoryLocationRaw, partial?: boolean): number | undefined
}

export function onBackupState(fn: () => {}) {
  if ((import.meta as any).env && (import.meta as any).env.SSR) {
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

function deepUnref(value: any) {
  value = isRef(value) ? unref(value) : value

  if (value != null && typeof value === 'object') {
    const newValue: Record<string, any> = {}
    for (let key in value) {
      const unrefed = deepUnref(value[key])
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

export function useHistoryState() {
  const instance = getCurrentInstance()
  if (instance == null) {
    throw new Error("Current instance is not found.")
  }
  return instance.appContext.config.globalProperties.$historyState
}
