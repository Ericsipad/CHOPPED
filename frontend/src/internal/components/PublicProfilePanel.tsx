import { useEffect, useMemo, useState } from 'react'
import ValidationModal from './ValidationModal'
import { fetchReadiness } from './readiness'
import { getBackendApi } from '../../lib/config'

function EyeIcon(props: { size?: number }) {
  const size = props.size ?? 18
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7Z" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5"/> 
      <circle cx="12" cy="12" r="3" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5"/>
    </svg>
  )
}

export default function PublicProfilePanel() {
  const [displayName, setDisplayName] = useState('')
  const [ageStr, setAgeStr] = useState('')
  const [heightStr, setHeightStr] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedTs, setSavedTs] = useState<number | null>(null)
  const [bio, setBio] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [missingFields, setMissingFields] = useState<string[]>([])
  const [errors, setErrors] = useState<{ displayName?: boolean; age?: boolean; bio?: boolean }>({})

  const parsedAge = useMemo(() => {
    const n = Number(ageStr)
    return Number.isInteger(n) ? n : NaN
  }, [ageStr])
  const parsedHeight = useMemo(() => {
    const n = Number(heightStr)
    return Number.isInteger(n) ? n : NaN
  }, [heightStr])

  const isValid = useMemo(() => {
    if (!displayName.trim()) return false
    if (!Number.isInteger(parsedAge) || parsedAge < 13 || parsedAge > 120) return false
    if (bio.trim().length < 1 || bio.trim().length > 500) return false
    return true
  }, [displayName, parsedAge, bio])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        // Sync/verify local mongo id against session
        try {
          const resMe = await fetch(getBackendApi('/api/user/me'), { credentials: 'include' })
          const dataMe = await resMe.json().catch(() => null) as { userId?: string | null }
          if (dataMe && typeof dataMe.userId === 'string' && dataMe.userId) {
            try {
              const existingRaw = localStorage.getItem('chopped.mongoUserId')
              const existing = existingRaw ? JSON.parse(existingRaw) as { id?: string; ts?: number } : null
              if (!existing || existing.id !== dataMe.userId) {
                localStorage.setItem('chopped.mongoUserId', JSON.stringify({ id: dataMe.userId, ts: Date.now() }))
              }
            } catch { /* ignore */ }
          }
        } catch { /* ignore */ }

        const res = await fetch(getBackendApi('/api/profile-matching'), { credentials: 'include' })
        if (res.ok) {
          const data = await res.json().catch(() => null) as { displayName?: string | null; age?: number | null; heightCm?: number | null; bio?: string | null }
          if (!cancelled && data) {
            setDisplayName(typeof data.displayName === 'string' ? data.displayName : '')
            setAgeStr(typeof data.age === 'number' ? String(data.age) : '')
            setHeightStr(typeof data.heightCm === 'number' ? String(data.heightCm) : '')
            setBio(typeof data.bio === 'string' ? data.bio : '')
          }
        } else if (res.status === 401) {
          setError('Not signed in')
        } else {
          setError('Failed to load profile info')
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load'
        setError(msg)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  async function onSave() {
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      const panelMissing: string[] = []
      const nextErrors: { displayName?: boolean; age?: boolean; bio?: boolean } = {}
      if (!displayName.trim()) { panelMissing.push('Display name'); nextErrors.displayName = true }
      if (!Number.isInteger(parsedAge) || parsedAge < 13 || parsedAge > 120) { panelMissing.push('Age'); nextErrors.age = true }
      if (bio.trim().length < 1) { panelMissing.push('Bio'); nextErrors.bio = true }
      setErrors(nextErrors)
      if (panelMissing.length > 0) {
        setMissingFields(panelMissing)
        setModalOpen(true)
        throw new Error('Validation error')
      }
      // Re-verify local mongo id matches session, then persist
      try {
        const resMe = await fetch(getBackendApi('/api/user/me'), { credentials: 'include' })
        const dataMe = await resMe.json().catch(() => null) as { userId?: string | null }
        if (dataMe && typeof dataMe.userId === 'string' && dataMe.userId) {
          try {
            const existingRaw = localStorage.getItem('chopped.mongoUserId')
            const existing = existingRaw ? JSON.parse(existingRaw) as { id?: string; ts?: number } : null
            if (!existing || existing.id !== dataMe.userId) {
              localStorage.setItem('chopped.mongoUserId', JSON.stringify({ id: dataMe.userId, ts: Date.now() }))
            }
          } catch { /* ignore */ }
        }
      } catch { /* ignore */ }

      const body: Record<string, unknown> = {
        displayName: displayName.trim(),
        age: parsedAge,
        heightCm: parsedHeight,
        bio: bio.trim(),
      }
      const res = await fetch(getBackendApi('/api/profile-matching'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null) as { error?: string }
        throw new Error(err?.error || 'Failed to save')
      }
      setSavedTs(Date.now())

      // After save, check readiness to browse
      const { ready, missing: readinessMissing } = await fetchReadiness({ displayName, ageStr, bio })
      if (!ready) {
        setError('Missing required fields: ' + readinessMissing.join(', '))
        setModalOpen(true)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save'
      setError(msg)
      setModalOpen(true)
    } finally {
      setSaving(false)
      setTimeout(() => setSavedTs(null), 2000)
    }
  }

  return (
    <div className="profile-public-panel" aria-live="polite">
      <div className="profile-public-panel__header">
        <div className="profile-public-panel__title">
          <EyeIcon />
          <span>Public Profile information</span>
        </div>
        <div className="profile-public-panel__right">
          <button className="profile-public-panel__save" onClick={onSave} disabled={!isValid || saving || loading}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <div className="profile-public-panel__inputs">
        <div className="profile-public-panel__field">
          <label className={["profile-public-panel__label", errors.displayName ? 'profile-public-panel__label--error' : ''].filter(Boolean).join(' ')} htmlFor="displayName">Display Name</label>
          <input id="displayName" className={["profile-public-panel__input", "profile-public-panel__input--wide", errors.displayName ? 'profile-public-panel__input--error' : ''].filter(Boolean).join(' ')} type="text" value={displayName} onChange={(e) => { setDisplayName(e.target.value); if (errors.displayName) setErrors((p) => ({ ...p, displayName: false })) }} placeholder="Your display name" maxLength={60} />
        </div>
        <div className="profile-public-panel__field profile-public-panel__field--age">
          <label className={["profile-public-panel__label", errors.age ? 'profile-public-panel__label--error' : ''].filter(Boolean).join(' ')} htmlFor="age">Age</label>
          <input id="age" className={["profile-public-panel__input", "profile-public-panel__input--xs", errors.age ? 'profile-public-panel__input--error' : ''].filter(Boolean).join(' ')} inputMode="numeric" pattern="[0-9]*" value={ageStr} onChange={(e) => { setAgeStr(e.target.value.replace(/[^0-9]/g, '')); if (errors.age) setErrors((p) => ({ ...p, age: false })) }} placeholder="28" />
        </div>
        <div className="profile-public-panel__field">
          <label className="profile-public-panel__label" htmlFor="height">Height (cm)</label>
          <input id="height" className="profile-public-panel__input profile-public-panel__input--xs" inputMode="numeric" pattern="[0-9]*" value={heightStr} onChange={(e) => setHeightStr(e.target.value.replace(/[^0-9]/g, ''))} placeholder="180" />
        </div>
      </div>

      <div className="profile-public-panel__bio">
        <div className="profile-public-panel__bio-header">BIO</div>
        <textarea
          className={["profile-public-panel__textarea", errors.bio ? 'profile-public-panel__textarea--error' : ''].filter(Boolean).join(' ')}
          maxLength={500}
          value={bio}
          onChange={(e) => { setBio(e.target.value); if (errors.bio) setErrors((p) => ({ ...p, bio: false })) }}
          placeholder="Tell others about yourself (max 500 characters)"
          rows={6}
        />
        <div className="profile-public-panel__counter">{bio.trim().length}/500</div>
      </div>

      {loading && <div className="profile-public-panel__status">Loading…</div>}
      {error && <div className="profile-public-panel__error">{error}</div>}
      {savedTs && !error && <div className="profile-public-panel__success">Saved</div>}
      <ValidationModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Incomplete profile">
        <div style={{ marginBottom: 8 }}>Please fill the following in this panel:</div>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {missingFields.map((f) => (<li key={f}>{f}</li>))}
        </ul>
        <div style={{ marginTop: 12, opacity: 0.8 }}>Note: To browse Chopping Board, also ensure Main image and Country are set.</div>
      </ValidationModal>
    </div>
  )
}


