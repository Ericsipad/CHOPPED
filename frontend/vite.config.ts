import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      usePolling: true,
      interval: 300,
    },
  },
  preview: {
    allowedHosts: [
      'chopped-frontend-3kvyp.ondigitalocean.app',
    ],
  },
  build: {
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, 'index.html'),
        mobile: path.resolve(__dirname, 'mobile.html'),
        account: path.resolve(__dirname, 'account.html'),
        'chopping-board': path.resolve(__dirname, 'chopping-board.html'),
        profile: path.resolve(__dirname, 'profile.html'),
      },
    },
  },
  define: {
    'import.meta.env.NEXT_PUBLIC_API_BASE_URL': JSON.stringify(process.env.NEXT_PUBLIC_API_BASE_URL || ''),
    'import.meta.env.VITE_BACKEND_URL': JSON.stringify(process.env.VITE_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL || ''),
    'import.meta.env.VITE_FRONTEND_URL': JSON.stringify(process.env.VITE_FRONTEND_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || ''),
  },
})
