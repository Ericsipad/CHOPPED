import PageFrame from '../components/PageFrame'
import Container from '../components/Container'
import HeroImage from '../components/HeroImage'
import ProfileImageCard from '../components/ProfileImageCard'
import '../styles/internal.css'
import { useEffect } from 'react'
import { getBackendApi } from '../../lib/config'

export default function ProfilePage() {
	useEffect(() => {
		const url = getBackendApi('/api/user/me')
		fetch(url, { credentials: 'include' }).then(async (res) => {
			if (!res.ok) return
			const data = await res.json().catch(() => null)
			const id = (data && typeof data.userId === 'string') ? data.userId : null
			if (id) {
				try {
					localStorage.setItem('chopped.mongoUserId', JSON.stringify({ id, ts: Date.now() }))
				} catch {}
			}
		}).catch(() => {})
	}, [])
	return (
		<PageFrame>
			<div>
				<Container>
					<div style={{ position: 'relative' }}>
						<HeroImage />
						<div
							style={{
								position: 'absolute',
								top: '15%',
								left: 0,
								right: 0,
								bottom: 0,
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'flex-start',
								zIndex: 9,
							}}
						>
							<ProfileImageCard />
						</div>
					</div>
				</Container>
			</div>
		</PageFrame>
	)
}


