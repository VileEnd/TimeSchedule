/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-purple': 'pulse-purple 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'pulse-purple': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(147, 51, 234, 0.4)' },
          '50%': { boxShadow: '0 0 0 3px rgba(147, 51, 234, 0.2)' },
        },
      },
    },
  },
  plugins: [],
}