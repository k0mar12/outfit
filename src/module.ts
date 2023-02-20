import { defineNuxtModule, addPlugin, createResolver } from '@nuxt/kit'

const { resolve } = createResolver(import.meta.url)

export default defineNuxtModule({
  meta: {
    name: '@nuxt/outfit',
    configKey: 'outfit'
  },
  defaults: {
    echo: {
      broadcaster: 'socket.io',
      autoConnect: false,
      transports: ['websocket']
    },
    serverUrl: null,
    httpInstance: null
  },
  hooks: {
    'imports:dirs': (dirs) => {
      dirs.push(resolve('./runtime/composables'))
    }
  },
  setup (options, nuxt) {
    nuxt.options.runtimeConfig.public.outfit = { echo: options.echo, httpInstance: options.httpInstance }
    nuxt.options.runtimeConfig.outfit = { serverUrl: options.serverUrl }

    nuxt.options.build.transpile.push('laravel-echo', 'socket.io-client')

    addPlugin(resolve('./runtime/plugins/echo.client'))
  }
})
