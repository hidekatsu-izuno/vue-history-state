import { nextTick } from 'vue'
import { Router } from 'vue-router'
import LZString from 'lz-string'
import { HistoryState, HistoryLocation, HistoryLocationRaw } from './history_state'

export class ClientHistoryState implements HistoryState {
  private _action = 'navigate'
  private _page = 0
  private _items = new Array<[HistoryLocation, any, Record<string, [number, number]>?] | []>([])
  private _dataFuncs = new Array<() => {}>()
  private _route?: HistoryLocation = undefined

  constructor(
    public options: Record<string, any>,
    router: Router
  ) {
    try {
      if (window.sessionStorage) {
        const backupText = sessionStorage.getItem('vue-history-state')
        if (backupText) {
          sessionStorage.removeItem('vue-history-state')
          try {
            const backupState = JSON.parse(LZString.decompressFromUTF16(backupText))
            this._action = 'reload'
            this._page = backupState[0]
            this._items = backupState[1]
          } catch (error) {
            console.error('Failed to restore from sessionStorage.', error)
          }
        } else if (getNavigationType() === 'reload') {
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
            console.log('unload', JSON.stringify(this))
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
        console.log('beforeResolve', JSON.stringify(this))
      }
    })

    const orgPush = router.options.history.push
    router.options.history.push = (to, data) => {
      this._action = 'push'
      this._page++

      if (this.options.debug) {
        console.log('push', JSON.stringify(this))
      }

      return orgPush.call(router.options.history, to, data)
    }
    
    router.afterEach((to, from, failure) => {
      const page = window.history.state && window.history.state.page
      if (page != null && page !== this._page) {
        if (page < this._page) {
          this._action = 'back'
        } else if (page > this._page) {
          this._action = 'forward'
        }
        this._page = page
      }

      if (this._page > this._items.length) {
        this._page = this._items.length
      }

      this._route = filterRoute(to)

      if (!failure && this._action === 'reload') {
        const backupRoute = this._items[this._page] && this._items[this._page][0]
        if (backupRoute != null && !isSameRoute(backupRoute, this._route)) {
          const navType = getNavigationType()
          if (navType === 'back_forward') {
            if (this._page + 1 < this._items.length &&
              this._items[this._page + 1] &&
              this._items[this._page + 1][0] &&
              isSameRoute(this._items[this._page + 1][0], this._route)
            ) {
              this._action = 'forward'
              this._page = this._page + 1
            } else if (this._page > 0 &&
              this._items[this._page - 1] &&
              this._items[this._page - 1][0] &&
              isSameRoute(this._items[this._page - 1][0], this._route)
            ) {
              this._action = 'back'
              this._page = this._page - 1
            } else {
              this._action = 'back'
              this._items[this._page] = []
            }
          } else if (navType !== 'reload') {
            this._action = 'navigate'
            this._items[this._page] = []
          }
        }
      }

      if (!this._items[this._page]) {
        this._items[this._page] = []
      }

      if (page == null) {
        window.history.replaceState({
          ...window.history.state,
          page: this._page
        }, '')  
      }

      if (this.options.debug) {
        console.log('afterEach', JSON.stringify(this))
      }
    })

    if (this.options.overrideDefaultScrollBehavior) {
      router.options.scrollBehavior = async (to, from) => {
        if (to.hash) {
          return { el: to.hash }
        }

        if (this._items[this._page] &&
          this._items[this._page][2] &&
          (this._action == 'back' || this._action == 'forward')) {
          const positions = this._items[this._page][2]

          if (this.options.scrollingElements) {
            let scrollingElements = this.options.scrollingElements
            if (!Array.isArray(scrollingElements)) {
              scrollingElements = [ scrollingElements ]
            }
            nextTick(async () => {
              for (let i = 0; i < 10; i++) {
                if (i > 0) {
                  // wait 10ms * 10 = 100ms
                  await new Promise(resolve => setTimeout(resolve, 10));
                }

                for (const selector of scrollingElements) {
                  const elem = document.querySelector(selector)
                  const position = positions[selector]
                  if (elem && position) {
                    elem.scrollTo(position[0], position[1])
                  }
                }
              }
            })
          }

          if (positions.window) {
            return {
              left: positions.window[0],
              top: positions.window[1],
            }
          }
        }

        return { left: 0, top: 0 }
      }
    }
  }

  /** @internal */
  _register(fn: () => {}) {
    const index = this._dataFuncs.indexOf(fn)
    if (index == -1) {
      this._dataFuncs.push(fn)
    }
  }

  /** @internal */
  _unregister(fn: () => {}) {
    const index = this._dataFuncs.indexOf(fn)
    if (index > -1) {
      this._dataFuncs.splice(index, 1)
    }
  }

  get action() {
    return this._action
  }

  get page() {
    return this._page
  }

  get data() {
    const item = this._items[this._page]
    return item && item[1]
  }

  get length() {
    return this._items.length
  }

  getItem(page: number) {
    if (page >= this._items.length) {
      return undefined
    }

    const item = this._items[page]
    return {
      location: (item && item[0]) || {},
      data: item && item[1]
    }
  }

  getItems() {
    const items = []
    for (let i = 0; i < this._items.length; i++) {
      items.push(this.getItem(i))
    }
    return items
  }

  clearItemData(page: number) {
    if (page >= this._items.length) {
      return undefined
    }

    const item = this._items[page]
    if (item) {
      const data = item[1]
      item[1] = null
      return data
    }
    return undefined
  }

  findBackPage(location: HistoryLocationRaw, partial?: boolean) {
    if (typeof location === 'string') {
      location = { path: location }
    }

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

    const normalized = filterRoute(location)
    for (let pos = this._page - 1; pos >= 0; pos--) {
      const backLocation = this._items[pos][0]
      if (!backLocation) {
        continue
      }

      if (partial) {
        if (isMatchedRoute(backLocation, normalized)) {
          return pos - this._page
        }
      } else {
        if (isSameRoute(backLocation, normalized)) {
          return pos - this._page
        }
      }
    }
    return undefined
  }

  private _save() {
    this._items[this._page][0] = this._route

    if (this._dataFuncs != null) {
      const backupData = this._dataFuncs.reduce((prev, current) => {
        return Object.assign(prev, current())
      }, {})
      this._items[this._page][1] = backupData
    }

    if (this.options.overrideDefaultScrollBehavior) {
      const positions = {}
      if (this.options.scrollingElements) {
        let scrollingElements = this.options.scrollingElements
        if (!Array.isArray(scrollingElements)) {
          scrollingElements = [scrollingElements]
        }
        for (const selector of scrollingElements) {
          const elem = document.querySelector(selector)
          if (elem) {
            positions[selector] = [elem.scrollLeft, elem.scrollTop]
          }
        }
      }
      positions['window'] = [window.pageXOffset, window.pageYOffset]
      this._items[this._page][2] = positions
    }

    const maxPage = Math.min(this.options.maxHistoryLength || window.history.length, window.history.length)
    if (this._items.length > maxPage) {
      for (let page = 0; page < this._items.length - maxPage; page++) {
        this._items[page] = []
      }
    }
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
      const params = {}
      for (let key in route.params) {
        const param = route.params[key]
        if (Array.isArray(param)) {
          const params = new Array<string>()
          for (let i = 0; i < param.length; i++) {
            if (param != null) {
              params.push(param[i].toString())
            }
          }
          params[key] = params
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
    const query = {}
    for (let key in route.query) {
      const param = route.query[key]
      if (Array.isArray(param)) {
        const params = new Array<string | null>()
        for (let i = 0; i < param.length; i++) {
          if (param === null) {
            params.push(null)
          } else if (param != undefined) {
            params.push(param[i].toString())
          }
        }
        query[key] = params
      } else if (param === null) {
        query[key] = null
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

function isSameRoute(a: Record<string, any>, b?: Record<string, any>) {
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

function isObjectEqual(a: any, b: any): boolean {
  if (!a || !b) {
    return a === b
  }

  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)
  if (aKeys.length !== bKeys.length) {
    return false
  }

  return aKeys.every(key => {
    const aVal = a[key]
    const bVal = b[key]
    if (typeof aVal === 'object' && typeof bVal === 'object') {
      return isObjectEqual(aVal, bVal)
    }
    return String(aVal) === String(bVal)
  })
}

function isObjectMatch(a: any, b: any): boolean {
  if (a === b || a != null && b == null) {
    return true
  }

  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)
  if (aKeys.length < bKeys.length) {
    return false
  }

  return bKeys.every(key => {
    const aVal = a[key]
    const bVal = b[key]
    if (aVal != null && bVal == null) {
      return true
    } else if (typeof aVal === 'object' && typeof bVal === 'object') {
      return isObjectMatch(aVal, bVal)
    }
    return String(aVal) === String(bVal)
  })
}
