import { defineNuxtPlugin, useRuntimeConfig } from '#imports'
import Echo from 'laravel-echo'

export default defineNuxtPlugin(async (nuxtApp) => {
  const options = useRuntimeConfig().public.outfit.echo

  if (options.broadcaster === 'socket.io') {
    options.client = await import('socket.io-client')
  }

  nuxtApp.provide('echo', new Echo(options))
})
