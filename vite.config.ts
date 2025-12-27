import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        // Enable SPA fallback for volunteer routes
        strictPort: false,
        // Handle all routes in SPA mode
        middlewareMode: false,
      },
      // Ensure all routes serve index.html for SPA
      preview: {
        port: 3000,
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
        'process.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
        'process.env.SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
        'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
        'process.env.SUPABASE_SERVICE_ROLE_KEY': JSON.stringify(env.SUPABASE_SERVICE_ROLE_KEY),
        'process.env.RESEND_API_KEY': JSON.stringify(env.RESEND_API_KEY),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          '@/lib': path.resolve(__dirname, 'lib'),
          '@/utils': path.resolve(__dirname, 'lib'),
          '@/components': path.resolve(__dirname, 'components'),
        }
      }
    };
});
