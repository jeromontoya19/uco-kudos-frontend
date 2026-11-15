import { vi } from 'vitest'

/** Lo que se le pide al registro del service worker. */
export type RegistroFalso = Pick<ServiceWorkerRegistration, 'showNotification'>

/**
 * Una API Notification falsa, porque jsdom no la trae: tiene el permiso indicado, responde
 * `alPedir` cuando se pide y anota las notificaciones que se crean con `new`.
 */
export function simularNotificaciones(permiso: NotificationPermission, alPedir: NotificationPermission = permiso) {
  const creadas: { readonly titulo: string; readonly opciones?: NotificationOptions }[] = []
  const requestPermission = vi.fn<() => Promise<NotificationPermission>>(() => Promise.resolve(alPedir))
  function NotificacionFalsa(titulo: string, opciones?: NotificationOptions) {
    creadas.push({ titulo, opciones })
  }
  vi.stubGlobal('Notification', Object.assign(NotificacionFalsa, { permission: permiso, requestPermission }))
  return { creadas, requestPermission }
}

/** Simula `navigator.serviceWorker` con este registro; sin registro, como en desarrollo. */
export function simularServiceWorker(registro: RegistroFalso | undefined): void {
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: { getRegistration: () => Promise.resolve(registro) },
  })
}

/** Simula si la pestaña está a la vista o en segundo plano. */
export function simularVisibilidad(estado: DocumentVisibilityState): void {
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(estado)
}

/** Deja `navigator`, `document` y `Notification` como los trae jsdom. */
export function restaurarNavegador(): void {
  Reflect.deleteProperty(navigator, 'serviceWorker')
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
}
