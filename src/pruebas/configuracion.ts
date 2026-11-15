// Se carga antes de cada archivo de pruebas (vite.config.ts → test.setupFiles).
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'
import { simularModoAplicacion } from './simularModoAplicacion'

// jsdom tiene <dialog> y su atributo «open», pero no sus métodos. Basta con abrirlo y cerrarlo, y con
// avisar «close» como lo hace el navegador.
HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
  this.open = true
}
HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
  this.open = false
  this.dispatchEvent(new Event('close'))
}

// jsdom no trae matchMedia: por defecto, la app no está abierta como aplicación instalada.
beforeEach(() => {
  simularModoAplicacion(false)
})

afterEach(() => {
  cleanup()
})
