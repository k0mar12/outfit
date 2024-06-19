export const useFile = () => {

  /**
   *
   * @param base64
   * @returns
   */
  const createArrayBufferFromBase64 = (base64) => {
    const binaryString = atob(base64)
    const len = binaryString.length
    const bytes = new Uint8Array(len)

    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i)
    }

    return bytes.buffer
  }

  /**
   *
   * @param base64
   * @param name
   * @param type
   * @returns
   */
  const createFileFromBase64 = (base64, name, type) => {
    return new File([new Blob([createArrayBufferFromBase64(base64)])], name)
  }

  return {
    createArrayBufferFromBase64,
    createFileFromBase64
  }
}
