import Container from './Container'
import UserIndicator from './UserIndicator'
import '../styles/internal.css'

export default function TopHeader() {
	return (
		<header className="internal-top-header">
			<Container>
				<div className="internal-top-header-inner">
					<div className="internal-user-indicator">
						<UserIndicator />
					</div>
				</div>
			</Container>
		</header>
	)
}
