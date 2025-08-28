import React, { useCallback, useMemo, useState } from 'react'
import { z } from 'zod'
import { getBackendUrl } from '../../lib/config'

export type SignUpDialogProps = {
	open: boolean
	onClose: () => void
	onSuccess?: () => void
}

export default function SignUpDialog(props: SignUpDialogProps) {
	const { open, onClose, onSuccess } = props
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [repeatPassword, setRepeatPassword] = useState('')
	const [submitting, setSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [message, setMessage] = useState<string | null>(null)

	const checks = useMemo(() => ({
		email: /.+@.+\..+/.test(email),
		length: password.length >= 8,
		upper: /[A-Z]/.test(password),
		lower: /[a-z]/.test(password),
		number: /\d/.test(password),
		special: /[^A-Za-z0-9]/.test(password),
		match: password.length > 0 && password === repeatPassword,
	}), [email, password, repeatPassword])

	const allValid = checks.email && checks.length && checks.upper && checks.lower && checks.number && checks.special && checks.match

	const handleSubmit = useCallback(async (e: React.FormEvent) => {
		e.preventDefault()
		if (!allValid || submitting) return
		setSubmitting(true)
		setError(null)
		setMessage(null)
		try {
			const schema = z
				.object({
					email: z.string().email(),
					password: z
						.string()
						.min(8)
						.regex(/[A-Z]/, 'Needs uppercase')
						.regex(/[a-z]/, 'Needs lowercase')
						.regex(/\d/, 'Needs number')
						.regex(/[^A-Za-z0-9]/, 'Needs special'),
					repeatPassword: z.string(),
				})
				.refine((v) => v.password === v.repeatPassword, { path: ['repeatPassword'], message: 'Passwords must match' })
			schema.parse({ email, password, repeatPassword })
			const backendBaseUrl = getBackendUrl()
			const url = `${backendBaseUrl}/auth/sign-up`
			const res = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ email, password }),
			})
			if (!res.ok) {
				const data = (await res.json().catch(() => ({}))) as { error?: string }
				throw new Error(data?.error || 'Sign up failed')
			}
			setMessage('Please check your email for the verification link to log in.')
			onSuccess?.()
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Sign up failed'
			setError(msg)
		} finally {
			setSubmitting(false)
		}
	}, [allValid, email, onSuccess, password, repeatPassword, submitting])

	if (!open) return null

	return (
		<div role="dialog" aria-modal="true" aria-label="Sign up dialog" style={styles.overlay}>
			<div style={styles.card}>
				<div style={styles.header}>Create your account</div>
				<form onSubmit={handleSubmit} style={styles.form}>
					<label style={styles.label}>
						<span style={styles.labelText}>Email</span>
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="you@example.com"
							required
							style={styles.input}
						/>
					</label>
					<label style={styles.label}>
						<span style={styles.labelText}>Password</span>
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="At least 8 characters"
							required
							minLength={8}
							style={styles.input}
						/>
						<div style={styles.checklist}>
							<div style={{ color: checks.length ? '#6ee7b7' : '#ff7676' }}>8+ characters</div>
							<div style={{ color: checks.upper ? '#6ee7b7' : '#ff7676' }}>uppercase letter</div>
							<div style={{ color: checks.lower ? '#6ee7b7' : '#ff7676' }}>lowercase letter</div>
							<div style={{ color: checks.number ? '#6ee7b7' : '#ff7676' }}>number</div>
							<div style={{ color: checks.special ? '#6ee7b7' : '#ff7676' }}>special character</div>
						</div>
					</label>
					<label style={styles.label}>
						<span style={styles.labelText}>Repeat password</span>
						<input
							type="password"
							value={repeatPassword}
							onChange={(e) => setRepeatPassword(e.target.value)}
							required
							style={styles.input}
						/>
						<div style={{ fontSize: 14, marginTop: 6, color: checks.match ? '#6ee7b7' : '#ff7676' }}>
							{checks.match ? 'Passwords match' : 'Passwords must match'}
						</div>
					</label>
					{error ? <div style={styles.error}>{error}</div> : null}
					{message ? <div style={styles.success}>{message}</div> : null}
					<div style={styles.actions}>
						<button type="button" onClick={onClose} style={styles.cancelBtn} disabled={submitting}>Cancel</button>
						<button type="submit" style={styles.submitBtn} disabled={!allValid || submitting}>
							{submitting ? 'Signing up...' : 'Sign up'}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}

const styles: Record<string, React.CSSProperties> = {
	overlay: {
		position: 'fixed',
		left: 0,
		top: 0,
		width: '100vw',
		height: '100vh',
		background: 'rgba(0,0,0,0.6)',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 1000,
	},
	card: {
		width: 'min(92vw, 420px)',
		background: '#111',
		color: '#fff',
		borderRadius: 12,
		boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
		padding: 20,
		border: '1px solid rgba(255,255,255,0.08)'
	},
	header: {
		fontSize: 22,
		marginBottom: 12,
		fontFamily: 'Segoe UI, Roboto, Helvetica, Arial, sans-serif',
	},
	form: { display: 'flex', flexDirection: 'column', gap: 12 },
	label: { display: 'flex', flexDirection: 'column', gap: 6 },
	labelText: { fontSize: 14, opacity: 0.9 },
	input: {
		background: '#000',
		color: '#fff',
		border: '1px solid rgba(255,255,255,0.2)',
		borderRadius: 8,
		padding: '10px 12px',
		fontSize: 16,
		outline: 'none',
	},
	checklist: { display: 'flex', flexDirection: 'column', gap: 2, marginTop: 6, fontSize: 14 },
	actions: { display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 },
	cancelBtn: {
		background: '#333',
		color: '#fff',
		border: 'none',
		borderRadius: 9999,
		padding: '10px 16px',
		cursor: 'pointer',
	},
	submitBtn: {
		background: '#fff',
		color: '#111',
		border: 'none',
		borderRadius: 9999,
		padding: '10px 16px',
		cursor: 'pointer',
	},
	error: { color: '#ff7676', fontSize: 14 },
	success: { color: '#6ee7b7', fontSize: 14 },
}


