import { defineNuxtModule, addPlugin, addImportsDir } from '@nuxt/kit'
import { fileURLToPath } from 'url'
import { resolve } from 'path'

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
  setup (options, nuxt) {
    const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))

    nuxt.options.build.transpile.push(runtimeDir)
    nuxt.options.runtimeConfig.public.outfit = { echo: options.echo, httpInstance: options.httpInstance }
    nuxt.options.runtimeConfig.outfit = { serverUrl: options.serverUrl }

    nuxt.options.build.transpile.push('socket.io-client')

    addPlugin(resolve(runtimeDir, 'plugins'))
    addImportsDir(resolve(runtimeDir, 'composables'))
  }
})
