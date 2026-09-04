import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/app/**/*.{ts,tsx}', './src/components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#fafafa',
        muted: '#a7a6a6',
        nav: '#b6b5b5',
        strip: '#8b8a8a',
        void: '#050505',
        pill: '#ffffff',
        'pill-ink': '#050505',
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
