import type { StorybookConfig } from '@storybook/nextjs-vite'

export default {
  stories: ['../src/**/*.stories.tsx'],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-vitest'
  ],
  framework: '@storybook/nextjs-vite',
  staticDirs: ['../public'],
  core: { disableTelemetry: true }
} satisfies StorybookConfig
