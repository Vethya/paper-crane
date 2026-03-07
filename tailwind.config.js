/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        accent: '#2563EB',
        foreground: '#ffffff',
        background: '#14171d',
        borders: '#202530',
        placeholders: '#202530',
        card: '#121217',
        input: '#202530',
        placeholder: '#c0c5ce',
        header: '#121217',
        sidebar: '#121217',
        footer: '#121217',
        black: '#0F0F0F',
        lightGray: '#121217',
        gray: '#161619',
        white: '#ffffff',
        green: '#2563EB',
      },
      fontFamily: {
        sans: ['-apple-system', 'system-ui', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      fontSize: {
        base: '0.95rem',
      },
    },
  },
  plugins: [],
}
