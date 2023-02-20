import { useRuntimeConfig, useRequestEvent, useRequestHeaders } from '#imports'
import { appendHeader } from 'h3'
import { parse, splitCookiesString as split } from 'set-cookie-parser'
import { serialize } from 'cookie'

export const useSpaHeaders = (additionalHeaders = {}) => {
  if (process.client) {
    return {
      headers: additionalHeaders
    }
  }

  const serverUrl = useRuntimeConfig().outfit.serverUrl
  const event = useRequestEvent()
  const headers = useRequestHeaders(['cookie', 'referer', 'host'])
  const goodResponses = [200, 201, 202, 203, 204, 205, 206, 207, 208, 226]

  /**
   * TODO: In future releases should be removed.
   * Nuxt time to time not return referer
   */
  if (!Object.prototype.hasOwnProperty.call(headers, 'referer')) {
    headers.referer = `${headers.host}/${event.req.originalUrl}`
  }

  const parseCookie = (cookies) => {
    return (parse(split(cookies))).map(cookie => serialize(cookie.name, cookie.value, cookie))
  }

  const serverOptions = {
    headers: {
      ...additionalHeaders,
      ...headers
    },
    // eslint-disable-next-line
    async onResponse ({ response }) {
      const { status, headers } = response

      if (goodResponses.includes(status)) {
        appendHeader(event, 'Set-Cookie', parseCookie(headers.get('set-cookie')))
      }
    }
  }

  if (serverUrl) {
    serverOptions.baseURL = serverUrl
  }

  return serverOptions
}
