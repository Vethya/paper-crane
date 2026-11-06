import type { Metadata } from 'next'
import './globals.css'
import { Geist } from 'next/font/google'
import { cn } from '@/lib/utils'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { Toaster } from '@/components/ui/sonner'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

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
      className={cn('dark font-sans', geist.variable)}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider>
          <QueryProvider>{children}</QueryProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
