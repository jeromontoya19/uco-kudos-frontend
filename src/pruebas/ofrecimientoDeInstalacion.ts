import { vi } from 'vitest'

/** Crea un evento `beforeinstallprompt` como el que lanza Chrome cuando la PWA se puede instalar. */
export function crearOfrecimientoDeInstalacion() {
  return Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
    prompt: vi.fn<() => Promise<void>>(() => Promise.resolve()),
  })
}
