import { useEffect, useRef } from 'react'

type ExpandedImageModalProps = {
  isOpen: boolean
  title?: string
  imageUrl?: string | null
  onUpload: (file: File) => void
  onDelete: () => void
  onClose: () => void
}

export default function ExpandedImageModal(props: ExpandedImageModalProps) {
  const { isOpen, title, imageUrl, onUpload, onDelete, onClose } = props
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const dialogRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isOpen) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  function triggerUpload() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      onUpload(file)
      onClose()
    }
  }

  function handleDelete() {
    onDelete()
    onClose()
  }

  return (
    <div role="dialog" aria-modal="true" aria-label={title || 'Image actions'}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={styles.overlay}
    >
      <div ref={dialogRef} style={styles.card}>
        {title ? <div style={styles.header}>{title}</div> : null}
        <div style={styles.previewWrap}>
          {imageUrl ? (
            <img src={imageUrl} alt="preview" style={styles.previewImg} />
          ) : (
            <div style={styles.empty}
              aria-label="No image selected"
            >
              No image yet
            </div>
          )}
        </div>
        <div style={styles.actions}>
          <button type="button" onClick={triggerUpload} style={styles.primaryBtn} aria-label={imageUrl ? 'Upload or replace image' : 'Upload image'}>
            {imageUrl ? 'Upload / Replace' : 'Upload'}
          </button>
          {imageUrl ? (
            <button type="button" onClick={handleDelete} style={styles.dangerBtn} aria-label="Delete image">
              Delete
            </button>
          ) : null}
          <button type="button" onClick={onClose} style={styles.cancelBtn} aria-label="Close">
            Close
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    background: 'rgba(0,0,0,0.6)',
    zIndex: 1000,
  },
  card: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    boxSizing: 'border-box',
    width: 'clamp(320px, 50vw, 640px)',
    background: 'rgba(18,18,18,0.75)',
    color: '#fff',
    borderRadius: 16,
    boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.05) inset',
    padding: 16,
    border: '1px solid rgba(255,255,255,0.08)',
    backdropFilter: 'blur(10px) saturate(120%)',
    maxHeight: 'min(80vh, 900px)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  header: {
    fontSize: 18,
    marginBottom: 12,
  },
  previewWrap: {
    width: '100%',
    aspectRatio: '4 / 3',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    background: 'rgba(0,0,0,0.35)',
    border: '1px solid rgba(255,255,255,0.06)'
  },
  previewImg: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    display: 'block',
  },
  empty: {
    width: '100%',
    minHeight: 280,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(255,255,255,0.7)'
  },
  actions: {
    display: 'flex',
    gap: 12,
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  primaryBtn: {
    background: '#ffffff',
    color: '#111111',
    border: 'none',
    borderRadius: 9999,
    padding: '10px 16px',
    cursor: 'pointer',
  },
  dangerBtn: {
    background: '#ef4444',
    color: '#ffffff',
    border: 'none',
    borderRadius: 9999,
    padding: '10px 16px',
    cursor: 'pointer',
  },
  cancelBtn: {
    background: '#333333',
    color: '#ffffff',
    border: 'none',
    borderRadius: 9999,
    padding: '10px 16px',
    cursor: 'pointer',
  },
}



