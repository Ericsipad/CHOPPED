import { Box, Grid, GridItem } from '@chakra-ui/react'
import WobblyCard3D from './WobblyCard3D'

type ProfileImage = { url: string; alt?: string }
type ProfileGridProps = { images: ProfileImage[] }

export default function ProfileGrid(props: ProfileGridProps) {
	const { images } = props
	const items = images.slice(0, 10)

	const cardSize = { base: '160px', md: '190px', lg: '210px', xl: '240px' }

	return (
		<Box w="100%" display="flex" justifyContent="center">
			<Grid
				templateColumns={{
					base: 'repeat(5, 160px)',
					md: 'repeat(5, 190px)',
					lg: 'repeat(5, 210px)',
					xl: 'repeat(5, 240px)',
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
							bgLight="gray.800"
							bgDark="gray.900"
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


