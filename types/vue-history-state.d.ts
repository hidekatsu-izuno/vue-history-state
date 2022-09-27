import Vue, { App, Plugin } from 'vue'

declare module 'vue/types/vue' {
  interface Vue {
    $histroyState: HistoryState
  }
}

export declare type HistoryStatePluginOptions = {
  maxHistoryLength?: number
  overrideDefaultScrollBehavior?: boolean
  scrollingElements?: string | string[]
  debug?: boolean
}
/*
export const HistoryStatePlugin : Plugin {
  install: ((app: App, options: HistoryStatePluginOptions) => any)
}
*/
export declare function onBackupState(fn: () => {}): void

export declare function useHistoryState(): HistoryState

export declare type HistoryLocationRaw = {
  path?: string
  query?: Record<string, (string | number)[] | string | number>
  hash?: string
  name?: string | symbol
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
