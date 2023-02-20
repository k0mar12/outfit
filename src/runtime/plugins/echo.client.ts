import { defineNuxtPlugin, useRuntimeConfig } from '#imports'
import Echo from 'laravel-echo'

export default defineNuxtPlugin(async (nuxtApp) => {
  const options = useRuntimeConfig().public.outfit.echo

  if (options.broadcaster === 'socket.io') {
    const { io } = await import('socket.io-client')
    options.client = io
  }

  nuxtApp.provide('echo', new Echo(options))
})
