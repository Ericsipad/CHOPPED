export type XhrProgressHandler = (loaded: number, total: number) => void

export type XhrUploadResult = {
  status: number
  ok: boolean
  json?: unknown
  text?: string
}

export function xhrUpload(url: string, formData: FormData, options?: {
  withCredentials?: boolean
  onProgress?: XhrProgressHandler
  headers?: Record<string, string>
}): Promise<XhrUploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)
    xhr.withCredentials = Boolean(options?.withCredentials)
    if (options?.headers) {
      for (const [k, v] of Object.entries(options.headers)) xhr.setRequestHeader(k, v)
    }

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable && options?.onProgress) {
        options.onProgress(evt.loaded, evt.total)
      }
    }

    xhr.onerror = () => {
      reject(new Error('Network error'))
    }

    xhr.onload = () => {
      const status = xhr.status
      const ok = status >= 200 && status < 300
      const contentType = xhr.getResponseHeader('Content-Type') || ''
      const body = xhr.responseText
      let json: unknown | undefined
      if (/application\/json/.test(contentType)) {
        try { json = JSON.parse(body) } catch { /* ignore */ }
      }
      resolve({ status, ok, json, text: ok ? undefined : body })
    }

    xhr.send(formData)
  })
}


