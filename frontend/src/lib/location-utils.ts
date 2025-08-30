import { Country, State, City } from 'country-state-city'

export type Option = { value: string; label: string }

export function getCountries(): Option[] {
  return Country.getAllCountries().map((c) => ({ value: c.isoCode, label: c.name }))
}

export function getStates(countryIso: string): Option[] {
  if (!countryIso) return []
  return State.getStatesOfCountry(countryIso).map((s) => ({ value: s.isoCode, label: s.name }))
}

export function getCities(countryIso: string, stateIso: string): Option[] {
  if (!countryIso || !stateIso) return []
  return City.getCitiesOfState(countryIso, stateIso).map((ci) => ({ value: ci.name, label: ci.name }))
}

export function toCountryName(countryIso: string): string {
  return Country.getCountryByCode(countryIso)?.name ?? ''
}

export function toStateName(countryIso: string, stateIso: string): string {
  if (!countryIso || !stateIso) return ''
  const s = State.getStatesOfCountry(countryIso).find((st) => st.isoCode === stateIso)
  return s?.name ?? ''
}

// Compatibility: accept stored ISO code or human name and resolve to ISO
export function toCountryIso(maybeCodeOrName: string): string {
  if (!maybeCodeOrName) return ''
  const byCode = Country.getCountryByCode(maybeCodeOrName)
  if (byCode) return byCode.isoCode
  const match = Country.getAllCountries().find((c) => c.name.toLowerCase() === maybeCodeOrName.toLowerCase())
  return match?.isoCode ?? ''
}

export function toStateIso(countryIso: string, maybeCodeOrName: string): string {
  if (!countryIso || !maybeCodeOrName) return ''
  const states = State.getStatesOfCountry(countryIso)
  const byCode = states.find((s) => s.isoCode === maybeCodeOrName)
  if (byCode) return byCode.isoCode
  const byName = states.find((s) => s.name.toLowerCase() === maybeCodeOrName.toLowerCase())
  return byName?.isoCode ?? ''
}


