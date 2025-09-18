import { Box, Grid, GridItem } from '@chakra-ui/react'
import WobblyCard3D from './WobblyCard3D'

type ProfileImage = { url: string; alt?: string; status?: 'yes' | 'pending' | 'chopped' | null; hasProfile?: boolean }
type ProfileGridProps = {
    images: ProfileImage[]
    viewCount: 10 | 20 | 50
    activeSlotsCount?: number
    onCardClick?: (index: number) => void
    cardPxOverride?: number
    columnsOverride?: number
    gapOverride?: string
}

export default function ProfileGrid(props: ProfileGridProps) {
    const { images, viewCount, activeSlotsCount = 0, onCardClick, cardPxOverride, columnsOverride, gapOverride } = props

	const sliceCount = viewCount
	const items = images.slice(0, sliceCount)

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
			case 20:
			cardPx = 120
			columns = 5
			gap = '8px'
			wobble = true
			break
		case 50:
			cardPx = 90
			columns = 5
			gap = '8px'
			wobble = false
			break
	}

    // PWA-only normalization: disable wobble so 10/20 match 50 presentation
    if (typeof window !== 'undefined') {
        try {
            const isStandalone = (
                (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
                ((window as any).navigator?.standalone === true)
            )
            if (isStandalone) {
                wobble = false
            }
        } catch { /* noop */ }
    }

    const effectiveCardPx = typeof cardPxOverride === 'number' ? cardPxOverride : cardPx
    const effectiveColumns = typeof columnsOverride === 'number' ? columnsOverride : columns
    const effectiveGap = typeof gapOverride === 'string' ? gapOverride : gap

    const cardSize = `${effectiveCardPx}px`
    const columnsTemplate = `repeat(${effectiveColumns}, ${cardSize})`

    // Restore desktop hover scale; disable on mobile or PWA standalone
    let hoverScale = 1.05
    if (typeof window !== 'undefined') {
        try {
            const isMobile = window.matchMedia('(max-width: 1024px)').matches
            const isStandalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || ((window as any).navigator?.standalone === true)
            if (isMobile || isStandalone) hoverScale = 1
        } catch { /* noop */ }
    }

	return (
		<Box w="100%" display="flex" justifyContent="center" position="relative" zIndex={5}>
			<Grid
				templateColumns={{
					base: columnsTemplate,
					md: columnsTemplate,
					lg: columnsTemplate,
					xl: columnsTemplate,
				}}
                gap={effectiveGap}
				justifyContent="center"
				alignContent="center"
				width="fit-content"
			>
				{items.map((img, idx) => {
					const isActive = idx < activeSlotsCount
					const glow = img.status === 'yes' ? '0 0 16px rgba(34,197,94,0.8)'
						: img.status === 'pending' ? '0 0 16px rgba(234,179,8,0.8)'
						: img.status === 'chopped' ? '0 0 16px rgba(239,68,68,0.8)'
						: 'none'
					const clickableCursor = isActive ? 'pointer' : (activeSlotsCount > 0 ? 'not-allowed' : 'default')
					const onKeyDown = (e: any) => {
						if (!isActive) return
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault()
							onCardClick?.(idx)
						}
					}
					return (
                        <GridItem key={idx} w={cardSize} h={cardSize} minW={cardSize} minH={cardSize}>
							<Box position="relative" w="100%" h="100%" role={isActive ? 'button' : undefined} tabIndex={isActive ? 0 : -1} aria-disabled={!isActive} onClick={isActive ? () => onCardClick?.(idx) : undefined} onKeyDown={onKeyDown} style={{ cursor: clickableCursor }}>
                                {wobble ? (
                                    <WobblyCard3D
										p={0}
										borderRadius="xl"
										boxShadow={glow !== 'none' ? (`${glow}, var(--chakra-shadows-xl)` as any) : 'xl'}
										bg="gray.800"
                                        scale={hoverScale}
										maxRotate={12}
										perspective={900}
									>
                                    <img
                                        src={img.url}
                                        alt={img.alt ?? 'profile picture'}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
                                    />
									</WobblyCard3D>
								) : (
                                    <Box p={0} borderRadius="xl" boxShadow={glow !== 'none' ? (`${glow}, var(--chakra-shadows-xl)` as any) : 'xl'} bg="gray.800" w="100%" h="100%">
                                        <img
                                            src={img.url}
                                            alt={img.alt ?? 'profile picture'}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
                                        />
                                    </Box>
								)}
								{isActive && !img.hasProfile && (
									<Box position="absolute" top="6px" right="6px" w="20px" h="20px" bg="green.500" color="white" borderRadius="full" display="flex" alignItems="center" justifyContent="center" fontWeight="bold" fontSize="14px" lineHeight="1">+
									</Box>
								)}
							</Box>
						</GridItem>
					)
				})}
			</Grid>
		</Box>
	)
}


