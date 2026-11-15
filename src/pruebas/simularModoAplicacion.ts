import { vi } from 'vitest'

/** Simula si la página se abrió como aplicación instalada, es decir, `(display-mode: standalone)`. */
export function simularModoAplicacion(abiertaComoAplicacion: boolean): void {
  window.matchMedia = vi.fn<(consulta: string) => MediaQueryList>((consulta) => ({
    matches: abiertaComoAplicacion,
    media: consulta,
    onchange: null,
    addEventListener: vi.fn<() => void>(),
    removeEventListener: vi.fn<() => void>(),
    addListener: vi.fn<() => void>(),
    removeListener: vi.fn<() => void>(),
    dispatchEvent: vi.fn<() => boolean>(() => false),
  }))
}
