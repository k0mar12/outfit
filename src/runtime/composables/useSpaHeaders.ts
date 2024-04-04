import { useRuntimeConfig, useRequestEvent, useRequestHeaders, useEcho } from '#imports'

export const useSpaHeaders = (additionalHeaders = {}) => {
  if (process.client) {
    const { getSocketId } = useEcho()

    return {
      headers: additionalHeaders,
      async onRequest ({ options }) {
        if (getSocketId() !== undefined) {
          options.headers['X-Socket-ID'] = getSocketId()
        }
      }
    }
  }

  const serverUrl = useRuntimeConfig().outfit.serverUrl
  const event = useRequestEvent()
  const headers = useRequestHeaders(['cookie', 'referer', 'host'])

  /**
   * TODO: In future releases should be removed.
   * Nuxt time to time not return referer
   * Condition: if (!Object.prototype.hasOwnProperty.call(headers, 'referer'))
   */

  headers.referer = `${headers.host}${event.node.req.originalUrl}`

  const serverOptions = {
    headers: {
      ...additionalHeaders,
      ...headers
    }
  }

  if (serverUrl) {
    serverOptions.baseURL = serverUrl
  }

  return serverOptions
}
