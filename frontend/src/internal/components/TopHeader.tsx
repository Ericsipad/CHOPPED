import Container from './Container'
import UserIndicator from './UserIndicator'
import '../styles/internal.css'

export default function TopHeader() {
\treturn (
\t\t<header className="internal-top-header">
\t\t\t<Container>
\t\t\t\t<div className="internal-top-header-inner">
\t\t\t\t\t<div className="internal-user-indicator">
\t\t\t\t\t\t<UserIndicator />
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t</Container>
\t\t</header>
\t)
}
