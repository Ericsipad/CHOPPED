import React, { useCallback, useMemo, useState } from 'react'
import { getFrontendApi } from '../../lib/config'

export type SignInDialogProps = {
	open: boolean
	onClose: () => void
	onSuccess?: () => void
	initialMessage?: string
}

// Use centralized backend URL resolution via getBackendApi

export default function SignInDialog(props: SignInDialogProps) {
	const { open, onClose, onSuccess, initialMessage } = props
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [submitting, setSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [info] = useState<string | null>(initialMessage ?? null)

	const isValid = useMemo(() => {
		const emailOk = /.+@.+\..+/.test(email)
		const pwOk = password.length >= 8
		return emailOk && pwOk
	}, [email, password])

	const handleSubmit = useCallback(async (e: React.FormEvent) => {
		e.preventDefault()
		if (!isValid || submitting) return
		setSubmitting(true)
		setError(null)
		try {
			const url = getFrontendApi('/auth/sign-in')
			const res = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ email, password }),
			})
			if (!res.ok) {
				const data = (await res.json().catch(() => ({}))) as { error?: string }
				throw new Error(data?.error || 'Sign in failed')
			}
			onClose()
			onSuccess?.()
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Sign in failed'
			setError(msg)
		} finally {
			setSubmitting(false)
		}
	}, [email, password, isValid, onClose, onSuccess, submitting])

	if (!open) return null

	return (
		<div role="dialog" aria-modal="true" aria-label="Sign in dialog" style={styles.overlay}>
			<div style={styles.card}>
				<div style={styles.header}>Sign in</div>
				{info ? <div style={styles.info}>{info}</div> : null}
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
					</label>
					{error ? <div style={styles.error}>{error}</div> : null}
					<div style={styles.actions}>
						<button type="button" onClick={onClose} style={styles.cancelBtn} disabled={submitting}>Cancel</button>
						<button type="submit" style={styles.submitBtn} disabled={!isValid || submitting}>
							{submitting ? 'Signing in...' : 'Sign in'}
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
	error: {
		color: '#ff7676',
		fontSize: 14,
	},
	info: {
		color: '#6ee7b7',
		fontSize: 14,
		marginBottom: 8,
	},
}


