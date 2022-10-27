
export declare type HistoryStateOptions = {
  maxHistoryLength?: number
  overrideDefaultScrollBehavior?: boolean
  scrollingElements?: string | string[]
  debug?: boolean
}

export declare type NavigationType = "navigate" | "push" | "reload" | "back" | "forward"

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
  get action(): NavigationType

  get visited(): boolean

  get page(): number

  get data(): Record<string, any> | undefined

  set data(value: Record<string, unknown> | undefined)

  get info(): any | undefined

  get canGoBack(): boolean

  get canGoForward(): boolean

  get length(): number

  getItem(page: number): HistoryItem | undefined

  getItems(): Array<HistoryItem>

  clearItemData(page: number): Record<string, any> | undefined

  findBackPage(location: HistoryLocationRaw, partial?: boolean): number | undefined

  push(url: string, info?: any): void

  reload(info?: any): void

  back(info?: any): void

  forward(info?: any): void

  goToPage(page: number, info?: any): void
}
