import { App, useSSRContext } from "vue"
import { Router } from "vue-router"
import { HistoryState, HistoryItem, HistoryLocationRaw, HistoryStateOptions, NavigationType } from "./history_state.js"

export class ServerHistoryState implements HistoryState {
  private _action: NavigationType = "navigate"
  private _initialized = false

  constructor(
    app: App,
    public options: HistoryStateOptions
  ) {
    const router: Router = app.config.globalProperties.$router
    if (router == null) {
      throw new Error("Vue Router is needed.")
    }

    router.afterEach((to, from, failure) => {
      this._initialized = false

      if (this.options.debug) {
        this._debug("afterEach")
      }
    })

    app.mixin({
      beforeCreate: () => {
        if (!this._initialized) {
          const ssrContext = useSSRContext()
          if (!ssrContext) {
            throw new Error("SSRContext is not found")
          }
          if (ssrContext.req && ssrContext.req.headers) {
            const cacheControl = ssrContext.req.headers["cache-control"] || ssrContext.req.headers["pragma"];
            if (/^(no-cache|max-age=0)$/.test(cacheControl)) {
              this._action = "reload"
            }
          }
          this._initialized = true

          if (this.options.debug) {
            this._debug("beforeCreate")
          }
        }
      },
    })
  }

  get action(): NavigationType {
    return this._action;
  }

  get visited(): boolean {
    return this._action === "reload"
  }

  get page(): number {
    return 0
  }

  get data(): Record<string, any> | undefined {
    return undefined
  }

  set data(value: Record<string, unknown> | undefined) {
    throw new Error("data is not supported on server.")
  }

  get info(): Record<string, any> | undefined {
    return undefined
  }

  get canGoBack(): boolean {
    throw new Error("canGoBack is not supported on server.")
  }

  get canGoForward(): boolean {
    throw new Error("canGoForward is not supported on server.")
  }

  get length(): number {
    throw new Error("length is not supported on server.")
  }

  getItem(page: number): HistoryItem | undefined {
    throw new Error("getItem is not supported on server.")
  }

  getItems(): Array<HistoryItem> {
    throw new Error("getItems is not supported on server.")
  }

  clearItemData(page: number): Record<string, any> | undefined {
    throw new Error("clearItemData is not supported on server.")
  }

  findBackPage(location: HistoryLocationRaw): number | undefined {
    throw new Error("findBackPosition is not supported on server.")
  }

  push(url: string, info?: Record<string, any>): void {
    throw new Error("push is not supported on server.")
  }

  back(info?: Record<string, any>): void {
    throw new Error("back is not supported on server.")
  }

  forward(info?: Record<string, any>): void {
    throw new Error("forward is not supported on server.")
  }

  goToPage(page: number, info?: Record<string, any>): void {
    throw new Error("goToPage is not supported on server.")
  }

  reload(info?: Record<string, any>): void {
    throw new Error("reload is not supported on server.")
  }

  private _debug(marker: string) {
    console.log(`[${marker}] _page: ${this.page}, _action: ${JSON.stringify(this._action)}`)
  }
}
