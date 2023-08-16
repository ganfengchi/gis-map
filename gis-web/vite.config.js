import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],

  server:{
    proxy:{
      '/api':{
        target:"https://bang.360.cn",
        changeOrigin:true,
        rewrite:(path)=>path.replace(/^\/api/,''),
      }
    }
  }
})
