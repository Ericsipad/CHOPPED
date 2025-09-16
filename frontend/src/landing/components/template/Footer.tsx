import React from 'react'

const Footer: React.FC = () => {
	return (
		<footer className="bg-background border-t border-border/50 py-10 mt-20">
			<div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
				<div>© {new Date().getFullYear()} Chopped Dating. All rights reserved.</div>
				<div className="mt-2">Built for real connections.</div>
			</div>
		</footer>
	)
}

export default Footer


