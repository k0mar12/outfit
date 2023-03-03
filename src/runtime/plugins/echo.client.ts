import { defineNuxtPlugin, useRuntimeConfig } from '#imports'
import { io } from 'socket.io-client'
import { klona as deepClone } from 'klona/full'
import Echo from 'laravel-echo'

export default defineNuxtPlugin((nuxtApp) => {
  const options = useRuntimeConfig().public.outfit.echo

  if (options.broadcaster === 'socket.io') {
    options.client = io
  }

  nuxtApp.provide('echo', new Echo(deepClone(options)))
})
