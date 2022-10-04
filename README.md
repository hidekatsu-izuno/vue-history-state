# Vue History State Plugin

History state plugin for Vue 3 and Nuxt 3

[![npm version](https://badge.fury.io/js/vue-history-state.svg)](https://badge.fury.io/js/vue-history-state)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Vue History State Plugin is usefull for restoring state when users press "Back" or "Foward".

This plugin is a new version of [nuxt-history-state](https://github.com/hidekatsu-izuno/nuxt-history-state) 
ported to work with Vue 3 and Nuxt 3.

## Features

- Restore a last state when going forward or back.
- Restore a state when reloading.
- Restore a last state when going forward or back after reloading.

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

```javascript
import HistoryStatePlugin from 'vue-history-state'

export default defineNuxtPlugin(app => {
  app.vueApp.use(HistoryStatePlugin, {
    /* optional options */
  })
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

// Backup data
onBackupState(() => data)
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

### historyState

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

#### page

A current page number (an integer beginning with 0).

This method always returns 0 on server.

#### data

A backup data.

This method always returns undefined on server.

#### length

A history length.

This method cannot be used on server.

#### getItem(page)

You can get a location and data of the specified page number.

This method cannot use on server.

#### getItems()

You can get a list of item.

This method cannot be used on server.

#### findBackPage(location, partial = false)

You can get the relative position of the first matched history, 
searching backward starting at the current page.
If a history state is not found, this method will return undefined.

If the partial option sets true, it matches any subset of the location.

This method cannot be used on server.

```javascript
const delta = historyState.findBackPage({
    path: 'test'
    // hash: ...
    // query: ...
    // name: ...
    // params: ...
})
if (delta != null) {
    router.go(delta)
}
```

#### clearItemData(page)

You can clear a data of the specified page number. And it returns the previous data.

This method cannot be used on server.

## License

[MIT License](./LICENSE)

Copyright (c) Hidekatsu Izuno (hidekatsu.izuno@gmail.com)
