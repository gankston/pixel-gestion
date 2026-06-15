/** @type {import('tailwindcss').Config} */
// Paleta y tipografia tomadas de DESIGN.md (sistema visual de PIXEL GESTION).
export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        app: '#F4F5F7', // fondo de la app
        panel: '#FFFFFF', // paneles / cards
        ink: '#1B2733', // texto principal
        muted: '#5B6878', // texto secundario
        line: '#E2E5E9', // bordes
        primary: '#1F5FCC', // azul de accion (unico)
        sidebar: '#16202E', // barra lateral
        ok: '#1E7E45', // exito
        warn: '#B25E00', // advertencia
        danger: '#C0392B' // error
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'ui-monospace', 'monospace']
      }
    }
  },
  plugins: []
}
