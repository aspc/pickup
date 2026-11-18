const defaultTheme = require('tailwindcss/defaultTheme')

// RideLink design tokens. Every color used in the app is named here; pages must
// not reach for Tailwind's raw palettes (enforced by src/styles/noRawColors.test.ts).
const palette = {
  navy: {
    50: '#EEF1F6',
    100: '#DCE3EE',
    200: '#C9D3E3',
    300: '#9AABC6',
    400: '#6A80A3',
    500: '#43597E',
    600: '#2A4068',
    700: '#1C3358',
    DEFAULT: '#13294B',
    900: '#0C1C36',
  },
  sage: {
    DEFAULT: '#3E7C6B',
    strong: '#2F6355',
    soft: '#7FB8A4',
    tint: '#E3EDE8',
  },
  ink: '#18233A',
  stone: {
    DEFAULT: '#5F6878',
    light: '#8E95A2',
  },
  paper: '#F7F5F0',
  sunken: '#F0EDE6',
  card: '#FFFFFF',
  line: {
    DEFAULT: '#E7E3DA',
    strong: '#D3CEC2',
  },
  danger: {
    DEFAULT: '#B42318',
    strong: '#912018',
    tint: '#FDECEA',
  },
  warning: {
    DEFAULT: '#8A5A0B',
    tint: '#FBF0D9',
  },
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        ...palette,
        white: '#FFFFFF',
        // Aliases kept for the Radix-based primitives in components/ui.
        background: palette.paper,
        foreground: palette.ink,
        border: palette.line.DEFAULT,
        input: palette.line.strong,
        ring: palette.sage.DEFAULT,
        primary: { DEFAULT: palette.navy.DEFAULT, foreground: '#FFFFFF' },
        muted: { DEFAULT: palette.sunken, foreground: palette.stone.DEFAULT },
        accent: { DEFAULT: palette.sunken, foreground: palette.ink },
        destructive: { DEFAULT: palette.danger.DEFAULT, foreground: '#FFFFFF' },
        popover: { DEFAULT: '#FFFFFF', foreground: palette.ink },
      },
      fontFamily: {
        sans: ['var(--font-inter)', ...defaultTheme.fontFamily.sans],
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
      },
      borderRadius: {
        lg: '12px',
        md: '9px',
        sm: '6px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(19, 41, 75, 0.04)',
        overlay:
          '0 12px 32px -8px rgba(19, 41, 75, 0.18), 0 2px 6px rgba(19, 41, 75, 0.06)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.23, 1, 0.32, 1)',
        drawer: 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
      keyframes: {
        'overlay-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'dialog-in': {
          from: { opacity: '0', transform: 'translateY(8px) scale(0.96)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'overlay-in': 'overlay-in 200ms cubic-bezier(0.23, 1, 0.32, 1)',
        'dialog-in': 'dialog-in 220ms cubic-bezier(0.23, 1, 0.32, 1)',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
