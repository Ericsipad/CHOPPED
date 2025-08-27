import { Box, Grid, GridItem } from '@chakra-ui/react'
import WobblyCard3D from './WobblyCard3D'

type ProfileImage = { url: string; alt?: string }
type ProfileGridProps = { images: ProfileImage[] }

export default function ProfileGrid(props: ProfileGridProps) {
	const { images } = props
	const items = images.slice(0, 10)

	// 20% smaller than previous card sizes
	const cardSize = { base: '128px', md: '152px', lg: '168px', xl: '192px' }

	return (
		<Box w="100%" display="flex" justifyContent="center" position="relative" zIndex={5}>
			<Grid
				templateColumns={{
					base: 'repeat(5, 128px)',
					md: 'repeat(5, 152px)',
					lg: 'repeat(5, 168px)',
					xl: 'repeat(5, 192px)',
				}}
				gap="15px"
				justifyContent="center"
				alignContent="center"
				width="fit-content"
			>
				{items.map((img, idx) => (
					<GridItem key={idx} w={cardSize} h={cardSize}>
						<WobblyCard3D
							p={0}
							borderRadius="xl"
							boxShadow="xl"
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
					</GridItem>
				))}
			</Grid>
		</Box>
	)
}


