import { useRouter, useNuxtApp, useQuery, useAsyncData, useRuntimeConfig } from '#imports'
import { reactive, computed, watch } from 'vue'
import { klona as deepClone } from 'klona/full'
import { flatten } from 'flat'

export const useDataFetch = async (name, path, options = {}) => {
  const { push } = useRouter()
  const { getBindingQueryValues } = useQuery()
  const httpInstance = useRuntimeConfig().public.outfit.httpInstance
  const http = useNuxtApp()?.[httpInstance] ?? $fetch

  const { filters: filtersQuery, other: otherQuery } = getBindingQueryValues()

  const filters = reactive({ ...deepClone(options?.filters), ...(options?.isSilent ? {} : filtersQuery) })
  const other = reactive({ page: 1, ...(options?.isSilent ? {} : otherQuery) })

  /**
   * Get current page for component easy reading
   *
   * @return Number
   */
  const currentPage = computed({
    get () {
      return other.page
    },
    set (value) {
      other.page = value
    }
  })

  /**
   * Prepare current filters for backend
   *
   * @return Object
   */
  const preparedFilters = computed(() => {
    const inLine = flatten(filters)

    return Object.keys(inLine).filter(key => inLine[key] !== null).reduce((result, key) => {
      result[`filter[${key}]`] = inLine[key]

      return result
    }, {})
  })

  /**
   * Merge all query
   *
   * @return Object
   */
  const validQuery = computed(() => ({ ...other, ...preparedFilters.value }))

  const { data, refresh, pending } = await useAsyncData(name, () => http(path, {
    query: validQuery.value,
    ...(options?.fetch ?? {})
  }))

  /**
   * Make the request with builded query
   *
   */
  const make = async () => {
    await refresh()

    if (options?.isSilent !== true) {
      push({ query: validQuery.value })
    }
  }

  /**
   * Change current apge
   *
   * @param page
   */
  const changePage = async (page) => {
    currentPage.value = page
    await make()
  }

  /**
   * Change items per page
   *
   * @param {number} count
   */
  const changePerPage = async (count) => {
    other.per_page = count
    await make()
  }

  /**
   * Make filtering
   *
   */
  const filter = async () => {
    currentPage.value = 1
    await make()
  }

  /**
   * Clear filter
   *
   */
  const clearFilter = async () => {
    Object.assign(filters, deepClone(options?.filters))
    await make()
  }

  watch(filters, async () => {
    await filter()
  }, { deep: true })

  return {
    pending,
    refresh,
    data,
    filters,
    currentPage,
    changePage,
    changePerPage,
    filter,
    clearFilter
  }
}
