import { useEffect, useRef, useState } from 'react'
import { getBackendApi } from '../../lib/config'
import { xhrUpload } from '../../lib/xhrUpload'

type ExpandedVideoModalProps = {
  isOpen: boolean
  onClose: () => void
  videoId?: string | null
  videoThumbUrl?: string | null
  videoUrl?: string | null
  onThumbUploaded: (publicUrl: string) => void
  onVideoUploaded: (videoUrl: string) => void
  onDelete: () => void
}

export default function ExpandedVideoModal(props: ExpandedVideoModalProps) {
  const { isOpen, onClose, videoId, videoThumbUrl, videoUrl, onThumbUploaded, onVideoUploaded, onDelete } = props
  const [uploadingThumb, setUploadingThumb] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [thumbProgress, setThumbProgress] = useState<number>(0)
  const [videoProgress, setVideoProgress] = useState<number>(0)
  const [thumbError, setThumbError] = useState<string | null>(null)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [thumbSuccess, setThumbSuccess] = useState<boolean>(false)
  const [videoSuccess, setVideoSuccess] = useState<boolean>(false)
  const thumbInputRef = useRef<HTMLInputElement | null>(null)
  const videoInputRef = useRef<HTMLInputElement | null>(null)
  const [embedUrl, setEmbedUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setEmbedUrl(null)
        if (!videoUrl) return
        const res = await fetch(getBackendApi('/api/video/stream/embed'), {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoUrl }),
        })
        if (!res.ok) return
        const data = await res.json().catch(() => null) as { signedUrl?: string }
        if (!data?.signedUrl || cancelled) return
        setEmbedUrl(data.signedUrl)
      } catch { /* noop */ }
    })()
    return () => { cancelled = true }
  }, [videoUrl])

  if (!isOpen) return null

  function triggerThumbUpload() {
    thumbInputRef.current?.click()
  }
  function triggerVideoUpload() {
    videoInputRef.current?.click()
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Video actions"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={styles.overlay}
    >
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.headerTitle}>Video editor</div>
          <button type="button" onClick={onClose} aria-label="Close" style={styles.closeBtn}>×</button>
        </div>
        <div style={styles.bodyGrid}>
          <div style={styles.panel}>
            <div style={styles.panelHeader}>Thumbnail</div>
            <div style={styles.previewWrap}>
              {videoThumbUrl ? (
                <img src={videoThumbUrl} alt="thumb" style={styles.previewImg} />
              ) : (
                <div style={styles.empty}>No thumbnail yet</div>
              )}
              <div style={styles.overlayActions}>
                <button type="button" onClick={triggerThumbUpload} aria-label="Upload thumbnail" disabled={uploadingThumb} style={styles.iconBtnGreen}>
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" style={styles.iconSvg}>
                    <path d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                </button>
              </div>
            </div>
            <input ref={thumbInputRef} type="file" accept="image/*" onChange={(e) => {
              const f = e.target.files?.[0]
              if (!f) return
              if (f.size > 10 * 1024 * 1024) {
                alert('Image exceeds 10MB limit')
                return
              }
              setUploadingThumb(true)
              setThumbProgress(0)
              setThumbError(null)
              setThumbSuccess(false)
              ;(async () => {
                try {
                  const form = new FormData()
                  form.append('slot', 'thumb1')
                  form.append('file', f, f.name)
                  const url = getBackendApi('/api/uploads/storage')
                  const res = await xhrUpload(url, form, { withCredentials: true, onProgress: (loaded, total) => {
                    const pct = total > 0 ? Math.round((loaded / total) * 100) : 0
                    setThumbProgress(pct)
                  } })
                  if (!res.ok) {
                    const msg = (res.json && typeof (res.json as any).error === 'string') ? (res.json as any).error : (res.text || 'Upload failed')
                    setThumbError(msg || 'Upload failed')
                    return
                  }
                  const data = (res.json || null) as { publicUrl?: string } | null
                  if (!data?.publicUrl) {
                    setThumbError('Invalid response')
                    return
                  }
                  onThumbUploaded(data.publicUrl)
                  setThumbSuccess(true)
                } finally {
                  setUploadingThumb(false)
                }
              })()
            }} style={{ display: 'none' }} />
            {(uploadingThumb || thumbError || thumbSuccess) ? (
              <div style={{ marginTop: 8 }}>
                {uploadingThumb ? (
                  <div aria-live="polite" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 9999, overflow: 'hidden' }}>
                      <div style={{ width: `${thumbProgress}%`, height: '100%', background: '#22c55e' }} />
                    </div>
                    <span style={{ fontSize: 12, color: '#ddd' }}>{thumbProgress}%</span>
                  </div>
                ) : null}
                {thumbError ? (
                  <div style={{ color: '#fca5a5', fontSize: 12, marginTop: 6 }}>Error: {thumbError}</div>
                ) : null}
                {thumbSuccess ? (
                  <div style={{ color: '#86efac', fontSize: 12, marginTop: 6 }}>Thumbnail uploaded</div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div style={styles.panel}>
            <div style={styles.panelHeader}>Video</div>
            <div style={styles.previewWrap}>
              {videoUrl ? (
                embedUrl ? (
                  <iframe
                    src={embedUrl}
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    width="100%"
                    height="100%"
                    style={styles.previewIframe}
                  />
                ) : (
                  <video src={videoUrl} controls style={styles.previewVideo} />
                )
              ) : (
                <div style={styles.empty}>No video yet</div>
              )}
              <div style={styles.overlayActions}>
                <button type="button" onClick={triggerVideoUpload} aria-label="Upload video" disabled={uploadingVideo} style={styles.iconBtnGreen}>
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" style={styles.iconSvg}>
                    <path d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                </button>
                {videoId ? (
                  <button type="button" onClick={onDelete} aria-label="Delete video" style={styles.iconBtnRed}>
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" style={styles.iconSvg}>
                      <path d="M3 6h18M8 6V4h8v2m-1 0v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6h10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    </svg>
                  </button>
                ) : null}
              </div>
            </div>
            <input ref={videoInputRef} type="file" accept="video/*" onChange={(e) => {
              const f = e.target.files?.[0]
              if (!f) return
              if (f.size > 30 * 1024 * 1024) {
                alert('Video exceeds 30MB limit')
                return
              }
              setUploadingVideo(true)
              setVideoProgress(0)
              setVideoError(null)
              setVideoSuccess(false)
              ;(async () => {
                try {
                  const form = new FormData()
                  form.append('file', f, f.name)
                  const url = getBackendApi('/api/video/stream/upload')
                  const res = await xhrUpload(url, form, { withCredentials: true, onProgress: (loaded, total) => {
                    const pct = total > 0 ? Math.round((loaded / total) * 100) : 0
                    setVideoProgress(pct)
                  } })
                  if (!res.ok) {
                    const msg = (res.json && typeof (res.json as any).error === 'string') ? (res.json as any).error : (res.text || 'Upload failed')
                    setVideoError(msg || 'Upload failed')
                    return
                  }
                  const data = (res.json || null) as { videoUrl?: string; guid?: string } | null
                  if (!data?.videoUrl) {
                    setVideoError('Invalid response from server')
                    return
                  }
                  onVideoUploaded(data.videoUrl)
                  setVideoSuccess(true)
                } finally {
                  setUploadingVideo(false)
                }
              })()
            }} style={{ display: 'none' }} />
            {(uploadingVideo || videoError || videoSuccess) ? (
              <div style={{ marginTop: 8 }}>
                {uploadingVideo ? (
                  <div aria-live="polite" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 9999, overflow: 'hidden' }}>
                      <div style={{ width: `${videoProgress}%`, height: '100%', background: '#22c55e' }} />
                    </div>
                    <span style={{ fontSize: 12, color: '#ddd' }}>{videoProgress}%</span>
                  </div>
                ) : null}
                {videoError ? (
                  <div style={{ color: '#fca5a5', fontSize: 12, marginTop: 6 }}>Error: {videoError}</div>
                ) : null}
                {videoSuccess ? (
                  <div style={{ color: '#86efac', fontSize: 12, marginTop: 6 }}>Video uploaded</div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1100 },
  card: { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'clamp(320px, 90vw, 1000px)', maxHeight: 'calc(100vh - (env(safe-area-inset-top) + env(safe-area-inset-bottom) + 24px))', overflowY: 'auto', background: 'rgba(18,18,18,0.9)', color: '#fff', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 50px rgba(0,0,0,0.6)', padding: 16 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 18, marginBottom: 12 },
  headerTitle: { fontWeight: 800 },
  closeBtn: { height: 28, width: 28, borderRadius: 6, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(0,0,0,0.45)', color: '#fff', cursor: 'pointer' },
  bodyGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  panel: { background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 12 },
  panelHeader: { fontWeight: 700, marginBottom: 8 },
  previewWrap: { width: '100%', aspectRatio: '4 / 3', borderRadius: 10, overflow: 'hidden', background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  overlayActions: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 10, pointerEvents: 'none' },
  previewImg: { width: '100%', height: '100%', objectFit: 'contain' },
  previewVideo: { width: '100%', height: '100%' },
  previewIframe: { width: '100%', height: '100%', border: 0, display: 'block' },
  empty: { color: 'rgba(255,255,255,0.7)' },
  actions: { marginTop: 10, display: 'flex', gap: 8, justifyContent: 'flex-end' },
  primaryBtn: { background: '#fff', color: '#111', border: 'none', borderRadius: 9999, padding: '8px 14px', cursor: 'pointer' },
  dangerBtn: { background: '#ef4444', color: '#fff', border: 'none', borderRadius: 9999, padding: '8px 14px', cursor: 'pointer' },
  cancelBtn: { background: '#333', color: '#fff', border: 'none', borderRadius: 9999, padding: '8px 14px', cursor: 'pointer' },
  iconBtnGreen: { pointerEvents: 'auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 36, width: 36, borderRadius: 9999, border: '1px solid rgba(34,197,94,0.6)', background: 'rgba(34,197,94,0.2)', color: '#22c55e', cursor: 'pointer' },
  iconBtnRed: { pointerEvents: 'auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 36, width: 36, borderRadius: 9999, border: '1px solid rgba(239,68,68,0.6)', background: 'rgba(239,68,68,0.2)', color: '#ef4444', cursor: 'pointer', marginLeft: 8 },
  iconSvg: { display: 'block' },
}


