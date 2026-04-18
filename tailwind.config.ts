import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      borderRadius: {
        '2xl': '1.25rem'
      },
      boxShadow: {
        soft: '0 10px 30px -18px rgba(15, 23, 42, 0.35)',
        lift: '0 24px 80px -40px rgba(2, 6, 23, 0.45)'
      },
      colors: {
        brand: {
          50: '#ecf8f7',
          100: '#d7f0ef',
          200: '#b4e0dd',
          300: '#86cfc9',
          400: '#53b6b0',
          500: '#1f8f8a',
          600: '#18706c',
          700: '#155956',
          800: '#124847',
          900: '#0d3130'
        },
        ink: '#0f172a',
        gold: {
          50: '#fff9eb',
          100: '#fff1c8',
          200: '#ffe38b',
          300: '#ffd24f',
          400: '#f8b81b',
          500: '#d6940a',
          600: '#ad7207'
        }
      }
    }
  },
  plugins: []
}

export default config
