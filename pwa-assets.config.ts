import { defineConfig, minimal2023Preset as preset } from '@vite-pwa/assets-generator/config'

// Run: npx pwa-assets-generator  (regenerates public/ icons from public/logo.svg)
const navy = { background: '#1F2A44' }
export default defineConfig({
  preset: {
    ...preset,
    maskable: { ...preset.maskable, resizeOptions: navy },
    apple: { ...preset.apple, resizeOptions: navy },
  },
  images: ['public/logo.svg'],
})
