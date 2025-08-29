import { useMemo, useRef, useState } from 'react'
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

  const [modalOpen, setModalOpen] = useState(false)
  const [modalTarget, setModalTarget] = useState<{ kind: 'main' } | { kind: 'thumb', index: number } | null>(null)

  const mainUrl = useMemo(() => (mainFile ? URL.createObjectURL(mainFile) : null), [mainFile])
  const thumbUrls = useMemo(() => thumbFiles.map((f) => f ? URL.createObjectURL(f) : null), [thumbFiles])

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
    if (modalTarget.kind === 'main') {
      setMainFile(file)
    } else {
      setThumbFiles((prev) => {
        const next = [...prev]
        next[modalTarget.index] = file
        return next
      })
    }
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
        </div>
        <div className="profile-image-card__label">Main Image</div>

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
        title={modalTarget?.kind === 'main' ? 'Main Image' : modalTarget ? `Thumbnail ${modalTarget.index + 1}` : ''}
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


