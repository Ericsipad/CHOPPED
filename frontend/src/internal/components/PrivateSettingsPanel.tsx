import { useEffect, useMemo, useState } from 'react'
import ValidationModal from './ValidationModal'
import { fetchReadiness } from './readiness'
import { getBackendApi } from '../../lib/config'

function EyeOffIcon(props: { size?: number }) {
  const size = props.size ?? 18
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M2 5l17 17" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5"/>
      <path d="M12 5C7 5 2.73 8.11 1 12c.62 1.39 1.58 2.67 2.76 3.78M21.83 15.17C22.56 14.18 23 13.12 23 12c-1.73-3.89-6-7-11-7-1.18 0-2.32.16-3.39.45" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="3" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5"/>
    </svg>
  )
}

type Country = { code: string; name: string }
type StateItem = { code: string; name: string }
type CityItem = { name: string }

export default function PrivateSettingsPanel() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedTs, setSavedTs] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [missingFields, setMissingFields] = useState<string[]>([])
  const [errors, setErrors] = useState<{ country?: boolean }>({})

  const [countries, setCountries] = useState<Country[]>([])
  const [statesByCountry, setStatesByCountry] = useState<Record<string, StateItem[]>>({})
  const [citiesByState, setCitiesByState] = useState<Record<string, CityItem[]>>({})

  const [countryCode, setCountryCode] = useState('')
  const [stateCode, setStateCode] = useState('')
  const [cityName, setCityName] = useState('')

  const isValid = useMemo(() => {
    return countryCode.trim().length > 0
  }, [countryCode])

  const states = useMemo(() => {
    if (!countryCode) return []
    return statesByCountry[countryCode] || []
  }, [statesByCountry, countryCode])

  const cities = useMemo(() => {
    if (!countryCode) return []
    const key = `${countryCode}__${stateCode || ''}`
    return citiesByState[key] || []
  }, [citiesByState, countryCode, stateCode])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const resMap = await fetch(getBackendApi('/api/mapset'), { credentials: 'include' })
        if (resMap.ok) {
          const data = await resMap.json().catch(() => null) as { countries?: Country[]; statesByCountry?: Record<string, StateItem[]>; citiesByState?: Record<string, CityItem[]> }
          if (!cancelled && data) {
            setCountries(Array.isArray(data.countries) ? data.countries : [])
            setStatesByCountry(typeof data.statesByCountry === 'object' && data.statesByCountry ? data.statesByCountry : {})
            setCitiesByState(typeof data.citiesByState === 'object' && data.citiesByState ? data.citiesByState : {})
          }
        }

        const res = await fetch(getBackendApi('/api/profile-matching'), { credentials: 'include' })
        if (res.ok) {
          const data = await res.json().catch(() => null) as { country?: string | null; stateProvince?: string | null; city?: string | null }
          if (!cancelled && data) {
            setCountryCode(typeof data.country === 'string' ? data.country : '')
            setStateCode(typeof data.stateProvince === 'string' ? data.stateProvince : '')
            setCityName(typeof data.city === 'string' ? data.city : '')
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load settings'
        setError(msg)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  function onChangeCountry(code: string) {
    setCountryCode(code)
    setStateCode('')
    setCityName('')
  }
  function onChangeState(code: string) {
    setStateCode(code)
    setCityName('')
  }

  async function onSave() {
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      // local panel validation to highlight missing
      const panelMissing: string[] = []
      const nextErrors: { country?: boolean } = {}
      if (!countryCode.trim()) { panelMissing.push('Country'); nextErrors.country = true }
      setErrors(nextErrors)
      if (panelMissing.length > 0) {
        setMissingFields(panelMissing)
        setModalOpen(true)
        throw new Error('Validation error')
      }

      const countryName = (countries.find((c) => c.code === countryCode)?.name || countryCode).trim()
      const stateName = (states.find((s) => s.code === stateCode)?.name || stateCode).trim()
      const city = (cityName || '').trim()
      const parts = [city, stateName, countryName].filter((x) => !!x)
      const locationAnswer = parts.join(', ')

      const body: Record<string, unknown> = {
        country: countryCode,
        stateProvince: stateCode,
        city,
        locationAnswer,
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
      const { ready, missing: readinessMissing } = await fetchReadiness({ countryCode })
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
          <EyeOffIcon />
          <span>Private information used for matching</span>
        </div>
        <div className="profile-public-panel__right">
          <button className="profile-public-panel__save" onClick={onSave} disabled={!isValid || saving || loading}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <div className="profile-public-panel__inputs" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        <div className="profile-public-panel__field">
          <label className={["profile-public-panel__label", errors.country ? 'profile-public-panel__label--error' : ''].filter(Boolean).join(' ')} htmlFor="country">Country</label>
          <select id="country" className={["profile-public-panel__input", "profile-public-panel__input--wide", errors.country ? 'profile-public-panel__input--error' : ''].filter(Boolean).join(' ')} value={countryCode} onChange={(e) => { onChangeCountry(e.target.value); if (errors.country) setErrors((p) => ({ ...p, country: false })) }}>
            <option value="">Select country</option>
            {countries.map((c) => (
              <option key={c.code || c.name} value={c.code || c.name}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="profile-public-panel__field">
          <label className="profile-public-panel__label" htmlFor="state">State/Province</label>
          <select id="state" className="profile-public-panel__input profile-public-panel__input--wide" value={stateCode} onChange={(e) => onChangeState(e.target.value)} disabled={!countryCode}>
            <option value="">Select state/province (optional)</option>
            {states.map((s) => (
              <option key={(s.code || s.name) + s.name} value={s.code || s.name}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="profile-public-panel__field">
          <label className="profile-public-panel__label" htmlFor="city">City</label>
          <select id="city" className="profile-public-panel__input profile-public-panel__input--wide" value={cityName} onChange={(e) => setCityName(e.target.value)} disabled={!countryCode}>
            <option value="">Select city (optional)</option>
            {cities.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <div className="profile-public-panel__status">Loading…</div>}
      {error && <div className="profile-public-panel__error">{error}</div>}
      {savedTs && !error && <div className="profile-public-panel__success">Saved</div>}
      <ValidationModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Incomplete profile">
        <div style={{ marginBottom: 8 }}>Please fill the following in this panel:</div>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {missingFields.map((f) => (<li key={f}>{f}</li>))}
        </ul>
        <div style={{ marginTop: 12, opacity: 0.8 }}>Note: To browse Chopping Board, also ensure Main image and Public Bio fields are set.</div>
      </ValidationModal>
    </div>
  )
}


