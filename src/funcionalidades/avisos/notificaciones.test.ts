import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  restaurarNavegador,
  simularNotificaciones,
  simularServiceWorker,
  simularVisibilidad,
  type RegistroFalso,
} from '../../pruebas/notificaciones'
import { notificarSiEstaOculta, pedirPermisoDeNotificaciones, sePuedenOfrecerNotificaciones } from './notificaciones'

const TEXTO = 'Ana Docente te dio un Kudo de Colaboración'
const OPCIONES = { body: TEXTO, icon: '/pwa-192x192.png', tag: 'k9' }

function registroFalso(showNotification: RegistroFalso['showNotification'] = () => Promise.resolve()) {
  return { showNotification: vi.fn<RegistroFalso['showNotification']>(showNotification) }
}

describe('notificaciones', () => {
  afterEach(() => {
    restaurarNavegador()
  })

  describe('sePuedenOfrecerNotificaciones', () => {
    it('es falso si el navegador no tiene notificaciones', () => {
      expect(sePuedenOfrecerNotificaciones()).toBe(false)
    })

    it.each([
      ['default', true],
      ['granted', false],
      ['denied', false],
    ] as const)('con el permiso «%s» es %s', (permiso, esperado) => {
      simularNotificaciones(permiso)

      expect(sePuedenOfrecerNotificaciones()).toBe(esperado)
    })
  })

  describe('pedirPermisoDeNotificaciones', () => {
    it('responde falso si el navegador no tiene notificaciones', async () => {
      await expect(pedirPermisoDeNotificaciones()).resolves.toBe(false)
    })

    it.each([
      ['granted', true],
      ['denied', false],
    ] as const)('si la persona responde «%s», responde %s', async (respuesta, esperado) => {
      const { requestPermission } = simularNotificaciones('default', respuesta)

      await expect(pedirPermisoDeNotificaciones()).resolves.toBe(esperado)
      expect(requestPermission).toHaveBeenCalledOnce()
    })
  })

  describe('notificarSiEstaOculta', () => {
    it('con la app oculta, la muestra desde el service worker', async () => {
      simularNotificaciones('granted')
      simularVisibilidad('hidden')
      const registro = registroFalso()
      simularServiceWorker(registro)

      await notificarSiEstaOculta(TEXTO, 'k9')

      expect(registro.showNotification).toHaveBeenCalledWith('UCO Kudos', OPCIONES)
    })

    it('sin service worker, la crea directamente', async () => {
      const { creadas } = simularNotificaciones('granted')
      simularVisibilidad('hidden')
      simularServiceWorker(undefined)

      await notificarSiEstaOculta(TEXTO, 'k9')

      expect(creadas).toEqual([{ titulo: 'UCO Kudos', opciones: OPCIONES }])
    })

    it('con la app a la vista no hace nada: ya está el aviso en pantalla', async () => {
      const { creadas } = simularNotificaciones('granted')
      simularVisibilidad('visible')
      const registro = registroFalso()
      simularServiceWorker(registro)

      await notificarSiEstaOculta(TEXTO, 'k9')

      expect(registro.showNotification).not.toHaveBeenCalled()
      expect(creadas).toEqual([])
    })

    it.each(['default', 'denied'] as const)('con el permiso «%s» no hace nada', async (permiso) => {
      const { creadas } = simularNotificaciones(permiso)
      simularVisibilidad('hidden')
      const registro = registroFalso()
      simularServiceWorker(registro)

      await notificarSiEstaOculta(TEXTO, 'k9')

      expect(registro.showNotification).not.toHaveBeenCalled()
      expect(creadas).toEqual([])
    })

    it('sin notificaciones en el navegador no hace nada', async () => {
      simularVisibilidad('hidden')

      await expect(notificarSiEstaOculta(TEXTO, 'k9')).resolves.toBeUndefined()
    })

    it('si el sistema no la muestra, no lanza el error', async () => {
      simularNotificaciones('granted')
      simularVisibilidad('hidden')
      simularServiceWorker(registroFalso(() => Promise.reject(new TypeError('No permitido'))))

      await expect(notificarSiEstaOculta(TEXTO, 'k9')).resolves.toBeUndefined()
    })
  })
})
