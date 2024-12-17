import { useRuntimeConfig, useNuxtApp } from '#imports'
import { ref, reactive } from 'vue'
import { klona as deepClone } from 'klona/full'
import { has, unset } from 'lodash-es'
import flat from 'flat'

export const useForm = (opts = {}) => {
  const { schema } = opts
  const httpInstance = useRuntimeConfig().public.outfit.httpInstance
  const http = useNuxtApp()?.[httpInstance] ?? $fetch

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
   * @param values
   * @returns void
   */
  const reset = (values = null) => {
    Object.assign(fields, values ?? opts?.initialValues)
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
  const handleFail = (fail, isRunCallback = true) => {
    const { unflatten } = flat
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
      }
    }

    setErrors(unflatten(messages))

    if (_onFail && isRunCallback) {
      Promise.resolve(_onFail({ errors, status: fail.status }))
    }
  }

  /**
   * Collect success response
   *
   * @param hit
   * @returns void
   */
  const handleSuccess = (hit) => {
    const shouldReset = opts?.shouldReset ?? true

    clearErrors()

    if (shouldReset) {
      reset()
    }

    if (_onSuccess) {
      Promise.resolve(_onSuccess(hit))
    }
  }

  /**
   * Transform object to form data
   *
   * @param fields
   * @param form
   * @param namespace
   * @returns
   */
  const toFormData = (fields, form = null, namespace = null) => {
    const formData = form || new FormData()

    for (let property in fields) {
      if (!fields.hasOwnProperty(property)) {
        continue
      }

      let formKey = namespace ? `${namespace}[${property}]` : property

      if (fields[property] instanceof FileList || Array.isArray(fields[property])) {
        fields[property].forEach((element, index) => {
          if (element instanceof File) {
            formData.append(`${formKey}[${index}]`, element)
          } else if (typeof element === 'object') {
            toFormData(element, formData, `${formKey}[${index}]`)
          } else {
            formData.append(`${formKey}[${index}]`, element)
          }
        })
      } else if (typeof fields[property] === 'object' && !(fields[property] instanceof File)) {
        toFormData(fields[property], formData, formKey)
      } else {
        formData.append(formKey, fields[property])
      }
    }

    return formData
  }

  /**
   * Create request to server
   *
   * @param params
   * @param validated
   * @returns
   */
  const makeRequest = (params, validated) => {
    let fields = validated

    if (opts?.isFormData) {
      fields = toFormData(fields)
    }

    return http(params?.action ?? opts?.action, { method: opts?.method ?? 'POST', body: fields })
  }

  /**
   * Make local and then server validation
   *
   * @param params
   * @returns Promise
   */
  const validate = (params) => {
    return opts?.schema
      .validate(deepClone(fields), params?.validationOptions ?? { abortEarly: false })
      .then(validated => makeRequest(params, validated))
      .then(hit => handleSuccess(hit))
      .catch(fail => handleFail(fail))
  }

  /**
   * Submit form
   *
   * @param event
   * @param params
   * @returns void
   */
  const handleSubmit = async (event = null, params) => {
    processing()
    await validate(params)
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
    onFail,
    schema
  }
}
