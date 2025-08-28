import React, { useCallback, useMemo, useState } from 'react'

export type SignInDialogProps = {
\topen: boolean
\tonClose: () => void
\tonSuccess?: () => void
}

function getBackendBaseUrl(): string {
\tconst a = (import.meta as any).env?.NEXT_PUBLIC_API_BASE_URL as string | undefined
\tconst b = (import.meta as any).env?.VITE_BACKEND_URL as string | undefined
\treturn a && a.length > 0 ? a : b && b.length > 0 ? b : ''
}

export default function SignInDialog(props: SignInDialogProps) {
\tconst { open, onClose, onSuccess } = props
\tconst [email, setEmail] = useState('')
\tconst [password, setPassword] = useState('')
\tconst [submitting, setSubmitting] = useState(false)
\tconst [error, setError] = useState<string | null>(null)

\tconst isValid = useMemo(() => {
\t	const emailOk = /.+@.+\..+/.test(email)
\t	const pwOk = password.length >= 8
\t	return emailOk && pwOk
\t}, [email, password])

\tconst handleSubmit = useCallback(async (e: React.FormEvent) => {
\t	e.preventDefault()
\t	if (!isValid || submitting) return
\t	setSubmitting(true)
\t	setError(null)
\t	try {
\t		const backendBaseUrl = getBackendBaseUrl()
\t		const url = `${backendBaseUrl}/auth/sign-in`
\t		const res = await fetch(url, {
\t			method: 'POST',
\t			headers: { 'Content-Type': 'application/json' },
\t			credentials: 'include',
\t			body: JSON.stringify({ email, password }),
\t		})
\t		if (!res.ok) {
\t			const data = await res.json().catch(() => ({})) as { error?: string }
\t			throw new Error(data?.error || 'Sign in failed')
\t		}
\t		onClose()
\t		onSuccess?.()
\t	} catch (err) {
\t		const msg = err instanceof Error ? err.message : 'Sign in failed'
\t		setError(msg)
\t	} finally {
\t		setSubmitting(false)
\t	}
\t}, [email, password, isValid, onClose, onSuccess, submitting])

\tif (!open) return null

\treturn (
\t\t<div role="dialog" aria-modal="true" aria-label="Sign in dialog" style={styles.overlay}>
\t\t\t<div style={styles.card}>
\t\t\t\t<div style={styles.header}>Sign in</div>
\t\t\t\t<form onSubmit={handleSubmit} style={styles.form}>
\t\t\t\t\t<label style={styles.label}>
\t\t\t\t\t\t<span style={styles.labelText}>Email</span>
\t\t\t\t\t\t<input
\t\t\t\t\t\t\ttype="email"
\t\t\t\t\t\t\tvalue={email}
\t\t\t\t\t\t\tonChange={(e) => setEmail(e.target.value)}
\t\t\t\t\t\t\tplaceholder="you@example.com"
\t\t\t\t\t\t\trequired
\t\t\t\t\t\t\tstyle={styles.input}
\t\t\t\t\t\t/>
\t\t\t\t\t</label>
\t\t\t\t\t<label style={styles.label}>
\t\t\t\t\t\t<span style={styles.labelText}>Password</span>
\t\t\t\t\t\t<input
\t\t\t\t\t\t\ttype="password"
\t\t\t\t\t\t\tvalue={password}
\t\t\t\t\t\t\tonChange={(e) => setPassword(e.target.value)}
\t\t\t\t\t\t\tplaceholder="At least 8 characters"
\t\t\t\t\t\t\trequired
\t\t\t\t\t\t\tminLength={8}
\t\t\t\t\t\t\tstyle={styles.input}
\t\t\t\t\t\t/>
\t\t\t\t\t</label>
\t\t\t\t\t{error ? <div style={styles.error}>{error}</div> : null}
\t\t\t\t\t<div style={styles.actions}>
\t\t\t\t\t\t<button type="button" onClick={onClose} style={styles.cancelBtn} disabled={submitting}>Cancel</button>
\t\t\t\t\t\t<button type="submit" style={styles.submitBtn} disabled={!isValid || submitting}>
\t\t\t\t\t\t\t{submitting ? 'Signing in...' : 'Sign in'}
\t\t\t\t\t\t</button>
\t\t\t\t\t</div>
\t\t\t\t</form>
\t\t\t</div>
\t\t</div>
\t)
}

const styles: Record<string, React.CSSProperties> = {
\toverlay: {
\t\tposition: 'fixed',
\t\tleft: 0,
\t\ttop: 0,
\t\twidth: '100vw',
\t\theight: '100vh',
\t\tbackground: 'rgba(0,0,0,0.6)',
\t\tdisplay: 'flex',
\t\talignItems: 'center',
\t\tjustifyContent: 'center',
\t\tzIndex: 1000,
\t},
\tcard: {
\t\twidth: 'min(92vw, 420px)',
\t\tbackground: '#111',
\t\tcolor: '#fff',
\t\tborderRadius: 12,
\t\tboxShadow: '0 8px 32px rgba(0,0,0,0.45)',
\t\tpadding: 20,
\t\tborder: '1px solid rgba(255,255,255,0.08)'
\t},
\theader: {
\t\tfontSize: 22,
\t\tmarginBottom: 12,
\t\tfontFamily: 'Segoe UI, Roboto, Helvetica, Arial, sans-serif',
\t},
\tform: { display: 'flex', flexDirection: 'column', gap: 12 },
\tlabel: { display: 'flex', flexDirection: 'column', gap: 6 },
\tlabelText: { fontSize: 14, opacity: 0.9 },
\tinput: {
\t\tbackground: '#000',
\t\tcolor: '#fff',
\t\tborder: '1px solid rgba(255,255,255,0.2)',
\t\tborderRadius: 8,
\t\tpadding: '10px 12px',
\t\tfontSize: 16,
\t\toutline: 'none',
\t},
\tactions: { display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 },
\tcancelBtn: {
\t\tbackground: '#333',
\t\tcolor: '#fff',
\t\tborder: 'none',
\t\tborderRadius: 9999,
\t\tpadding: '10px 16px',
\t\tcursor: 'pointer',
\t},
\tsubmitBtn: {
\t\tbackground: '#fff',
\t\tcolor: '#111',
\t\tborder: 'none',
\t\tborderRadius: 9999,
\t\tpadding: '10px 16px',
\t\tcursor: 'pointer',
\t},
\terror: {
\t\tcolor: '#ff7676',
\t\tfontSize: 14,
\t}
}


