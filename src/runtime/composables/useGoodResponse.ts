import { readonly } from 'vue'
import { useRequestEvent } from '#imports'
import { setResponseHeaders } from 'h3'
import { parse, splitCookiesString as split } from 'set-cookie-parser'
import { serialize } from 'cookie'

export const useGoodResponse = () => {
  const event = useRequestEvent()

  const goodCodes = readonly([200, 201, 202, 203, 204, 205, 206, 207, 208, 226])

  const parseCookie = (cookies) => {
    return (parse(split(cookies))).map(cookie => serialize(cookie.name, cookie.value, cookie))
  }

  const setCookieFromResponse = ({ status, headers }) => {
    if (goodCodes.includes(status)) {
      setResponseHeaders(event, { 'Set-Cookie': parseCookie(headers.get('set-cookie')) })
    }
  }

  return {
    goodCodes, setCookieFromResponse
  }
}
