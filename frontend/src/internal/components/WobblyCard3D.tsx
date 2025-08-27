import { Box, type BoxProps } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import {
	useMotionValue as createMotionValue,
	useTransform as transformMotionValue,
} from 'framer-motion'
import { useRef, type ReactNode } from 'react'

const MotionBox = motion(Box)

export type WobblyLayer = {
	content: ReactNode
	depth?: number
}

export type WobblyCard3DProps = BoxProps & {
	children?: ReactNode
	bg?: BoxProps['bg']
	color?: string
	p?: BoxProps['p']
	borderRadius?: BoxProps['borderRadius']
	boxShadow?: BoxProps['boxShadow']
	scale?: number
	duration?: number
	maxRotate?: number
	perspective?: number
	layers?: WobblyLayer[]
}

/**
 * Chakra-based 3D wobble card with optional parallax layers.
 * Uses framer-motion MotionValues for smooth pointer-driven transforms.
 */
export function WobblyCard3D(props: WobblyCard3DProps) {
	const {
		children,
		bg = 'teal.500',
		color = 'white',
		p = 6,
		borderRadius = 'lg',
		boxShadow = 'xl',
		scale = 1.05,
		duration = 0.3,
		maxRotate = 15,
		perspective = 1000,
		layers = [],
		...rest
	} = props

	const ref = useRef<HTMLDivElement | null>(null)

	// Motion values in normalized [0,1] space across the card area
	const mouseX = createMotionValue(0.5)
	const mouseY = createMotionValue(0.5)

	// Map normalized to rotation degrees around X/Y axes
	const rotateX = transformMotionValue(mouseY, [0, 1], [maxRotate, -maxRotate])
	const rotateY = transformMotionValue(mouseX, [0, 1], [-maxRotate, maxRotate])

	const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
		if (!ref.current) return
		const rect = ref.current.getBoundingClientRect()
		const x = (e.clientX - rect.left) / rect.width
		const y = (e.clientY - rect.top) / rect.height
		mouseX.set(Math.min(1, Math.max(0, x)))
		mouseY.set(Math.min(1, Math.max(0, y)))
	}

	return (
		<MotionBox
			ref={ref}
			bg={bg}
			color={color}
			p={p}
			borderRadius={borderRadius}
			boxShadow={boxShadow}
			style={{ rotateX, rotateY }}
			onMouseMove={handleMouseMove}
			onMouseLeave={() => {
				mouseX.set(0.5)
				mouseY.set(0.5)
			}}
			whileHover={{ scale, transition: { duration } }}
			position="relative"
			overflow="hidden"
			sx={{ transformStyle: 'preserve-3d', perspective: `${perspective}px` }}
			{...rest}
		>
			<Box position="relative" zIndex={2}>
				{children}
			</Box>

			{layers.map((layer, index) => {
				const depth = typeof layer.depth === 'number' ? layer.depth : 20
				const translateX = transformMotionValue(mouseX, [0, 1], [-depth, depth])
				const translateY = transformMotionValue(mouseY, [0, 1], [-depth, depth])
				return (
					<MotionBox
						key={index}
						position="absolute"
						top={0}
						left={0}
						width="100%"
						height="100%"
						style={{ x: translateX, y: translateY }}
						zIndex={1}
						pointerEvents="none"
					>
						{layer.content}
					</MotionBox>
				)
			})}
		</MotionBox>
	)
}

export default WobblyCard3D


