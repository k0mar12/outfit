import { defineNuxtModule, addPlugin, createResolver } from '@nuxt/kit'

const { resolve } = createResolver(import.meta.url)

const includeDeps = (nuxt: any, deps: any) => {
  if (!nuxt.options.vite) {
    nuxt.options.vite = {}
  }

  if (!nuxt.options.vite.optimizeDeps) {
    nuxt.options.vite.optimizeDeps = {}
  }

  if (!nuxt.options.vite.optimizeDeps.include) {
    nuxt.options.vite.optimizeDeps.include = []
  }

  nuxt.options.vite.optimizeDeps.include.push(...deps)
}

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
    nuxt.options.build.transpile.push(resolve('./runtime'))
    nuxt.options.runtimeConfig.public.outfit = { echo: options.echo, httpInstance: options.httpInstance }
    nuxt.options.runtimeConfig.outfit = { serverUrl: options.serverUrl }

    includeDeps(nuxt, [
      'socket.io-client',
      'flat',
      'cookie',
      'set-cookie-parser'
    ])

    addPlugin(resolve('./runtime/plugins/echo.client'))
  }
})
