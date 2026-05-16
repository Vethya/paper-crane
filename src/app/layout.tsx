import type { Metadata } from 'next'
import './globals.css'
import { Geist } from 'next/font/google'
import { cn } from '@/lib/utils'
import { ThemeProvider } from '@/components/theme/ThemeProvider'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

const themeInitScript = `
try {
  const theme = window.localStorage.getItem('resume-manager-theme')
  const isDark = theme === 'dark'
  document.documentElement.classList.toggle('dark', isDark)
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
} catch {
  document.documentElement.style.colorScheme = 'light'
}
`

export const metadata: Metadata = {
  title: 'Resume Manager',
  description: 'Create beautiful resumes with ease'
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={cn('font-sans', geist.variable)}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
