# Vue History State

History state plugin for Vue3 and Nuxt3

[![npm version](https://badge.fury.io/js/vue-history-state.svg)](https://badge.fury.io/js/vue-history-state)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Vue plugin to backup or restore historical states.

This plugin is a new version of nuxt-history-state.

## Features

- Restore a last state when going forward or back.
- Restore a state when reloading.
- Restore a last state when going forward or back after reloading.

## Install

Using npm:

```
npm install vue-history-state
```

## Setup

### vue3

```javascript
import HistoryStatePlugin from 'vue-history-state'

...

app.use(HistoryStatePlugin, {
  /* optional options */
})
```

### nuxt3

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

When this option is not set, it is unlimited.

*Default:* undefined (unlimited)

#### overrideDefaultScrollBehavior

Indicates whether this module override a default scroll behavior of the router.

If you set this option to true, it manages a scroll behavior by using own saved position.

*Default:* true

#### scrollingElements

Indicates to which element the overrode behavior is applied.

If you set this option to a selecter, it applies the scrolling to the selector, in addition to the window.

*Default:* null

## Usage

### Composition API

#### Backup state

If you want to backup data, you have to define a *onBackupState* lifecycle method.

```javascript
import { onBackupState } from 'vue-history-state'

const data = reactive({ key: "value" })
onBackupState(() => data)
```

#### Restore state

```javascript
import { useHistoryState } from 'vue-history-state'

const historyState = useHistoryState()
const data = reactive(Object.assign({
        key: 'value',
    }, historyState.data))
```

### Option API

#### Backup state

If you want to backup data, you have to define a *backupData* lifecycle method.

```javascript
export default {
    backupData() {
        return data
    }
}
```

### Restore component data

You can access to backup data through $historyState object of *this* or context.

```javascript
export default {
    // Access to backup data in a asyncData or fetch method.
    async asyncData({ $historyState, $http }) {
        // Overwrite value on a new page only
        if ($historyState.action === 'navigate' || $historyState.action === 'push') {
            return await $http.$get(...);
        }
        return {};
    }

    // Access to backup data in lifecycle methods of the instance.
    data() {
        if this.$historyState.data || {
            ...
        }
    }
}
```

## API

### $historyState

#### action

A action type that caused a navigation.

- navigate: When a new page is navigated.
- reload: When a page is reloaded.
- push: When a history.push is called.
- forward: When a forward navigation is occurred.
- back: When a back navigation is occurred.

By default this method returns basically 'navigate' on server. 
But many browsers send cache-control='maxage=0' when reloading.
It heuristically returns 'reload' then.

#### page

A current page number (an integer beginning with 0).

By defalut this method always returns 0 on server.

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
