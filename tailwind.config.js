/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: '#06080f', secondary: '#0d1117', tertiary: '#161b22' },
        glass: { DEFAULT: 'rgba(255,255,255,0.04)', hover: 'rgba(255,255,255,0.07)', border: 'rgba(255,255,255,0.06)' },
        primary: { DEFAULT: '#6366f1', light: '#818cf8', dark: '#4f46e5' },
        accent: { DEFAULT: '#22d3ee', light: '#67e8f9', dark: '#06b6d4' },
        success: { DEFAULT: '#10b981', light: '#34d399' },
        warning: { DEFAULT: '#f59e0b', light: '#fbbf24' },
        danger: { DEFAULT: '#ef4444', light: '#f87171' },
        'text-1': '#f0f4ff',
        'text-2': '#94a3b8',
        'text-3': '#64748b',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        xl: '14px',
        '2xl': '18px',
      },
      boxShadow: {
        glow: '0 0 30px rgba(99,102,241,0.15)',
        'glow-accent': '0 0 30px rgba(34,211,238,0.15)',
        'glow-sm': '0 0 15px rgba(99,102,241,0.1)',
      },
      animation: {
        'mesh-drift': 'meshDrift 25s ease-in-out infinite',
        'gradient-shift': 'gradientShift 6s ease infinite',
      },
    },
  },
  plugins: [],
};
