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
          background: '#050505',
          surface: '#0B0B0D',
          surfaceElevated: '#111114',
          hover: 'rgba(255,255,255,0.06)',
          border: 'rgba(255,255,255,0.10)',
          borderStrong: 'rgba(255,255,255,0.16)',
          textMuted: '#A1A1AA'
        },
        // Legacy app tokens (kept for existing usage)
        borders: 'rgba(255,255,255,0.10)',
        placeholders: 'rgba(255,255,255,0.10)',
        placeholder: '#A1A1AA',
        header: '#0B0B0D',
        sidebar: '#0B0B0D',
        footer: '#0B0B0D',
        black: '#050505',
        lightGray: '#0B0B0D',
        gray: '#111114',
        white: '#ffffff',
        green: '#F4F4F5'
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      fontFamily: {
        sans: [
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
