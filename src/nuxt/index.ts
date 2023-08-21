import { addPluginTemplate, defineNuxtModule } from "@nuxt/kit"
import { defu } from 'defu'

export default defineNuxtModule({
  meta: {
    name: 'vue-history-state',
    configKey: 'historyState',
    compatibility: {
      nuxt: '^3.0.0',
    },
  },
  setup(moduleOptions, nuxt) {
    nuxt.options.runtimeConfig.public.historyState = defu(nuxt.options.runtimeConfig.public.historyState as any, {
      ...moduleOptions,
    })

    addPluginTemplate({
      filename: "vue-history-state/plugin.mjs",
      write: true,
      getContents: () => `
        import HistoryStatePlugin from 'vue-history-state'
        export default defineNuxtPlugin(app => {
          app.vueApp.use(HistoryStatePlugin, useRuntimeConfig().public.historyState)
        })
      `,
    }, moduleOptions)
  }
})
