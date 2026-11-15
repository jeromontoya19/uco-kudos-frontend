// Genera los íconos de la PWA a partir de public/logo.svg: `npm run iconos`.
// Los PNG resultantes se versionan, así que la compilación no depende de este paso.
import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'
import { COLOR_TEMA } from './config/marca.ts'

// El ícono «maskable» y el de iPhone no admiten transparencia: el margen se llena con el color de la marca.
const FONDO_DE_LA_MARCA = { background: COLOR_TEMA }

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: FONDO_DE_LA_MARCA },
    apple: { ...minimal2023Preset.apple, resizeOptions: FONDO_DE_LA_MARCA },
  },
  images: ['public/logo.svg'],
})
