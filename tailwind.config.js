/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#155EEF',
          600: '#0E4FD8',
          700: '#102A56',
        },
        cyanx: '#06AED4',
        success: '#12B76A',
        notice: '#F79009',
        ink: '#101828',
        muted: '#667085',
        canvas: '#F3F6FB',
      },
      boxShadow: {
        soft: '0 16px 42px rgba(16, 42, 86, 0.10)',
        glow: '0 22px 80px rgba(21, 94, 239, 0.20)',
      },
      borderRadius: {
        ui: '16px',
      },
    },
  },
  plugins: [],
};
