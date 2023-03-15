import { addPluginTemplate, createResolver, defineNuxtModule } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'vue-history-state',
    configKey: 'historyState',
    compatibility: {
      nuxt: '^3.0.0',
    },
  },
  setup(moduleOptions, nuxt) {
    nuxt.options.runtimeConfig.historyState = {
      ...nuxt.options.runtimeConfig.historyState || {},
      ...moduleOptions,
    }

    addPluginTemplate({
      filename: "vue-history-state/plugin.mjs",
      write: true,
      getContents: () => `
        import HistoryStatePlugin from 'vue-history-state'
        export default defineNuxtPlugin(app => {
          app.vueApp.use(HistoryStatePlugin, useRuntimeConfig().historyState)
        })
      `,
    }, moduleOptions)
  }
})
