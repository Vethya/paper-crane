import type { Preview } from '@storybook/nextjs-vite'
import { Provider } from 'jotai'
import { Geist } from 'next/font/google'
import { sb } from 'storybook/test'
import { sandbox } from '../src/stories/sandbox'
import { useLayoutEffect, type ReactNode } from 'react'
import {
  applyTheme,
  type ThemeMode
} from '../src/components/theme/ThemeProvider'
import '../src/app/globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

sb.mock('../src/db/auth-client.ts')
sb.mock('../src/lib/latex.ts')
sb.mock('react-pdf')

function Theme({ theme, children }: { theme: ThemeMode; children: ReactNode }) {
  useLayoutEffect(() => {
    applyTheme(theme)
    document.documentElement.classList.add(geist.variable)
    document.documentElement.style.backgroundColor = 'hsl(var(--background))'
  }, [theme])
  return children
}

export default {
  beforeEach: sandbox,
  globalTypes: {
    theme: {
      toolbar: {
        icon: 'circlehollow',
        items: ['dark', 'light'],
        dynamicTitle: true
      }
    }
  },
  initialGlobals: { theme: 'dark' },
  parameters: {
    nextjs: { appDirectory: true },
    backgrounds: { disable: true },
    a11y: { test: 'error' }
  },
  decorators: [
    (Story, { id, globals }) => (
      <Provider key={id}>
        <Theme theme={globals.theme === 'light' ? 'light' : 'dark'}>
          <Story />
        </Theme>
      </Provider>
    )
  ]
} satisfies Preview
