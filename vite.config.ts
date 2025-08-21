import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Provide defaults if .env is missing
  process.env.VITE_PRO_AVATAR_URL = process.env.VITE_PRO_AVATAR_URL || '/pro.glb';
  process.env.VITE_CON_AVATAR_URL = process.env.VITE_CON_AVATAR_URL || '/con.glb';
  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});
