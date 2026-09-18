import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  base:
    mode === 'streamlit'
      ? 'https://rizhao-bank-strategy-demo.streamlit.app/~/+/app/static/'
      : '/',
  build: mode === 'streamlit' ? { outDir: 'static', emptyOutDir: true } : undefined,
  plugins: [react()],
}));
