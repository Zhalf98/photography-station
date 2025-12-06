/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        // Apple 风格颜色
        'apple-bg': 'var(--bg-primary)',
        'apple-bg-secondary': 'var(--bg-secondary)',
        'apple-text': 'var(--text-primary)',
        'apple-text-secondary': 'var(--text-secondary)',
        'apple-border': 'var(--border-color)',
      }
    },
  },
  plugins: [],
}

