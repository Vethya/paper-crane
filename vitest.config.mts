import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [storybookTest({ configDir: '.storybook' })],
        optimizeDeps: {
          include: [
            'next/link',
            'next/navigation',
            'react-hook-form',
            'react-icons/fi',
            'zod',
            'react-icons/md',
            'react-markdown',
            'remark-gfm',
            'common-tags'
          ]
        },
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }]
          }
        }
      }
    ]
  }
})
