/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        app: '#F1F5F9',
        panel: '#FFFFFF',
        ink: '#0F172A',
        muted: '#64748B',
        line: '#E2E8F0',
        primary: '#2563EB',
        sidebar: '#0F172A',
        ok: '#059669',
        warn: '#D97706',
        danger: '#DC2626'
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'ui-monospace', 'monospace']
      },
      borderRadius: {
        DEFAULT: '4px',
        sm: '2px',
        md: '4px',
        lg: '6px',
        xl: '8px',
        full: '9999px'
      }
    }
  },
  plugins: []
}
