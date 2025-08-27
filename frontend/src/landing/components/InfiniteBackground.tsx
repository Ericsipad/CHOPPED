import { useCallback, useEffect, useRef, useState } from 'react'

type InfiniteBackgroundProps = {
	imageUrl?: string
}

export default function InfiniteBackground(props: InfiniteBackgroundProps) {
	const { imageUrl = 'https://publicwebassets.b-cdn.net/Gemini_Generated_Image_yhhfavyhhfavyhhf.png' } = props
	const [panels, setPanels] = useState<number[]>([0, 1, 2])
	const observerRef = useRef<IntersectionObserver | null>(null)
	const sentinelRef = useRef<HTMLDivElement | null>(null)
	const lockRef = useRef<boolean>(false)

	const addPanels = useCallback(() => {
		if (lockRef.current) return
		lockRef.current = true
		setPanels((prev) => {
			const nextIndex = prev.length
			const toAdd = [nextIndex, nextIndex + 1]
			return [...prev, ...toAdd]
		})
		setTimeout(() => {
			lockRef.current = false
		}, 200)
	}, [])

	useEffect(() => {
		if (!sentinelRef.current) return
		observerRef.current?.disconnect()
		observerRef.current = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						addPanels()
						break
					}
				}
			},
			{ rootMargin: '1000px 0px' },
		)
		observerRef.current.observe(sentinelRef.current)
		return () => observerRef.current?.disconnect()
	}, [addPanels])

	return (
		<section className="landing-infinite" aria-label="Landing infinite background">
			{panels.map((idx) => (
				<div key={idx} className="landing-panel" style={{ backgroundImage: `url('${imageUrl}')` }} />
			))}
			<div ref={sentinelRef} />
		</section>
	)
}


