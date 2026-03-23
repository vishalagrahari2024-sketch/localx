import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
   server: {
    
    proxy: {
      '/api': {
        // Aapke backend ka port
        target: 'http://localhost:3000', 
        
        
        secure: false, 
        
        
      },
    },
  },
})
