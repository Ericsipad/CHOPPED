import { useEffect, useMemo, useRef, useState } from 'react'
import { appendBunnyAuth, getBackendApi } from '../../lib/config'
import ExpandedImageModal from './ExpandedImageModal'

type ProfileImageCardProps = {
  className?: string
}

export default function ProfileImageCard(props: ProfileImageCardProps) {
  const { className } = props

  const [mainFile, setMainFile] = useState<File | null>(null)
  const [thumbFiles, setThumbFiles] = useState<Array<File | null>>(
    () => new Array(6).fill(null)
  )

  const [initialMainUrl, setInitialMainUrl] = useState<string | null>(null)
  const [initialThumbUrls, setInitialThumbUrls] = useState<Array<string | null>>(
    () => new Array(6).fill(null)
  )

  const [modalOpen, setModalOpen] = useState(false)
  const [modalTarget, setModalTarget] = useState<{ kind: 'main' } | { kind: 'thumb', index: number } | null>(null)

  const mainUrl = useMemo(() => (mainFile ? URL.createObjectURL(mainFile) : (initialMainUrl ? appendBunnyAuth(initialMainUrl) : null)), [mainFile, initialMainUrl])
  const thumbUrls = useMemo(() => {
    const previews = thumbFiles.map((f) => (f ? URL.createObjectURL(f) : null))
    return previews.map((p, i) => (p ? p : (initialThumbUrls[i] ? appendBunnyAuth(initialThumbUrls[i] as string) : null)))
  }, [thumbFiles, initialThumbUrls])

  const mainInputRef = useRef<HTMLInputElement | null>(null)
  const thumbInputRefs = useRef<(HTMLInputElement | null)[]>([])

  function openModalForMain() {
    setModalTarget({ kind: 'main' })
    setModalOpen(true)
  }

  function openModalForThumb(index: number) {
    setModalTarget({ kind: 'thumb', index })
    setModalOpen(true)
  }

  function handleUpload(file: File) {
    if (!modalTarget) return
    ;(async () => {
      // Preflight: block >10MB; we'll also shrink but we avoid decoding huge files beyond limit if desired
      if (file.size > 10 * 1024 * 1024) {
        alert('File exceeds 10MB. Please choose a smaller image.')
        return
      }

      const shrinked = await shrinkImageToTarget(file, { maxEdge: 8000, targetMaxBytes: 3 * 1024 * 1024 })
      if (!shrinked) {
        alert('Unable to process image. Please try a different file.')
        return
      }

      const form = new FormData()
      const slot = modalTarget.kind === 'main' ? 'main' : `thumb${modalTarget.index + 1}`
      form.append('slot', slot)
      form.append('file', shrinked, file.name)

      const url = getBackendApi('/api/uploads/storage')
      const res = await fetch(url, { method: 'POST', credentials: 'include', body: form })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        alert('Upload failed. ' + text)
        return
      }
      const data = await res.json().catch(() => null)
      const publicUrl = data?.publicUrl as string | undefined
      if (!publicUrl) {
        alert('Upload response invalid')
        return
      }

      const upsertUrl = getBackendApi('/api/profile-images/upsert')
      const body = modalTarget.kind === 'main'
        ? { main: publicUrl }
        : { thumbs: [{ name: slot, url: publicUrl }] }
      const upsertRes = await fetch(upsertUrl, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!upsertRes.ok) {
        const t = await upsertRes.text().catch(() => '')
        alert('Failed to save image URL: ' + t)
        return
      }

      const previewFile = shrinked instanceof File ? shrinked : new File([shrinked], file.name, { type: shrinked.type || file.type })
      if (modalTarget.kind === 'main') {
        setMainFile(previewFile)
        setInitialMainUrl(publicUrl)
        try {
          const path = new URL(publicUrl).pathname
          const signRes = await fetch(getBackendApi('/api/bunny/sign'), { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paths: [path] }) })
          const signData = await signRes.json().catch(() => null) as { authMap?: Record<string, string> }
          if (signRes.ok && signData && signData.authMap) {
            const w = window as any
            w.BUNNY_AUTH_MAP = Object.assign({}, w.BUNNY_AUTH_MAP || {}, signData.authMap)
          }
        } catch {}
      } else {
        setThumbFiles((prev) => {
          const next = [...prev]
          next[modalTarget.index] = previewFile
          return next
        })
        setInitialThumbUrls((prev) => {
          const next = [...prev]
          next[modalTarget.index] = publicUrl
          return next
        })
        try {
          const path = new URL(publicUrl).pathname
          const signRes = await fetch(getBackendApi('/api/bunny/sign'), { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paths: [path] }) })
          const signData = await signRes.json().catch(() => null) as { authMap?: Record<string, string> }
          if (signRes.ok && signData && signData.authMap) {
            const w = window as any
            w.BUNNY_AUTH_MAP = Object.assign({}, w.BUNNY_AUTH_MAP || {}, signData.authMap)
          }
        } catch {}
      }
    })()
  }

  function handleDelete() {
    if (!modalTarget) return
    if (modalTarget.kind === 'main') {
      setMainFile(null)
    } else {
      setThumbFiles((prev) => {
        const next = [...prev]
        next[modalTarget.index] = null
        return next
      })
    }
  }

  const rootClass = ['profile-image-card', className].filter(Boolean).join(' ')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        let targetUrl = ''
        try {
          const raw = localStorage.getItem('chopped.mongoUserId')
          if (raw) {
            const parsed = JSON.parse(raw) as { id?: string; ts?: number }
            if (parsed && typeof parsed.id === 'string' && parsed.id) {
              targetUrl = getBackendApi(`/api/profile-images/by-id?userId=${encodeURIComponent(parsed.id)}`)
            }
          }
        } catch {}

        if (!targetUrl) {
          targetUrl = getBackendApi('/api/profile-images/me')
        }

        const res = await fetch(targetUrl, { method: 'GET', credentials: 'include' })
        if (!res.ok) return
        const data = await res.json().catch(() => null) as { main?: string | null; thumbs?: Array<{ name: string; url: string }> }
        if (!data || cancelled) return
        const main = typeof data.main === 'string' ? data.main : null
        const thumbsArr = Array.isArray(data.thumbs) ? data.thumbs : []
        const mapped: Array<string | null> = new Array(6).fill(null)
        for (const t of thumbsArr) {
          const m = /^thumb([1-6])$/.exec(t.name)
          if (!m) continue
          const idx = parseInt(m[1], 10) - 1
          if (idx >= 0 && idx < 6 && typeof t.url === 'string') mapped[idx] = t.url
        }
        setInitialMainUrl(main)
        setInitialThumbUrls(mapped)

        // Request Bunny auth tokens for known URLs
        try {
          const paths: string[] = []
          if (typeof main === 'string' && main) {
            try { paths.push(new URL(main).pathname) } catch {}
          }
          for (const u of mapped) {
            if (typeof u === 'string' && u) {
              try { paths.push(new URL(u).pathname) } catch {}
            }
          }
          if (paths.length > 0) {
            const signRes = await fetch(getBackendApi('/api/bunny/sign'), {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paths })
            })
            const signData = await signRes.json().catch(() => null) as { authMap?: Record<string, string> }
            if (signRes.ok && signData && signData.authMap) {
              const w = window as any
              w.BUNNY_AUTH_MAP = Object.assign({}, w.BUNNY_AUTH_MAP || {}, signData.authMap)
            }
          }
        } catch {}
      } catch {
        // ignore; show placeholders
      }
      return () => { cancelled = true }
    })()
  }, [])

  return (
    <div className={rootClass}>
      <div className="profile-image-card__content">
        <div className="profile-image-card__main" role="button" tabIndex={0}
          aria-label="Main image slot"
          onClick={openModalForMain}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openModalForMain() }}
        >
          {mainUrl ? (
            <img src={mainUrl} alt="Main" className="profile-image-card__img" />
          ) : (
            <div className="profile-image-card__placeholder">Click to upload main image</div>
          )}
          <div className="profile-image-card__label">Main Image</div>
        </div>

        <div className="profile-image-card__thumbs">
          {thumbUrls.map((url, i) => (
            <div key={i}
              className="profile-image-card__thumb"
              role="button" tabIndex={0}
              aria-label={`Thumbnail ${i + 1}`}
              onClick={() => openModalForThumb(i)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openModalForThumb(i) }}
            >
              {url ? (
                <img src={url} alt={`Thumb ${i + 1}`} className="profile-image-card__img" />
              ) : (
                <div className="profile-image-card__placeholder small">+</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <ExpandedImageModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTarget?.kind === 'main' ? 'Main Image' : (modalTarget ? `Thumbnail ${modalTarget.index + 1}` : '')}
        imageUrl={modalTarget?.kind === 'main' ? mainUrl : (modalTarget && modalTarget.kind === 'thumb' ? thumbUrls[modalTarget.index] : null)}
        onUpload={handleUpload}
        onDelete={handleDelete}
      />

      {/* Hidden inputs retained for future direct-trigger needs */}
      <input ref={mainInputRef} type="file" accept="image/*" style={{ display: 'none' }} />
      {new Array(6).fill(null).map((_, i) => (
        <input key={i} ref={(el) => { thumbInputRefs.current[i] = el }} type="file" accept="image/*" style={{ display: 'none' }} />
      ))}
    </div>
  )
}


async function shrinkImageToTarget(input: File, opts: { maxEdge: number; targetMaxBytes: number }): Promise<Blob | null> {
  const { maxEdge, targetMaxBytes } = opts
  try {
    const bitmap = await createImageBitmap(input).catch(() => null)
    if (!bitmap) {
      return input.size <= targetMaxBytes ? input : null
    }

    const ratio = Math.max(bitmap.width, bitmap.height) > maxEdge ? (maxEdge / Math.max(bitmap.width, bitmap.height)) : 1
    const targetW = Math.max(1, Math.round(bitmap.width * ratio))
    const targetH = Math.max(1, Math.round(bitmap.height * ratio))

    const canvas = document.createElement('canvas')
    canvas.width = targetW
    canvas.height = targetH
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(bitmap, 0, 0, targetW, targetH)

    let quality = 0.85
    for (let i = 0; i < 6; i++) {
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, input.type || 'image/jpeg', quality))
      if (!blob) return null
      if (blob.size <= targetMaxBytes) return blob
      quality -= 0.1
      if (quality <= 0.4) break
    }
    const finalBlob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, input.type || 'image/jpeg', 0.75))
    return finalBlob
  } catch {
    return null
  }
}
