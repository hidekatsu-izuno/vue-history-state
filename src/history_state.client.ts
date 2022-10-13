import { App, nextTick } from 'vue'
import { Router } from 'vue-router'
import LZString from 'lz-string'
import { HistoryStatePluginOptions, HistoryState, HistoryLocation, HistoryLocationRaw, onBackupState, HistoryItem } from './index'
import { isObjectEqual, isObjectMatch, deepUnref } from './utils/functions'

export class ClientHistoryState implements HistoryState {
  private _action = 'navigate'
  private _page = 0
  private _items = new Array<[
    ('navigate' | 'push')?,
    (HistoryLocation)?,
    (Record<string, any> | null)?,
    (Record<string, { left: number, top: number }>)?,
  ]>([])
  private _dataFuncs = new Array<() => Record<string, unknown>>()
  private _route?: HistoryLocation = undefined

  constructor(
    app: App,
    public options: HistoryStatePluginOptions,
  ) {
    const router: Router = app.config.globalProperties.$router
    if (router == null) {
      throw new Error("Vue Router is needed.")
    }

    if (router && router.options.scrollBehavior) {
      options.overrideDefaultScrollBehavior = false;
    } else if (options.overrideDefaultScrollBehavior == null) {
      options.overrideDefaultScrollBehavior = true;
    }

    try {
      const navType = getNavigationType()
      if (window.sessionStorage) {
        const backupText = sessionStorage.getItem('vue-history-state')
        if (backupText) {
          sessionStorage.removeItem('vue-history-state')
          try {
            const backupState = JSON.parse(LZString.decompressFromUTF16(backupText) || '[]')
            this._page = backupState[0]
            this._items = backupState[1]
            if (navType === 'navigate') {
              this._action = 'navigate'
              this._page = this._page + 1
            } else {
              this._action = 'reload'
            }
          } catch (error) {
            console.error('Failed to restore from sessionStorage.', error)
          }
        } else if (navType === 'reload') {
          console.error('The saved history state is not found.')
        }

        window.addEventListener('unload', event => {
          this._save()

          try {
            sessionStorage.setItem('vue-history-state', LZString.compressToUTF16(JSON.stringify([
              this._page,
              this._items
            ])))
          } catch (error) {
            console.error('Failed to save to sessionStorage.', error)
          }

          if (this.options.debug) {
            this._debug('unload')
          }
        })
      }
    } catch (error) {
      console.error('Failed to access to sessionStorage.', error)
    }

    router.beforeResolve(to => {
      if (this._route) {
        this._save()
        this._dataFuncs.length = 0
      }

      if (this.options.debug) {
        this._debug('beforeResolve')
      }
    })

    const orgPush = router.options.history.push
    router.options.history.push = (to, data) => {
      const ret = orgPush.call(router.options.history, to, data)

      this._action = 'push'
      this._page++

      if (this.options.debug) {
        this._debug('push')
      }

      return ret
    }

    router.afterEach((to, from, failure) => {
      this._route = filterRoute(to)

      const page = window.history.state && window.history.state.page
      if (page != null && page !== this._page) {
        if (page < this._page) {
          this._action = 'back'
        } else if (page > this._page) {
          this._action = 'forward'
        }
        this._page = page
      } else if (this._action === 'reload' && getNavigationType() === 'back_forward') {
        if (page >= this._page) {
          this._action = 'forward'
        } else {
          this._action = 'back'
        }
        if (page != null) {
          this._page = page
        }
      }

      if (this._page > this._items.length) {
        this._page = this._items.length
      }

      if (this._action === 'navigate' || this._action === 'push') {
        this._items.length = this._page + 1
        this._items[this._page] = []
      } else if (!this._items[this._page]) {
        this._items[this._page] = []
      }

      if (page == null) {
        window.history.replaceState({
          ...window.history.state,
          page: this._page
        }, '')
      }

      if (this.options.debug) {
        this._debug('afterEach')
      }
    })

    app.mixin({
      created() {
        if (typeof this.$options.backupData === 'function') {
          onBackupState(this.$options.backupData)
        }
      }
    })

    if (this.options.overrideDefaultScrollBehavior) {
      router.options.scrollBehavior = async (to, from) => {
        if (to.hash) {
          return { el: to.hash }
        }

        let positions: Record<string, { left: number, top: number }> | null | undefined = undefined
        if (
          (this._action == 'back' || this._action == 'forward' || this._action == 'reload')
          && this._items[this._page]
          && (positions = this._items[this._page][3])
        ) {

          if (this.options.scrollingElements) {
            let scrollingElements = this.options.scrollingElements
            if (!Array.isArray(scrollingElements)) {
              scrollingElements = [scrollingElements]
            }
            nextTick(async () => {
              for (let i = 0; i < 10; i++) {
                if (i > 0) {
                  // wait 10ms * 10 = 100ms
                  await new Promise(resolve => setTimeout(resolve, 10));
                }

                for (const selector of scrollingElements) {
                  const elem = document.querySelector(selector)
                  const position = positions && positions[selector]
                  if (elem && position) {
                    elem.scrollTo(position.left, position.top)
                  }
                }
              }
            })
          }

          if (positions.window) {
            return positions.window
          }
        }

        return { left: 0, top: 0 }
      }
    }
  }

  /** @internal */
  _register(fn: () => Record<string, unknown>) {
    const index = this._dataFuncs.indexOf(fn)
    if (index == -1) {
      this._dataFuncs.push(fn)
    }
  }

  /** @internal */
  _unregister(fn: () => Record<string, unknown>) {
    const index = this._dataFuncs.indexOf(fn)
    if (index > -1) {
      this._dataFuncs.splice(index, 1)
    }
  }

  get action(): string {
    return this._action
  }

  get page(): number {
    return this._page
  }

  get data(): Record<string, any> | undefined {
    const item = this._items[this._page]
    return (item && item[2]) || undefined
  }

  set data(value: Record<string, unknown> | undefined) {
    const item = this._items[this._page]
    if (item) {
      item[2] = deepUnref(value) ?? null
    }
  }

  get length(): number {
    return this._items.length
  }

  getItem(page: number): HistoryItem | undefined {
    if (page >= this._items.length) {
      return undefined
    }

    const item = this._items[page]
    return new HistoryItemImpl(item)
  }

  getItems(): Array<HistoryItem> {
    const items = []
    for (let i = 0; i < this._items.length; i++) {
      const item = this._items[i]
      items.push(new HistoryItemImpl(item))
    }
    return items
  }

  /**
   * @deprecated Use getItem(page).data = undefined
   */
  clearItemData(page: number): Record<string, any> | undefined {
    const item = this.getItem(page)
    if (item) {
      const data = item.data
      item.data = undefined
      return data
    }
    return undefined
  }

  findBackPage(location: HistoryLocationRaw, partial?: boolean): number | undefined {
    if (typeof location === 'string') {
      location = { path: location }
    }

    partial = partial ?? location.partial

    if (location.path) {
      const parsed = parseFullPath(location.path)
      if (parsed) {
        location.path = parsed.path
        if (!location.hash) {
          location.hash = parsed.hash
        }
        if (!location.query) {
          location.query = parsed.query
        }
      }
    }

    const action = this._items[this._page][0]
    if (action !== 'navigate') {
      const normalized = filterRoute(location)
      for (let page = this._page - 1; page >= 0; page--) {
        const backLocation = this._items[page][1]
        if (backLocation) {
          if (partial) {
            if (isMatchedRoute(backLocation, normalized)) {
              return page
            }
          } else {
            if (isSameRoute(backLocation, normalized)) {
              return page
            }
          }
        }

        const backAction = this._items[page][0]
        if (backAction === 'navigate') {
          break
        }
      }
    }
    return undefined
  }

  private _save() {
    if (this._action === 'navigate') {
      this._items[this._page][0] = 'navigate'
    } else if (this._action === 'push') {
      this._items[this._page][0] = 'push'
    }

    this._items[this._page][1] = this._route

    if (this._dataFuncs != null) {
      const backupData = this._dataFuncs.reduce((prev, current) => {
        return Object.assign(prev, current())
      }, {})
      this._items[this._page][2] = backupData
    }

    if (this.options.overrideDefaultScrollBehavior) {
      const positions: Record<string, { left: number, top: number }> = {}
      if (this.options.scrollingElements) {
        let scrollingElements = this.options.scrollingElements
        if (!Array.isArray(scrollingElements)) {
          scrollingElements = [scrollingElements]
        }
        for (const selector of scrollingElements) {
          const elem = document.querySelector(selector)
          if (elem) {
            positions[selector] = { left: elem.scrollLeft, top: elem.scrollTop }
          }
        }
      }
      positions['window'] = { left: window.pageXOffset, top: window.pageYOffset }
      this._items[this._page][3] = positions
    }

    const maxPage = Math.min(this.options.maxHistoryLength || window.history.length, window.history.length)
    if (this._items.length > maxPage) {
      for (let page = 0; page < this._items.length - maxPage; page++) {
        this._items[page] = []
      }
    }
  }

  private _debug(marker: string) {
    console.log(`[${marker}] page: ${this._page}, action: ${JSON.stringify(this._action)}, route: ${JSON.stringify(this._route)}\n` +
      this._items.reduce((prev1: unknown, current1: Array<unknown>, index) => {
        return `${prev1}  items[${index}] action: ${JSON.stringify(current1[0])}, route: ${JSON.stringify(current1[1])}, data: ${JSON.stringify(current1[2])}, scrollPositions: ${JSON.stringify(current1[3])}\n`
      }, '')
    )
  }
}

class HistoryItemImpl implements HistoryItem {
  constructor(
    private item: [
      ('navigate' | 'push')?,
      (HistoryLocation)?,
      (Record<string, any> | null)?,
      (Record<string, { left: number, top: number }>)?,
    ]
  ) {
  }

  get location(): HistoryLocation {
    return this.item[1] || {}
  }

  get data(): Record<string, any> | undefined {
    return this.item[2] ?? undefined
  }

  set data(value: Record<string, unknown> | undefined) {
    this.item[2] = deepUnref(value) ?? null
  }

  get scrollPositions(): Record<string, { left: number, top: number }> {
    return this.item[3] || {}
  }
}

function getNavigationType() {
  if (window.performance) {
    const navi = window.performance.getEntriesByType &&
      window.performance.getEntriesByType('navigation')
    if (navi && navi.length) {
      return (navi[0] as PerformanceNavigationTiming).type
    } else if (window.performance.navigation) {
      switch (window.performance.navigation.type) {
        case 0: return 'navigate'
        case 1: return 'reload'
        case 2: return 'back_forward'
        default: return 'prerender'
      }
    }
  }
  return 'navigate'
}

function parseFullPath(path: string) {
  let hash = undefined
  let query = undefined

  const hashIndex = path.indexOf('#')
  if (hashIndex >= 0) {
    hash = path.slice(hashIndex)
    path = path.slice(0, hashIndex)
  }

  const qparamsIndex = path.indexOf('?')
  if (qparamsIndex >= 0) {
    query = parseQuery(path.slice(qparamsIndex + 1))
    path = path.slice(0, qparamsIndex)
  }

  return {
    path,
    hash,
    query
  }
}

function parseQuery(qparams?: string): Record<string, string[] | string | null> | undefined {
  qparams = qparams && qparams.replace(/^(\?|#|&)/, '')
  if (!qparams) {
    return undefined
  }

  const result: Record<string, string[] | string | null> = {}
  qparams.split('&').forEach(qparam => {
    const qparamIndex = qparam.indexOf('=')
    let qname = qparam
    let qvalue = ''
    if (qparamIndex >= 0) {
      qname = decodeURIComponent(qparam.slice(0, qparamIndex))
      qvalue = decodeURIComponent(qparam.slice(qparamIndex + 1))
    }

    const prevQvalue = result[qname]
    if (!prevQvalue) {
      result[qname] = qvalue
    } else if (Array.isArray(prevQvalue)) {
      prevQvalue.push(qvalue)
    } else {
      result[qname] = [prevQvalue, qvalue]
    }
  })
  return result
}

function filterRoute(route: HistoryLocationRaw): HistoryLocation {
  const filtered: HistoryLocation = {}
  if (route.path != null && route.path.length > 0) {
    filtered.path = route.path
  }

  if (route.name != null && (typeof route.name === 'symbol' || route.name.length > 0)) {
    filtered.name = route.name
    if (route.params) {
      const params: Record<string, string | null | (string | null)[]> = {}
      for (const key in route.params) {
        const param = route.params[key]
        if (Array.isArray(param)) {
          const nparams = new Array<string>()
          for (let i = 0; i < param.length; i++) {
            const nparam = param[i]
            if (nparam != null) {
              nparams.push(nparam.toString())
            }
          }
          params[key] = nparams
        } else if (param != null) {
          params[key] = param.toString()
        }
      }

      if (Object.keys(params).length > 0) {
        filtered.params = params
      }
    }
  }

  if (route.query) {
    const query: Record<string, string | string[]> = {}
    for (const key in route.query) {
      const param = route.query[key]
      if (Array.isArray(param)) {
        const nparams = new Array<string>()
        for (let i = 0; i < param.length; i++) {
          const nparam = param[i]
          if (nparam === null) {
            nparams.push('')
          } else if (nparam != undefined) {
            nparams.push(nparam.toString())
          }
        }
        query[key] = nparams
      } else if (param === null) {
        query[key] = ''
      } else if (param != undefined) {
        query[key] = param.toString()
      }
    }

    if (Object.keys(query).length > 0) {
      filtered.query = query
    }
  }

  if (route.hash) {
    filtered.hash = route.hash
  }

  return filtered
}

const trailingSlashRE = /\/?$/

function isMatchedRoute(a: HistoryLocation, b?: HistoryLocation) {
  if (!b) {
    return false
  } else if (a.path && b.path) {
    return (
      a.path.replace(trailingSlashRE, '') === b.path.replace(trailingSlashRE, '') &&
      (b.hash == null || a.hash === b.hash) &&
      isObjectMatch(a.query, b.query)
    )
  } else if (a.name && b.name) {
    return (
      a.name === b.name &&
      (b.hash == null || a.hash === b.hash) &&
      isObjectMatch(a.query, b.query) &&
      isObjectMatch(a.params, b.params)
    )
  }
  return false
}

function isSameRoute(a: HistoryLocation, b?: HistoryLocation) {
  if (!b) {
    return false
  } else if (a.path && b.path) {
    return (
      a.path.replace(trailingSlashRE, '') === b.path.replace(trailingSlashRE, '') &&
      a.hash === b.hash &&
      isObjectEqual(a.query, b.query)
    )
  } else if (a.name && b.name) {
    return (
      a.name === b.name &&
      a.hash === b.hash &&
      isObjectEqual(a.query, b.query) &&
      isObjectEqual(a.params, b.params)
    )
  }
  return false
}
