import { ref, reactive } from 'vue'
import { useRuntimeConfig, useNuxtApp, useState } from '#imports'
import { klona as deepClone } from 'klona/full'
import { has, unset } from 'lodash-es'

export const useForm = (opts = {}) => {
  const httpInstance = useRuntimeConfig().public.outfit.httpInstance
  const http = useNuxtApp()?.[httpInstance] ?? $fetch
  const snackMessage = useState('snackMessage')

  const fields = reactive(deepClone(opts?.initialValues))
  const isPending = ref(false)
  const errors = ref({})

  let _onSuccess = null
  let _onFail = null

  /**
   * Success callback
   *
   * @param callback
   */
  const onSuccess = (callback) => {
    _onSuccess = callback
  }

  /**
   * Fail callback
   *
   * @param callback
   */
  const onFail = (callback) => {
    _onFail = callback
  }

  /**
   * Make form status pending
   */
  const processing = () => {
    isPending.value = true
  }

  /**
   * Make form status pended
   */
  const processed = () => {
    isPending.value = false
  }

  /**
   * Reset form values
   *
   * @returns void
   */
  const reset = () => {
    Object.assign(fields, deepClone(opts?.initialValues))
  }

  /**
   * For nested object
   * Select first object in array and repeat according to initial value
   *
   * @returns void
   */
  const repeatArray = (property) => {
    if (Array.isArray(fields[property])) {
      fields[property].push(deepClone(opts?.initialValues[property][0]))
    }
  }

  /**
   * Select array according to index and remove it
   *
   * @param property
   * @param index
   */
  const removeArray = (property, index) => {
    if (Array.isArray(fields[property])) {
      fields[property].splice(index, 1)
    }

    if (Array.isArray(errors.value[property])) {
      errors.value[property].splice(index, 1)
    }
  }

  /**
   * Set array errors
   *
   * @param errors
   * @returns
   */
  const setErrors = (exceptions) => {
    errors.value = exceptions
  }

  /**
   * Delete all errors
   *
   * @returns void
   */
  const clearErrors = () => {
    errors.value = {}
  }

  /**
   * Clear error
   *
   * @param field
   */
  const clearError = (field) => {
    if (has(errors.value, field)) {
      unset(errors.value, field)
    }
  }

  /**
   * Collect errors from yup and server schema`s
   *
   * @param errors
   * @param isRunCallback
   * @returns void
   */
  const handleFail = async (fail, isRunCallback = true) => {
    const { unflatten } = await import('flat')

    let messages = {}

    /**
     * Replace square brackets from yup validation
     *
     * In nested array of errors we will get next key = error[0].name
     * But in laravel same error will looks like this = error.0.name
     * So we need to convert it to the equal result
     *
     * @param String text
     * @returns String
     */
    const brackets = (text) => text.replace(/[[\].]+/g, '.')

    if (fail.name === 'ValidationError') {
      if (fail.inner.length !== 0) {
        for (const instance of fail.inner) {
          messages[brackets(instance.path)] = instance.errors.map(item => brackets(item))
        }
      } else {
        messages[brackets(fail.path)] = brackets(fail.message)
      }
    } else if (fail.name === 'FetchError') {
      if (fail.data?.errors !== undefined) {
        messages = fail.data.errors
      } else if (fail.data?.message !== undefined) {
        snackMessage.value = fail.data?.message
      }
    }

    setErrors(unflatten(messages))

    if (_onFail && isRunCallback) {
      _onFail(errors)
    }
  }

  /**
   * Collect success response
   *
   * @param hit
   * @returns void
   */
  const handleSuccess = (hit) => {
    clearErrors()
    reset()

    if (_onSuccess) {
      _onSuccess(hit)
    }
  }

  /**
   * Make local and then server validation
   *
   * @returns Promise
   */
  const validate = () => {
    return opts?.schema
      .validate(deepClone(fields), { abortEarly: false })
      .then(validated => http(opts?.action, { method: 'POST', body: validated }))
      .then(hit => handleSuccess(hit))
      .catch(fail => handleFail(fail))
  }

  /**
   * Submit form
   *
   * @returns void
   */
  const handleSubmit = async () => {
    processing()
    await validate()
    processed()
  }

  return {
    fields,
    errors,
    repeatArray,
    removeArray,
    isPending,
    handleSubmit,
    clearError,
    reset,
    onSuccess,
    onFail
  }
}
