/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        // shadcn CSS-variable tokens
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        app: {
          background: 'rgb(var(--app-background) / <alpha-value>)',
          surface: 'rgb(var(--app-surface) / <alpha-value>)',
          surfaceElevated: 'rgb(var(--app-surface-elevated) / <alpha-value>)',
          hover: 'rgb(var(--app-hover))',
          control: 'rgb(var(--app-control))',
          controlHover: 'rgb(var(--app-control-hover))',
          border: 'rgb(var(--app-border))',
          controlBorder: 'rgb(var(--app-control-border))',
          borderStrong: 'rgb(var(--app-border-strong))',
          textMuted: 'rgb(var(--app-text-muted) / <alpha-value>)',
          primaryHover: 'rgb(var(--app-primary-hover) / <alpha-value>)'
        },
        white: 'rgb(var(--app-foreground) / <alpha-value>)',
        slate: {
          50: 'rgb(var(--slate-50) / <alpha-value>)',
          100: 'rgb(var(--slate-100) / <alpha-value>)',
          200: 'rgb(var(--slate-200) / <alpha-value>)',
          300: 'rgb(var(--slate-300) / <alpha-value>)',
          400: 'rgb(var(--slate-400) / <alpha-value>)',
          500: 'rgb(var(--slate-500) / <alpha-value>)',
          600: 'rgb(var(--slate-600) / <alpha-value>)',
          700: 'rgb(var(--slate-700) / <alpha-value>)',
          800: 'rgb(var(--slate-800) / <alpha-value>)',
          900: 'rgb(var(--slate-900) / <alpha-value>)',
          950: 'rgb(var(--slate-950) / <alpha-value>)'
        },
        // Legacy app tokens (kept for existing usage)
        borders: 'rgb(var(--app-border))',
        placeholders: 'rgb(var(--app-border))',
        placeholder: 'rgb(var(--app-text-muted) / <alpha-value>)',
        header: 'rgb(var(--app-surface) / <alpha-value>)',
        sidebar: 'rgb(var(--app-surface) / <alpha-value>)',
        footer: 'rgb(var(--app-surface) / <alpha-value>)',
        lightGray: 'rgb(var(--app-surface) / <alpha-value>)',
        gray: 'rgb(var(--app-surface-elevated) / <alpha-value>)',
        green: 'rgb(var(--app-foreground) / <alpha-value>)'
      },
      borderRadius: {
        'app-button': '0.5rem',
        'app-card': '0.75rem',
        'app-panel': '0.875rem',
        'app-small': '0.25rem',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      fontFamily: {
        sans: [
          'var(--font-sans)',
          '-apple-system',
          'system-ui',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif'
        ]
      },
      fontSize: {
        base: '0.95rem'
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
}
