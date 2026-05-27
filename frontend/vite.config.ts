import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import remarkGfm from 'remark-gfm'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    { enforce: 'pre', ...mdx({ providerImportSource: '@mdx-js/react', remarkPlugins: [remarkGfm] }) },
    react({ include: /\.(jsx|tsx|mdx)$/ }),
  ],
  
  build: {
    // Optimize bundle size and loading
    rollupOptions: {
      output: {
        // Code splitting for better caching
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor';
            }
            if (id.includes('lucide-react') || id.includes('react-hot-toast') || id.includes('framer-motion')) {
              return 'ui';
            }
            if (id.includes('monaco-editor') || id.includes('reactflow') || id.includes('dagre')) {
              return 'editor';
            }
            if (id.includes('axios') || id.includes('zustand') || id.includes('zod')) {
              return 'utils';
            }
          }
        }
      }
    },
    
    // Optimize chunk sizes
    chunkSizeWarningLimit: 1000,
    
    // Optimize target for modern browsers
    target: 'es2020',
    
    // No source maps in production
    sourcemap: false
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      'axios', 
      'zustand',
      'lucide-react',
      'react-hot-toast'
    ]
  }
})
