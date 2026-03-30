import { useRoute } from '#imports'

export const useQuery = () => {
  const { query } = useRoute()

  const convertValue = (value) => {
    if (!Number.isNaN(value)) {
      return Number.parseFloat(value)
    }
    else if (value === 'true' || value === 'false') {
      return value === 'true'
    }
    else if (value.includes(',')) {
      return value.split(',').map(item => convertValue(item.trim()))
    }

    return value
  }

  const getBindingQueryValues = () => {
    return Object.keys(query).reduce((params, key) => {
      const match = key.match(/^filter\[(.+)\]$/)
      const value = convertValue(query[key])

      if (match) {
        params.filters[match[1]] = value
      }
      else {
        params.other[key] = value
      }

      return params
    }, { filters: {}, other: {} })
  }

  return {
    getBindingQueryValues,
  }
}
