// Se carga antes de cada archivo de pruebas (vite.config.ts → test.setupFiles).
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'
import { simularModoAplicacion } from './simularModoAplicacion'

// jsdom no trae matchMedia: por defecto, la app no está abierta como aplicación instalada.
beforeEach(() => {
  simularModoAplicacion(false)
})

afterEach(() => {
  cleanup()
})
