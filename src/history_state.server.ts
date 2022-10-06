import { App, useSSRContext } from 'vue';
import { Router } from 'vue-router';
import { HistoryState, HistoryItem, HistoryLocationRaw, HistoryStatePluginOptions } from './index'

export class ServerHistoryState implements HistoryState {
  private _action = 'navigate'
  private _initialized = false

  constructor(
    app: App,
    public options: HistoryStatePluginOptions
  ) {
    const router: Router = app.config.globalProperties.$router
    if (router == null) {
      throw new Error("Vue Router is needed.")
    }

    router.afterEach((to, from, failure) => {
      this._initialized = false

      if (this.options.debug) {
        this._debug('afterEach')
      }
    })

    app.mixin({
      beforeCreate: () => {
        if (!this._initialized) {
          const ssrContext = useSSRContext()
          if (!ssrContext) {
            throw new Error('SSRContext is not found')
          }
          if (ssrContext.req && ssrContext.req.headers) {
            const cacheControl = ssrContext.req.headers['cache-control'] || ssrContext.req.headers['pragma'];
            if (/^(no-cache|max-age=0)$/.test(cacheControl)) {
              this._action = 'reload'
            }
          }
          this._initialized = true

          if (this.options.debug) {
            this._debug('beforeCreate')
          }
        }
      },
    })
  }

  get action(): string {
    return this._action;
  }

  get page(): number {
    return 0
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get data(): Record<string, any> | undefined {
    return undefined
  }

  get length(): number {
    throw new Error('length is not supported on server.')
  }

  getItem(page: number): HistoryItem | undefined {
    throw new Error('getItem is not supported on server.')
  }

  getItems(): Array<HistoryItem> {
    throw new Error('getItems is not supported on server.')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  clearItemData(page: number): Record<string, any> {
    throw new Error('clearItemData is not supported on server.')
  }

  findBackPage(location: HistoryLocationRaw): number {
    throw new Error('findBackPosition is not supported on server.')
  }

  private _debug(marker: string) {
    console.log(`[${marker}] _page: ${this.page}, _action: ${JSON.stringify(this._action)}`)
  }
}
