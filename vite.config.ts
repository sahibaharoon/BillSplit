import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src') // 👈 This allows @/ to point to src/
    }
  },
  server: {
    allowedHosts: ['billsplit-4mdm.onrender.com']
  }
});