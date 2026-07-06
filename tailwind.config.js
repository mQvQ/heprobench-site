/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: {
        ink: 'oklch(0.94 0.018 250 / <alpha-value>)',
        paper: 'oklch(0.12 0.018 255 / <alpha-value>)',
        surface: 'oklch(0.18 0.022 255 / <alpha-value>)',
        surface2: 'oklch(0.23 0.026 255 / <alpha-value>)',
        moss: 'oklch(0.72 0.15 155 / <alpha-value>)',
        teal: 'oklch(0.72 0.12 195 / <alpha-value>)',
        coral: 'oklch(0.7 0.15 28 / <alpha-value>)',
        amber: 'oklch(0.78 0.15 78 / <alpha-value>)',
        cobalt: 'oklch(0.7 0.18 260 / <alpha-value>)',
      },
      boxShadow: {
        panel: '0 2px 8px rgba(0, 0, 0, 0.24)',
      },
    },
  },
  plugins: [],
}
