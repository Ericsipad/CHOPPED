import type { ReactNode } from 'react'
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: '100dvh' }}>{children}</body>
    </html>
  )
}



