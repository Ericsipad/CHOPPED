import { useEffect, useMemo, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import ValidationModal from './ValidationModal'
import { fetchReadiness } from './readiness'
import { getBackendApi } from '../../lib/config'
import {
  getCountries,
  getStates,
  getCities,
  toCountryName,
  toStateName,
  toCountryIso,
  toStateIso,
  type Option,
} from '../../lib/location-utils'

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

export default function PrivateSettingsPanel() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedTs, setSavedTs] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [missingFields, setMissingFields] = useState<string[]>([])
  const [errors, setErrors] = useState<{ country?: boolean }>({})
  const [isDarkPreview, setIsDarkPreview] = useState(false)

  const [countryCode, setCountryCode] = useState('')
  const [stateCode, setStateCode] = useState('')
  const [cityName, setCityName] = useState('')
  const [iam, setIam] = useState<'straight_man' | 'gay_man' | 'straight_woman' | 'gay_woman' | ''>('')
  const [Iwant, setIwant] = useState<'straight_man' | 'gay_man' | 'straight_woman' | 'gay_woman' | ''>('')
  const [healthCondition, setHealthCondition] = useState<'' | 'hiv' | 'herpes' | 'autism' | 'physical_handicap'>('')
  const [acceptHiv, setAcceptHiv] = useState(false)
  const [acceptHerpes, setAcceptHerpes] = useState(false)
  const [acceptAutism, setAcceptAutism] = useState(false)
  const [acceptPhysicalHandicap, setAcceptPhysicalHandicap] = useState(false)

  const isValid = useMemo(() => {
    return countryCode.trim().length > 0 && !!iam && !!Iwant
  }, [countryCode, iam, Iwant])

  const countries: Option[] = useMemo(() => getCountries(), [])
  const states: Option[] = useMemo(() => getStates(countryCode), [countryCode])
  const cities: Option[] = useMemo(() => getCities(countryCode, stateCode), [countryCode, stateCode])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(getBackendApi('/api/profile-matching'), { credentials: 'include' })
        if (res.ok) {
          const data = await res.json().catch(() => null) as { country?: string | null; stateProvince?: string | null; city?: string | null; iam?: string | null; Iwant?: string | null; healthCondition?: string | null; Accept_hiv?: boolean | null; Accept_Herpes?: boolean | null; Accept_Autism?: boolean | null; Accept_Physical_Handicap?: boolean | null }
          if (!cancelled && data) {
            const initialCountryIso = toCountryIso(typeof data.country === 'string' ? data.country : '')
            const initialStateIso = toStateIso(initialCountryIso, typeof data.stateProvince === 'string' ? data.stateProvince : '')
            setCountryCode(initialCountryIso)
            setStateCode(initialStateIso)
            setCityName(typeof data.city === 'string' ? data.city : '')
            setIam(typeof data.iam === 'string' ? (data.iam as any) : '')
            setIwant(typeof data.Iwant === 'string' ? (data.Iwant as any) : '')
            // Show no selection if DB has 'none' or no value
            if (typeof data.healthCondition === 'string') {
              const hc = (data.healthCondition as string).toLowerCase()
              setHealthCondition(hc === 'none' ? '' : (hc as any))
            } else {
              setHealthCondition('')
            }
            // Accept_* booleans: default to false when null/undefined
            setAcceptHiv(!!data.Accept_hiv)
            setAcceptHerpes(!!data.Accept_Herpes)
            setAcceptAutism(!!data.Accept_Autism)
            setAcceptPhysicalHandicap(!!data.Accept_Physical_Handicap)
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

      const countryName = toCountryName(countryCode).trim() || countryCode.trim()
      const stateName = toStateName(countryCode, stateCode).trim() || stateCode.trim()
      const city = (cityName || '').trim()
      const parts = [city, stateName, countryName].filter((x) => !!x)
      const locationAnswer = parts.join(', ')

      const body: Record<string, unknown> = {
        country: countryName,
        stateProvince: stateName,
        city,
        locationAnswer,
        ...(iam ? { iam } : {}),
        ...(Iwant ? { Iwant } : {}),
        // Persist 'none' when unselected
        healthCondition: healthCondition ? healthCondition : 'none',
        // Accept_* are stored as booleans in DB; send four independent toggles
        Accept_hiv: !!acceptHiv,
        Accept_Herpes: !!acceptHerpes,
        Accept_Autism: !!acceptAutism,
        Accept_Physical_Handicap: !!acceptPhysicalHandicap,
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
          <div className="profile-public-panel__actions">
            {(() => {
              const isStandalone = (typeof window !== 'undefined') && (((window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || ((window as any).navigator?.standalone === true)))
              return isStandalone ? (
                <button type="button" className="profile-public-panel__save" aria-label="Theme" aria-pressed={isDarkPreview} onClick={() => setIsDarkPreview((v) => !v)}>
                  {isDarkPreview ? <Moon size={16} /> : <Sun size={16} />}
                </button>
              ) : (
                <button type="button" className="theme-toggle" aria-label="Theme" aria-pressed={isDarkPreview} onClick={() => setIsDarkPreview((v) => !v)}>
                  <div className={["theme-toggle__switch", isDarkPreview ? 'is-on' : ''].filter(Boolean).join(' ')} aria-hidden="true">
                    <span className="theme-toggle__icon theme-toggle__icon--sun"><Sun size={12} /></span>
                    <span className="theme-toggle__icon theme-toggle__icon--moon"><Moon size={12} /></span>
                    <div className="theme-toggle__thumb"></div>
                  </div>
                </button>
              )
            })()}
            <button className="profile-public-panel__save" onClick={onSave} disabled={!isValid || saving || loading}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      <div className="profile-public-panel__inputs" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        <div className="profile-public-panel__field">
          <label className={["profile-public-panel__label", errors.country ? 'profile-public-panel__label--error' : ''].filter(Boolean).join(' ')} htmlFor="country">Country</label>
          <select id="country" className={["profile-public-panel__input", "profile-public-panel__input--wide", errors.country ? 'profile-public-panel__input--error' : ''].filter(Boolean).join(' ')} value={countryCode} onChange={(e) => { onChangeCountry(e.target.value); if (errors.country) setErrors((p) => ({ ...p, country: false })) }}>
            <option value="">Select country</option>
            {countries.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="profile-public-panel__field">
          <label className="profile-public-panel__label" htmlFor="state">State/Province</label>
          <select id="state" className="profile-public-panel__input profile-public-panel__input--wide" value={stateCode} onChange={(e) => onChangeState(e.target.value)} disabled={!countryCode}>
            <option value="">Select state/province (optional)</option>
            {states.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div className="profile-public-panel__field">
          <label className="profile-public-panel__label" htmlFor="city">City</label>
          <select id="city" className="profile-public-panel__input profile-public-panel__input--wide" value={cityName} onChange={(e) => setCityName(e.target.value)} disabled={!countryCode || !stateCode}>
            <option value="">Select city (optional)</option>
            {cities.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className="profile-iam" aria-label="I am">
        <legend className="profile-iam__legend">I am</legend>
        <div className="profile-iam__grid" role="radiogroup" aria-label="I am">
          <button type="button" className={["profile-iam__option", iam === 'straight_man' ? 'is-selected' : '', 'profile-iam__option--male'].filter(Boolean).join(' ')} aria-pressed={iam === 'straight_man'} onClick={() => setIam('straight_man')}>
            <span className="profile-iam__icon" aria-hidden>♂</span>
            <span className="profile-iam__label">Straight Man</span>
          </button>
          <button type="button" className={["profile-iam__option", iam === 'gay_man' ? 'is-selected' : '', 'profile-iam__option--male'].filter(Boolean).join(' ')} aria-pressed={iam === 'gay_man'} onClick={() => setIam('gay_man')}>
            <span className="profile-iam__icon" aria-hidden>⚣</span>
            <span className="profile-iam__label">Gay Man</span>
          </button>
          <button type="button" className={["profile-iam__option", iam === 'straight_woman' ? 'is-selected' : '', 'profile-iam__option--female'].filter(Boolean).join(' ')} aria-pressed={iam === 'straight_woman'} onClick={() => setIam('straight_woman')}>
            <span className="profile-iam__icon" aria-hidden>♀</span>
            <span className="profile-iam__label">Straight Woman</span>
          </button>
          <button type="button" className={["profile-iam__option", iam === 'gay_woman' ? 'is-selected' : '', 'profile-iam__option--female'].filter(Boolean).join(' ')} aria-pressed={iam === 'gay_woman'} onClick={() => setIam('gay_woman')}>
            <span className="profile-iam__icon" aria-hidden>⚢</span>
            <span className="profile-iam__label">Gay Woman</span>
          </button>
        </div>
      </fieldset>

      <fieldset className="profile-iam" aria-label="I'm Searching For">
        <legend className="profile-iam__legend">I'm Searching For</legend>
        <div className="profile-iam__grid" role="radiogroup" aria-label="I'm Searching For">
          <button type="button" className={["profile-iam__option", Iwant === 'straight_man' ? 'is-selected' : '', 'profile-iam__option--male'].filter(Boolean).join(' ')} aria-pressed={Iwant === 'straight_man'} onClick={() => setIwant('straight_man')}>
            <span className="profile-iam__icon" aria-hidden>♂</span>
            <span className="profile-iam__label">Straight Man</span>
          </button>
          <button type="button" className={["profile-iam__option", Iwant === 'gay_man' ? 'is-selected' : '', 'profile-iam__option--male'].filter(Boolean).join(' ')} aria-pressed={Iwant === 'gay_man'} onClick={() => setIwant('gay_man')}>
            <span className="profile-iam__icon" aria-hidden>⚣</span>
            <span className="profile-iam__label">Gay Man</span>
          </button>
          <button type="button" className={["profile-iam__option", Iwant === 'straight_woman' ? 'is-selected' : '', 'profile-iam__option--female'].filter(Boolean).join(' ')} aria-pressed={Iwant === 'straight_woman'} onClick={() => setIwant('straight_woman')}>
            <span className="profile-iam__icon" aria-hidden>♀</span>
            <span className="profile-iam__label">Straight Woman</span>
          </button>
          <button type="button" className={["profile-iam__option", Iwant === 'gay_woman' ? 'is-selected' : '', 'profile-iam__option--female'].filter(Boolean).join(' ')} aria-pressed={Iwant === 'gay_woman'} onClick={() => setIwant('gay_woman')}>
            <span className="profile-iam__icon" aria-hidden>⚢</span>
            <span className="profile-iam__label">Gay Woman</span>
          </button>
        </div>
      </fieldset>

      <div className="profile-note--glow-blue" role="note">
        The health settings are not publicly viewable and are only used to prioritize matches internally. You will still receive non-aligned health matches in your feed as well as aligned.
      </div>

      <fieldset className="profile-iam" aria-label="Health status">
        <legend className="profile-iam__legend">Health status: We prioritize matching for these selections</legend>
        <div className="profile-iam__grid" role="radiogroup" aria-label="Health status">
          <button type="button" className={["profile-iam__option", healthCondition === 'hiv' ? 'is-selected' : ''].filter(Boolean).join(' ')} aria-pressed={healthCondition === 'hiv'} onClick={() => setHealthCondition(healthCondition === 'hiv' ? '' : 'hiv')}>
            <span className="profile-iam__label">HIV</span>
          </button>
          <button type="button" className={["profile-iam__option", healthCondition === 'herpes' ? 'is-selected' : ''].filter(Boolean).join(' ')} aria-pressed={healthCondition === 'herpes'} onClick={() => setHealthCondition(healthCondition === 'herpes' ? '' : 'herpes')}>
            <span className="profile-iam__label">Herpes</span>
          </button>
          <button type="button" className={["profile-iam__option", healthCondition === 'autism' ? 'is-selected' : ''].filter(Boolean).join(' ')} aria-pressed={healthCondition === 'autism'} onClick={() => setHealthCondition(healthCondition === 'autism' ? '' : 'autism')}>
            <span className="profile-iam__label">Autism</span>
          </button>
          <button type="button" className={["profile-iam__option", healthCondition === 'physical_handicap' ? 'is-selected' : ''].filter(Boolean).join(' ')} aria-pressed={healthCondition === 'physical_handicap'} onClick={() => setHealthCondition(healthCondition === 'physical_handicap' ? '' : 'physical_handicap')}>
            <span className="profile-iam__label">Physical Handicap</span>
          </button>
        </div>
      </fieldset>

      <fieldset className="profile-iam" aria-label="I will accept a partner with">
        <legend className="profile-iam__legend">I will accept a partner with:</legend>
        <div className="profile-iam__grid" role="group" aria-label="I will accept a partner with">
          <button type="button" className={["profile-iam__option", acceptHiv ? 'is-selected' : ''].filter(Boolean).join(' ')} aria-pressed={acceptHiv} onClick={() => setAcceptHiv((v) => !v)}>
            <span className="profile-iam__label">HIV</span>
          </button>
          <button type="button" className={["profile-iam__option", acceptHerpes ? 'is-selected' : ''].filter(Boolean).join(' ')} aria-pressed={acceptHerpes} onClick={() => setAcceptHerpes((v) => !v)}>
            <span className="profile-iam__label">Herpes</span>
          </button>
          <button type="button" className={["profile-iam__option", acceptAutism ? 'is-selected' : ''].filter(Boolean).join(' ')} aria-pressed={acceptAutism} onClick={() => setAcceptAutism((v) => !v)}>
            <span className="profile-iam__label">Autism</span>
          </button>
          <button type="button" className={["profile-iam__option", acceptPhysicalHandicap ? 'is-selected' : ''].filter(Boolean).join(' ')} aria-pressed={acceptPhysicalHandicap} onClick={() => setAcceptPhysicalHandicap((v) => !v)}>
            <span className="profile-iam__label">Physical Handicap</span>
          </button>
        </div>
      </fieldset>

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


