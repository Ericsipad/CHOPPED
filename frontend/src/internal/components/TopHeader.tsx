import Container from './Container'
import UserIndicator from './UserIndicator'
import '../styles/internal.css'

export default function TopHeader() {
	const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
	const isAccount = pathname.endsWith('/account.html') || pathname === '/account.html'
	const isChoppingBoard = pathname.endsWith('/chopping-board.html') || pathname === '/chopping-board.html'
	const isProfile = pathname.endsWith('/profile.html') || pathname === '/profile.html'

	return (
		<header className="internal-top-header">
			<Container>
				<div className="internal-top-header-inner">
					<nav className="internal-nav" aria-label="Primary">
						<a
							href="/account.html"
							className={`internal-nav-link${isAccount ? ' is-active' : ''}`}
							aria-current={isAccount ? 'page' : undefined}
						>
							Account
						</a>
						<a
							href="/chopping-board.html"
							className={`internal-nav-link${isChoppingBoard ? ' is-active' : ''}`}
							aria-current={isChoppingBoard ? 'page' : undefined}
							
						>
							Chopping Board
						</a>
						<a
							href="/profile.html"
							className={`internal-nav-link${isProfile ? ' is-active' : ''}`}
							aria-current={isProfile ? 'page' : undefined}
						>
							Profile
						</a>
					</nav>
					<UserIndicator />
				</div>
			</Container>
		</header>
	)
}
