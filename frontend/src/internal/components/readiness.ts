import { getBackendApi } from '../../lib/config'

export type ReadinessOverrides = {
  displayName?: string
  ageStr?: string
  bio?: string
  countryCode?: string
}

export async function fetchReadiness(overrides?: ReadinessOverrides): Promise<{ ready: boolean; missing: string[] }> {
  const missing: string[] = []
  try {
    const [pmRes, imgRes] = await Promise.all([
      fetch(getBackendApi('/api/profile-matching'), { credentials: 'include' }).catch(() => null),
      fetch(getBackendApi('/api/profile-images/me'), { credentials: 'include' }).catch(() => null),
    ])

    let displayName = ''
    let age: number | null = null
    let bio = ''
    let country = ''

    if (pmRes && pmRes.ok) {
      const data = await pmRes.json().catch(() => null) as { displayName?: string | null; age?: number | null; bio?: string | null; country?: string | null }
      displayName = typeof data?.displayName === 'string' ? data.displayName : ''
      age = typeof data?.age === 'number' ? data.age : null
      bio = typeof data?.bio === 'string' ? data.bio : ''
      country = typeof data?.country === 'string' ? data.country : ''
    }

    if (typeof overrides?.displayName === 'string') displayName = overrides!.displayName
    if (typeof overrides?.ageStr === 'string') {
      const n = Number(overrides.ageStr)
      age = Number.isInteger(n) ? n : null
    }
    if (typeof overrides?.bio === 'string') bio = overrides.bio
    if (typeof overrides?.countryCode === 'string') country = overrides.countryCode

    let mainUrl: string | null = null
    if (imgRes && imgRes.ok) {
      const imgData = await imgRes.json().catch(() => null) as { main?: string | null }
      mainUrl = typeof imgData?.main === 'string' ? imgData.main : null
    }

    if (!mainUrl) missing.push('Main image')
    if (!displayName || !displayName.trim()) missing.push('Display name')
    if (!(typeof age === 'number' && Number.isInteger(age))) missing.push('Age')
    if (!bio || bio.trim().length < 1) missing.push('Bio')
    if (!country || !country.trim()) missing.push('Country')

    return { ready: missing.length === 0, missing }
  } catch {
    // On error, be conservative and indicate not ready
    return { ready: false, missing: ['Main image', 'Display name', 'Age', 'Bio', 'Country'] }
  }
}


