// Notificaciones del sistema para los avisos en vivo. No es Web Push: solo funcionan mientras la app
// sigue abierta, aunque esté en segundo plano (ADR-021).

const TITULO = 'UCO Kudos'
const ICONO = '/pwa-192x192.png'

function hayNotificaciones(): boolean {
  return typeof Notification !== 'undefined'
}

/** Verdadero si el navegador las tiene y la persona todavía no dijo ni sí ni no. */
export function sePuedenOfrecerNotificaciones(): boolean {
  return hayNotificaciones() && Notification.permission === 'default'
}

/** Pide el permiso; el navegador solo lo deja pedir después de un toque de la persona. */
export async function pedirPermisoDeNotificaciones(): Promise<boolean> {
  if (!hayNotificaciones()) {
    return false
  }
  return (await Notification.requestPermission()) === 'granted'
}

/**
 * Con permiso y con la app en segundo plano, muestra una notificación del sistema. Con la app a la vista
 * no hace falta: ya está el aviso en pantalla. En Android solo el service worker puede mostrarlas; sin
 * service worker (en desarrollo) se usa la API Notification directamente.
 */
export async function notificarSiEstaOculta(texto: string, etiqueta: string): Promise<void> {
  if (!hayNotificaciones() || Notification.permission !== 'granted' || document.visibilityState !== 'hidden') {
    return
  }
  const opciones: NotificationOptions = { body: texto, icon: ICONO, tag: etiqueta }
  try {
    const registro = await navigator.serviceWorker?.getRegistration()
    if (registro) {
      await registro.showNotification(TITULO, opciones)
      return
    }
    return void new Notification(TITULO, opciones)
  } catch {
    // Si el sistema no la muestra, la persona igual ve el aviso al volver a la app.
  }
}
