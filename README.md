# Vue History State Plugin

History state plugin for Vue 3 and Nuxt 3

[![npm version](https://badge.fury.io/js/vue-history-state.svg)](https://badge.fury.io/js/vue-history-state)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Vue History State Plugin is usefull for restoring state when users press "Back" or "Foward".

This plugin is a new version of [nuxt-history-state](https://github.com/hidekatsu-izuno/nuxt-history-state) 
ported to work with Vue 3 and Nuxt 3.

## Features

- Restore the last state when going forward or back.
- Restore the state when reloading.
- Restore the last state when going forward or back after reloading.
- Pass the infomation to a next page.

## Supported Vuersion

- Vue 3.x + Vue-Router 4.x
- Nuxt 3.x

If you want to work with Nuxt 2, you need to use [nuxt-history-state](https://github.com/hidekatsu-izuno/nuxt-history-state).

## Install

Using npm:

```
npm install vue-history-state
```

## Setup

### Vue 3

```javascript
import HistoryStatePlugin from 'vue-history-state'

...

app.use(HistoryStatePlugin, {
  /* optional options */
})
```

### Nuxt 3

```javascript:nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    "vue-history-state/nuxt"
  ],
  historyState: {
    /* optional options */
  }
})
```

### Options

#### maxHistoryLength

Sets the maximum length of hisotries that can hold data.

When this option is not set, it depends on a max history length of a browser.

*Default:* undefined

#### overrideDefaultScrollBehavior

Indicates whether this module override a default scroll behavior of the router.

If you set this option to true, it manages a scroll behavior by using own saved position.

*Default:* true

#### scrollingElements

Indicates to which element the overrode behavior is applied.

If you set this option to a selecter, it applies the scrolling to the selector, in addition to the window.

*Default:* undefined

## Usage

### Reactivity API

If you want to backup data, you have to define a *onBackupState* lifecycle method.

```javascript
import { useHistoryState, onBackupState } from 'vue-history-state'

const historyState = useHistoryState()

// Restore data
const data = reactive(historyState.data || { key: "value" })

// Fetch or restore data
const { data } = useAsyncData(() => $fetch('/api/data'), {
    default: () => (historyState.data || { key: 'value' }),
    immediate: !historyState.data,
    server: false,
})

// Backup data
onBackupState(() => data)
```

#### New SSR-friendly reactivity APIs (experimental)

```javascript
// Backup and restore data
const data = useRestorableState({
  key: "value"
})

// Backup, restore and fetch data
const data = useRestorableState({
  mode: "create",
  key: "value",
}, ({ visited, info }) => {
  if (!visited) {
    if (info?.mode === "update" || info?.mode === "delete") {
      return $fetch("api.example.com").then(res => ({
        ...res,
        mode: info.mode,
      }))
    }
  } else {
    if (info?.refresh) {
      return $fetch("api.example.com")
    }
  }
})
```

### Options API

If you want to backup data, you have to define a *backupData* lifecycle method.

```javascript
export default {
  // Restore data
  data() {
    return this.$historyState.data || { key: "value" }
  }
  // Backup data
  backupData() {
    return this.$data
  }
}
```

## API

### HistoryState

#### action

A action type that caused a navigation.

- navigate: When a new page is navigated.
- reload: When a page is reloaded.
- push: When a history.push is called.
- back: When a back navigation is occurred.
- forward: When a forward navigation is occurred.

By default this method returns basically 'navigate' on server. 
But many browsers send cache-control='maxage=0' when reloading.
It heuristically returns 'reload' then.

#### visited: boolean

If the action is back, forward or reload, this property returns true.

#### canGoBack: boolean / canGoForward: boolean

You can test if you can go back/forward.

This method cannot be used on the server.

#### page: number

A current page number (an integer beginning with 0).

This method always returns 0 on server.

#### data: object?

A backup data.

If you want to clear the backup data, you set undefined to this property.

This method always returns undefined on server.

### info: object?

A transferred data from the previous page.

This method always returns undefined on server.

#### length: number

A history length.

This method cannot be used on server.

#### getItem(page): HistoryItem?

You can get a location and data of the specified page number.

If you set 'overrideDefaultScrollBehavior' option to true, the item has scrollPositions property.

This method cannot use on server.

#### getItems(): HistoryItem[]

You can get a list of item.

This method cannot be used on server.

#### findBackPage(location): number?

You can get a page number of the first matched history, 
searching backward in the continuous same site starting at the current page.
If a history state is not found or is not in the continuous same site, this method will return undefined.

If the partial option sets true, it matches any subset of the location.

This method cannot be used on server.

```javascript
const page = historyState.findBackPage({
    path: '/test'
    // hash: ...
    // query: ...
    // name: ...
    // params: ...
    // partial: true (default: false)
})
if (page != null) {
    historyState.getItem(page).data = undefined

    // go back to the page in site.
    const router = useRouter()
    router.go(page - historyState.page)
}
```

#### push(url: string, info?: Record<string, any>)

This method is almost the same as router.push(url).

If you set info parameter, it passes info data (like a message) to the next page.

#### back(info?: Record<string, any>)

This method is almost the same as window.history.back().

If you set info parameter, it passes info data (like a message) to the backwarded page.

#### forward(info?: Record<string, any>)

This method is almost the same as window.history.forward().

If you set info parameter, it passes info data (like a message) to the forwarded page.

#### goToPage(page: number, info?: Record<string, any>)

This method is almost the same as window.history.go(page - nav.page).

If you set info parameter, it passes info data (like a message) to the page.

#### reload(info?: Record<string, any>)

This method is almost the same as window.location.reload().

### HistoryItem

#### location: { path?, name?, params?, query?, hash? }

A location of this saved page.

#### data: object?

A backup data.

If you want to clear the backup data, you set undefined to this property.

#### scrollPositions: object

A saved scroll positions. A root window is obtained with 'window' key, the others by the selector.

## License

[MIT License](./LICENSE)

Copyright (c) Hidekatsu Izuno (hidekatsu.izuno@gmail.com)
