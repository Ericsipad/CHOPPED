"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getSupabaseClient } from "@/lib/supabaseClient";
import LocationSelect from "@/components/LocationSelect";
import Image from "next/image";

const passwordSchema = z
  .string()
  .min(8, "Min 8 characters")
  .regex(/[A-Z]/, "At least one uppercase letter")
  .regex(/[^A-Za-z0-9]/, "At least one symbol");

const formSchema = z
  .object({
    email: z.string().email(),
    password: passwordSchema,
    confirmPassword: z.string(),
    displayName: z.string().min(2).max(50),
    age: z.coerce.number().int().min(18).max(120),
    country: z.string().min(1),
    state: z.string().optional(),
    city: z.string().optional(),
    bio: z.string().max(500).optional(),
    disclosures: z.object({
      herpes: z.boolean().optional(),
      hiv: z.boolean().optional(),
      handicap: z.boolean().optional(),
      autism: z.boolean().optional(),
      digitalNomad: z.boolean().optional(),
    }),
    accepts: z.object({
      herpes: z.boolean().optional(),
      hiv: z.boolean().optional(),
      handicap: z.boolean().optional(),
      autism: z.boolean().optional(),
      digitalNomad: z.boolean().optional(),
    }),
    gender: z.object({ iAm: z.string(), matchWith: z.string() }),
    terms: z.literal(true, { errorMap: () => ({ message: "Please accept" }) }),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof formSchema>;

export default function SignUpPage() {
  const [step, setStep] = useState(1);
  const [availability, setAvailability] = useState<"checking" | "available" | "unavailable" | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageId, setImageId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      disclosures: {},
      accepts: {},
      gender: { iAm: "straight_male", matchWith: "straight_female" },
    },
  });

  const password = watch("password");
  const displayName = watch("displayName");

  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      if (!displayName || displayName.length < 2) {
        setAvailability(null);
        return;
      }
      setAvailability("checking");
      try {
        const res = await fetch(`/api/profile/check-display-name?name=${encodeURIComponent(displayName)}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setAvailability(data.available ? "available" : "unavailable");
      } catch {
        setAvailability(null);
      }
    };
    const t = setTimeout(run, 400);
    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [displayName]);

  const passwordChecklist = useMemo(() => {
    const checks = [
      { label: "Min 8 characters", pass: !!password && password.length >= 8 },
      { label: "One uppercase", pass: !!password && /[A-Z]/.test(password) },
      { label: "One symbol", pass: !!password && /[^A-Za-z0-9]/.test(password) },
    ];
    return checks;
  }, [password]);

  const onSubmit = async (values: FormValues) => {
    // Create supabase auth user first
    const supabase = getSupabaseClient();
    const { error: signUpError } = await supabase.auth.signUp({ email: values.email, password: values.password });
    if (signUpError) {
      setError("email", { message: signUpError.message });
      return;
    }

    // Save profile (without email)
    const profileRes = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: values.displayName,
        age: values.age,
        location: {
          countryCode: values.country,
          countryName: values.country,
          stateCode: values.state,
          stateName: values.state,
          city: values.city,
        },
        bio: values.bio,
        disclosures: values.disclosures,
        accepts: values.accepts,
        gender: values.gender,
        termsAcceptedAt: new Date().toISOString(),
      }),
    });
    if (!profileRes.ok) {
      const data = await profileRes.json();
      if (String(data.error || "").toLowerCase().includes("display name")) {
        setError("displayName", { message: "Display name not available" });
      }
      return;
    }
    setStep(3);
  };

  const uploadImage = async (f: File) => {
    if (f.size > (Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB || 20) * 1024 * 1024)) {
      alert("File too large");
      return;
    }
    const fd = new FormData();
    fd.append("file", f);
    setUploading(true);
    try {
      const res = await fetch("/api/upload/profile-image", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        setImageId(data.image.id);
      } else {
        alert(data.error || "Upload failed");
      }
    } finally {
      setUploading(false);
    }
  };

  const Section1 = () => (
    <section>
      <p className="muted">
        We do not need to collect any personal info at this point and you should create a unique email you use ony for this site. Later, you can opt to verify your account with our Fully OFFLINE unhackable IDentity verfication before meeting a person in real life- See details on the home page
      </p>
      <label>Email
        <input type="email" {...register("email")} placeholder="you@example.com" />
      </label>
      {errors.email && <span className="error">{errors.email.message}</span>}
      <label>Password
        <input type="password" {...register("password")} placeholder="••••••••" />
      </label>
      <ul className="checklist">
        {passwordChecklist.map((c) => (
          <li key={c.label} className={c.pass ? "ok" : ""}>{c.label}</li>
        ))}
      </ul>
      <label>Confirm password
        <input type="password" {...register("confirmPassword")} placeholder="••••••••" />
      </label>
      {errors.confirmPassword && <span className="error">{errors.confirmPassword.message}</span>}
      <button type="button" onClick={() => setStep(2)} disabled={passwordChecklist.some((c) => !c.pass)}>
        Continue
      </button>
    </section>
  );

  const Section2 = () => (
    <section>
      <label>Display name
        <input type="text" {...register("displayName")} placeholder="Your name" />
      </label>
      {availability === "available" && <span className="ok">Available ✓</span>}
      {availability === "unavailable" && <span className="error">Not available</span>}
      <label>Age
        <input type="number" min={18} max={120} {...register("age", { valueAsNumber: true })} />
      </label>
      <LocationSelect
        value={{ country: watch("country"), state: watch("state"), city: watch("city") }}
        onChange={(next) => {
          setValue("country", next.country || "", { shouldDirty: true });
          setValue("state", next.state || "", { shouldDirty: true });
          setValue("city", next.city || "", { shouldDirty: true });
        }}
      />
      <label>Tell us about yourself (500 chars)
        <textarea maxLength={500} {...register("bio")} />
      </label>
      <div className="terms">
        <label>
          <input type="checkbox" {...register("terms")} /> I agree to the <a href="/terms" target="_blank" rel="noreferrer">Terms and Conditions</a>
        </label>
        {errors.terms && <span className="error">{errors.terms.message}</span>}
      </div>
      <div className="actions">
        <button type="button" onClick={() => setStep(1)}>Back</button>
        <button type="button" onClick={handleSubmit(onSubmit)} disabled={availability !== "available"}>Continue</button>
      </div>
    </section>
  );

  const Section3 = () => (
    <section>
      <p>Upload a profile picture (max 20 MB). We accept most phone image formats. If a format is not supported on web, we will convert it for display.</p>
      <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); }} />
      {uploading && <p>Uploading...</p>}
      {imageId && (
        <Image src={`/api/profile/image/${imageId}`} alt="Profile preview" width={160} height={160} style={{ borderRadius: 12 }} />
      )}
      <div className="actions">
        <button type="button" onClick={() => setStep(2)}>Back</button>
        <button type="button" onClick={() => setStep(4)} disabled={!imageId}>Continue</button>
      </div>
    </section>
  );

  const toggles = ["herpes", "hiv", "handicap", "autism", "digitalNomad"] as const;
  const Section4 = () => (
    <section>
      <p>These are kept private but help align users that match so you know the people youre seeing are more likely to be on the same wave as you.</p>
      <div className="grid">
        <div><strong>I am/have</strong></div>
        <div><strong>I&apos;ll accept in a match</strong></div>
        <div><strong>Option</strong></div>
        {toggles.map((key) => (
          <>
            <button
              type="button"
              className="pill"
              onClick={() => {
                const current = Boolean(watch("disclosures")[key]);
                setValue(`disclosures.${key}` as const, !current, { shouldDirty: true });
              }}
            >
              Toggle
            </button>
            <button
              type="button"
              className="pill"
              onClick={() => {
                const current = Boolean(watch("accepts")[key]);
                setValue(`accepts.${key}` as const, !current, { shouldDirty: true });
              }}
            >
              Toggle
            </button>
            <div>{key}</div>
            <input type="checkbox" hidden {...register(`disclosures.${key}` as const)} />
            <input type="checkbox" hidden {...register(`accepts.${key}` as const)} />
          </>
        ))}
      </div>
      <div className="actions">
        <button type="button" onClick={() => setStep(3)}>Back</button>
        <button type="button" onClick={() => setStep(5)}>Continue</button>
      </div>
    </section>
  );

  const Section5 = () => (
    <section>
      <p>Ummmm.... this is a hard one but we need to narrow down the database so this needs to be somewhat generic to start.</p>
      <div className="grid2">
        <div>
          <h3>I AM</h3>
          {[
            ["straight_male", "Straight male"],
            ["gay_male", "Gay male"],
            ["straight_female", "Straight female"],
            ["gay_female", "Gay female"],
            ["bi_male", "Bi-sexual male"],
            ["bi_female", "Bi-sexual female"],
          ].map(([val, label]) => (
            <label key={val as string}><input type="radio" value={val as string} {...register("gender.iAm")} /> {label}</label>
          ))}
        </div>
        <div>
          <h3>Match me with</h3>
          {[
            ["straight_male", "Straight male"],
            ["gay_male", "Gay male"],
            ["straight_female", "Straight female"],
            ["gay_female", "Gay female"],
            ["bi_male", "Bi-sexual male"],
            ["bi_female", "Bi-sexual female"],
          ].map(([val, label]) => (
            <label key={val as string}><input type="radio" value={val as string} {...register("gender.matchWith")} /> {label}</label>
          ))}
        </div>
      </div>
      <div className="actions">
        <button type="button" onClick={() => setStep(4)}>Back</button>
        <button type="submit" disabled={isSubmitting}>Finish</button>
      </div>
    </section>
  );

  return (
    <main className="signup">
      <form onSubmit={handleSubmit(onSubmit)}>
        {step === 1 && <Section1 />}
        {step === 2 && <Section2 />}
        {step === 3 && <Section3 />}
        {step === 4 && <Section4 />}
        {step === 5 && <Section5 />}
      </form>
      <style jsx>{`
        .signup { padding: 16px; max-width: 560px; margin: 0 auto; }
        input, textarea, button { width: 100%; padding: 12px; margin: 8px 0; border-radius: 12px; border: 1px solid #ccc; }
        button { background: linear-gradient(135deg, #1e90ff, #ff2db2, #00c853); color: white; border: none; }
        .checklist li.ok { color: #00c853; }
        .ok { color: #00c853; }
        .error { color: #ff3b30; }
        .pill { border: 1px solid #ccc; background: #111; color: #eee; box-shadow: none; }
        .pill:active, .pill:focus { box-shadow: 0 0 0 6px rgba(0,200,83,0.25); }
        .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; align-items: center; }
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .muted { color: #888; font-size: 14px; }
        .actions { display: flex; gap: 12px; }
      `}</style>
    </main>
  );
}


