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

  useEffect(() => {
    if (!isOpen) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

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
        <div style={styles.header}>Video Editor</div>
        <div style={styles.bodyGrid}>
          <div style={styles.panel}>
            <div style={styles.panelHeader}>Thumbnail</div>
            <div style={styles.previewWrap}>
              {videoThumbUrl ? (
                <img src={videoThumbUrl} alt="thumb" style={styles.previewImg} />
              ) : (
                <div style={styles.empty}>No thumbnail yet</div>
              )}
            </div>
            <div style={styles.actions}>
              <button type="button" onClick={triggerThumbUpload} disabled={uploadingThumb} style={styles.primaryBtn}>
                {uploadingThumb ? 'Uploading…' : (videoThumbUrl ? 'Replace thumb' : 'Upload thumb')}
              </button>
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
                <video src={videoUrl} controls style={styles.previewVideo} />
              ) : (
                <div style={styles.empty}>No video yet</div>
              )}
            </div>
            <div style={styles.actions}>
              <button type="button" onClick={triggerVideoUpload} disabled={uploadingVideo} style={styles.primaryBtn}>
                {uploadingVideo ? 'Uploading…' : (videoUrl ? 'Replace video' : 'Upload video (≤30MB)')}
              </button>
              {videoId ? (
                <button type="button" onClick={onDelete} style={styles.dangerBtn}>Delete</button>
              ) : null}
              <button type="button" onClick={onClose} style={styles.cancelBtn}>Close</button>
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
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000 },
  card: { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'clamp(320px, 70vw, 1000px)', background: 'rgba(18,18,18,0.75)', color: '#fff', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 50px rgba(0,0,0,0.6)', padding: 16 },
  header: { fontSize: 18, marginBottom: 12 },
  bodyGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  panel: { background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 12 },
  panelHeader: { fontWeight: 700, marginBottom: 8 },
  previewWrap: { width: '100%', aspectRatio: '4 / 3', borderRadius: 10, overflow: 'hidden', background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  previewImg: { width: '100%', height: '100%', objectFit: 'contain' },
  previewVideo: { width: '100%', height: '100%', objectFit: 'contain' },
  empty: { color: 'rgba(255,255,255,0.7)' },
  actions: { marginTop: 10, display: 'flex', gap: 8, justifyContent: 'flex-end' },
  primaryBtn: { background: '#fff', color: '#111', border: 'none', borderRadius: 9999, padding: '8px 14px', cursor: 'pointer' },
  dangerBtn: { background: '#ef4444', color: '#fff', border: 'none', borderRadius: 9999, padding: '8px 14px', cursor: 'pointer' },
  cancelBtn: { background: '#333', color: '#fff', border: 'none', borderRadius: 9999, padding: '8px 14px', cursor: 'pointer' },
}


