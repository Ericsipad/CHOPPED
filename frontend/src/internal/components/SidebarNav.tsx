import { useEffect, useState, type ReactNode } from 'react'
import '../styles/sidebar.css'

type NavItem = {
	label: string
	path: string
	icon: ReactNode
}

function usePathname(): string {
	try {
		return typeof window !== 'undefined' ? window.location.pathname : ''
	} catch {
		return ''
	}
}

export default function SidebarNav() {
	const [collapsed, setCollapsed] = useState<boolean>(() => {
		try {
			const raw = localStorage.getItem('sidebar_collapsed')
			return raw === '1'
		} catch {
			return false
		}
	})
	const pathname = usePathname()

	useEffect(() => {
		try { localStorage.setItem('sidebar_collapsed', collapsed ? '1' : '0') } catch { /* noop */ }
		// Update body class to communicate sidebar state to CSS
		try {
			if (typeof document !== 'undefined') {
				document.body.classList.toggle('sidebar-collapsed', collapsed)
			}
		} catch { /* noop */ }
	}, [collapsed])

	const items: NavItem[] = [
		{
			label: 'Profile',
			path: '/profile.html',
			icon: (
				// user icon
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
					<path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5Z" fill="currentColor"/>
					<path d="M4 22c0-4.418 3.582-8 8-8s8 3.582 8 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
				</svg>
			)
		},
		{
			label: 'Account',
			path: '/account.html',
			icon: (
				// cog icon
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
					<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" fill="currentColor"/>
					<path d="M19.4 12a7.4 7.4 0 0 0-.07-.98l2.01-1.57-2-3.46-2.41.97a7.53 7.53 0 0 0-1.7-.98l-.37-2.55h-4l-.37 2.55c-.6.23-1.17.55-1.7.98l-2.41-.97-2 3.46 2.01 1.57c-.04.32-.07.65-.07.98s.03.66.07.98l-2.01 1.57 2 3.46 2.41-.97c.53.43 1.1.75 1.7.98l.37 2.55h4l.37-2.55c.6-.23 1.17-.55 1.7-.98l2.41.97 2-3.46-2.01-1.57c.04-.32.07-.65.07-.98Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
				</svg>
			)
		},
		{
			label: 'Chopping board',
			path: '/chopping-board.html',
			icon: (
				// grid icon
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
					<rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="2"/>
					<rect x="13" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="2"/>
					<rect x="3" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="2"/>
					<rect x="13" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="2"/>
				</svg>
			)
		}
	]

	return (
		<aside className={[
			'internal-sidebar',
			collapsed ? 'internal-sidebar--collapsed' : ''
		].filter(Boolean).join(' ')} aria-label="Primary navigation">
			<div className="internal-sidebar__inner">
				<button
					className="internal-sidebar__toggle"
					type="button"
					aria-pressed={collapsed}
					aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
					onClick={() => setCollapsed(v => !v)}
				>
					{/* chevron */}
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className={collapsed ? 'is-collapsed' : ''} style={{ transition: 'transform 160ms ease', transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}>
						<path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
					</svg>
				</button>
				<nav className="internal-sidebar__nav">
					{items.map(item => {
						const isActive = pathname.endsWith(item.path) || pathname === item.path
						return (
							<a
								key={item.path}
								href={item.path}
								className={[
									'internal-sidebar__link',
									isActive ? 'is-active' : ''
								].filter(Boolean).join(' ')}
								aria-current={isActive ? 'page' : undefined}
								aria-label={collapsed ? item.label : undefined}
							>
								<span className="internal-sidebar__icon">
									{item.icon}
								</span>
								{!collapsed && <span className="internal-sidebar__label">{item.label}</span>}
							</a>
						)
					})}
				</nav>
			</div>
		</aside>
	)
}


