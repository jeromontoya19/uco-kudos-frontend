import { useCallback, useEffect, useState } from 'react'

/**
 * - `disponible`: el navegador ofreció instalarla (Chrome y Edge) y se puede mostrar un botón.
 * - `manual`: no hubo ofrecimiento (Safari, Firefox o ya se usó); se instala desde el menú.
 * - `instalada`: se abrió como aplicación o se acaba de instalar.
 */
export type EstadoDeInstalacion = 'disponible' | 'manual' | 'instalada'

/** El evento `beforeinstallprompt` todavía no está en los tipos estándar del DOM. */
interface OfrecimientoDeInstalacion extends Event {
  prompt(): Promise<unknown>
}

const CONSULTA_MODO_APLICACION = '(display-mode: standalone)'

function esOfrecimientoDeInstalacion(evento: Event): evento is OfrecimientoDeInstalacion {
  return typeof (evento as Partial<OfrecimientoDeInstalacion>).prompt === 'function'
}

function seAbrioComoAplicacion(): boolean {
  return window.matchMedia(CONSULTA_MODO_APLICACION).matches
}

function calcularEstado(estaInstalada: boolean, hayOfrecimiento: boolean): EstadoDeInstalacion {
  if (estaInstalada) {
    return 'instalada'
  }
  return hayOfrecimiento ? 'disponible' : 'manual'
}

export function useInstalacionPwa() {
  const [estaInstalada, setEstaInstalada] = useState(seAbrioComoAplicacion)
  const [ofrecimiento, setOfrecimiento] = useState<OfrecimientoDeInstalacion | undefined>()

  useEffect(() => {
    const alRecibirOfrecimiento = (evento: Event) => {
      if (!esOfrecimientoDeInstalacion(evento)) {
        return
      }
      // Sin esto, Chrome muestra su propio aviso; así la instalación la ofrece el botón de la app.
      evento.preventDefault()
      setOfrecimiento(evento)
    }
    const alInstalarse = () => {
      setOfrecimiento(undefined)
      setEstaInstalada(true)
    }

    window.addEventListener('beforeinstallprompt', alRecibirOfrecimiento)
    window.addEventListener('appinstalled', alInstalarse)
    return () => {
      window.removeEventListener('beforeinstallprompt', alRecibirOfrecimiento)
      window.removeEventListener('appinstalled', alInstalarse)
    }
  }, [])

  const instalar = useCallback(async () => {
    if (!ofrecimiento) {
      return
    }
    // El navegador deja usar cada ofrecimiento una sola vez.
    setOfrecimiento(undefined)
    await ofrecimiento.prompt()
  }, [ofrecimiento])

  return { estado: calcularEstado(estaInstalada, ofrecimiento !== undefined), instalar }
}
