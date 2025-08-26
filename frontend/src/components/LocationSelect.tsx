"use client";

import { useEffect, useMemo, useState } from "react";
import { Country, State, City } from "country-state-city";
import type { IState, ICity } from "country-state-city";

type Props = {
  value: { country?: string; state?: string; city?: string };
  onChange: (next: { country?: string; state?: string; city?: string }, labels: { countryName?: string; stateName?: string; cityName?: string }) => void;
};

export default function LocationSelect({ value, onChange }: Props) {
  const countries = useMemo(() => Country.getAllCountries(), []);
  const [states, setStates] = useState<IState[]>([]);
  const [cities, setCities] = useState<ICity[]>([]);

  useEffect(() => {
    if (value.country) {
      setStates(State.getStatesOfCountry(value.country));
    } else {
      setStates([]);
    }
    setCities([]);
  }, [value.country]);

  useEffect(() => {
    if (value.country && value.state) {
      setCities(City.getCitiesOfState(value.country, value.state));
    } else {
      setCities([]);
    }
  }, [value.country, value.state]);

  return (
    <div className="location-select">
      <label>Country
        <select
          value={value.country || ""}
          onChange={(e) => {
            const code = e.target.value || undefined;
            const selected = countries.find((c) => c.isoCode === code);
            onChange({ country: code, state: undefined, city: undefined }, { countryName: selected?.name });
          }}
        >
          <option value="">Select country</option>
          {countries.map((c) => (
            <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
          ))}
        </select>
      </label>
      <label>State/Province
        <select
          value={value.state || ""}
          onChange={(e) => {
            const code = e.target.value || undefined;
            const selected = states.find((s) => s.isoCode === code);
            onChange({ ...value, state: code, city: undefined }, { stateName: selected?.name });
          }}
          disabled={!value.country}
        >
          <option value="">Select state/province</option>
          {states.map((s) => (
            <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
          ))}
        </select>
      </label>
      <label>City
        <select
          value={value.city || ""}
          onChange={(e) => {
            const name = e.target.value || undefined;
            onChange({ ...value, city: name }, { cityName: name });
          }}
          disabled={!value.state}
        >
          <option value="">Select city</option>
          {cities.map((c) => (
            <option key={c.name} value={c.name}>{c.name}</option>
          ))}
        </select>
      </label>
      <style jsx>{`
        select { width: 100%; padding: 12px; border-radius: 12px; border: 1px solid #ccc; margin: 8px 0; }
      `}</style>
    </div>
  );
}


