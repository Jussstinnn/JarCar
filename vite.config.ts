import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// Proyecto frontend autónomo. No proxy ASP.NET, API ni backend.
export default defineConfig({
  plugins: [react()],
  appType: 'spa',
  server: {
    host: '127.0.0.1',
    port: 4631,
    strictPort: true,
    open: '/jarcar',
  },
  preview: {
    host: '127.0.0.1',
    port: 4632,
    strictPort: true,
    open: '/jarcar',
  },
});
