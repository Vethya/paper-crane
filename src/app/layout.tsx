import type { Metadata } from 'next'
import { GlobalStyle } from '../components/core/GlobalStyle'

export const metadata: Metadata = {
  title: 'Resumake',
  description: 'Create beautiful resumes with ease',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <GlobalStyle />
        {children}
      </body>
    </html>
  )
}
