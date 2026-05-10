import type { Config } from 'tailwindcss'

export default {
  content: [
    "./src/**/*.{html,js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        theme: {
          text: 'var(--theme-text)',
          muted: 'var(--theme-muted)',
          glass: 'var(--theme-glass)',
          border: 'var(--theme-border)',
          hover: 'var(--theme-hover)',
          'bg-accent': 'var(--theme-bg-accent)',
          contrast: 'var(--theme-contrast)',
          bg: 'var(--theme-bg)',
        }
      }
    },
  },
  plugins: [],
} satisfies Config
