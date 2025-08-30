import { Box, Grid, GridItem } from '@chakra-ui/react'
import WobblyCard3D from './WobblyCard3D'

type ProfileImage = { url: string; alt?: string; status?: 'yes' | 'pending' | 'chopped' | null }
type ProfileGridProps = { images: ProfileImage[]; viewCount: 10 | 25 | 50 }

export default function ProfileGrid(props: ProfileGridProps) {
	const { images, viewCount } = props

	const items = images.slice(0, viewCount)

	let cardPx = 192
	let columns = 5
	let gap = '15px'
	let wobble = true
	switch (viewCount) {
		case 10:
			cardPx = 192
			columns = 5
			gap = '15px'
			wobble = true
			break
		case 25:
			cardPx = 120
			columns = 5
			gap = '8px'
			wobble = true
			break
		case 50:
			cardPx = 90
			columns = 10
			gap = '8px'
			wobble = false
			break
	}

	const cardSize = `${cardPx}px`
	const columnsTemplate = `repeat(${columns}, ${cardSize})`

	return (
		<Box w="100%" display="flex" justifyContent="center" position="relative" zIndex={5}>
			<Grid
				templateColumns={{
					base: columnsTemplate,
					md: columnsTemplate,
					lg: columnsTemplate,
					xl: columnsTemplate,
				}}
				gap={gap}
				justifyContent="center"
				alignContent="center"
				width="fit-content"
			>
				{items.map((img, idx) => {
					const glow = img.status === 'yes' ? '0 0 16px rgba(34,197,94,0.8)'
						: img.status === 'pending' ? '0 0 16px rgba(234,179,8,0.8)'
						: img.status === 'chopped' ? '0 0 16px rgba(239,68,68,0.8)'
						: 'none'
					return (
						<GridItem key={idx} w={cardSize} h={cardSize}>
							{wobble ? (
								<WobblyCard3D
									p={0}
									borderRadius="xl"
									boxShadow={glow !== 'none' ? (`${glow}, var(--chakra-shadows-xl)` as any) : 'xl'}
									bg="gray.800"
									maxRotate={12}
									perspective={900}
								>
									<img
										src={img.url}
										alt={img.alt ?? 'profile picture'}
										style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
									/>
								</WobblyCard3D>
							) : (
								<Box p={0} borderRadius="xl" boxShadow={glow !== 'none' ? (`${glow}, var(--chakra-shadows-xl)` as any) : 'xl'} bg="gray.800" w="100%" h="100%">
									<img
										src={img.url}
										alt={img.alt ?? 'profile picture'}
										style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
									/>
								</Box>
							)}
						</GridItem>
					)
				})}
			</Grid>
		</Box>
	)
}


