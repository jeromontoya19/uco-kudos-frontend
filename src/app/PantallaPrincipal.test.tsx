import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ProveedorDeApiFija } from '../compartido/api/ProveedorDeApi'
import type { AvisoDeKudoRecibido } from '../compartido/api/contrato'
import { ErrorDeApi, type TipoDeErrorDeApi } from '../compartido/api/ErrorDeApi'
import { crearApiFalsa, kudo } from '../pruebas/datos'
import { PantallaPrincipal } from './PantallaPrincipal'

function mostrar(api = crearApiFalsa()) {
  const acciones = { alIniciarSesion: vi.fn<() => void>(), alCerrarSesion: vi.fn<() => void>() }
  const { unmount } = render(
    <ProveedorDeApiFija api={api}>
      <PantallaPrincipal {...acciones} />
    </ProveedorDeApiFija>,
  )
  return { ...acciones, unmount }
}

function apiQueFallaEnYo(tipo: TipoDeErrorDeApi) {
  return crearApiFalsa({ yo: () => Promise.reject(new ErrorDeApi(tipo, 'Falla de prueba')) })
}

/** Una API cuyos avisos en vivo se disparan a mano con `avisar`. */
function apiConAvisos() {
  const cerrar = vi.fn<() => void>()
  let receptor: ((aviso: AvisoDeKudoRecibido) => void) | undefined
  const api = crearApiFalsa({
    avisosEnVivo: (alAviso) => {
      receptor = alAviso
      return cerrar
    },
  })
  const avisar = (aviso: AvisoDeKudoRecibido) => act(() => receptor?.(aviso))
  return { api, cerrar, avisar }
}

describe('PantallaPrincipal', () => {
  it('muestra la cabecera con «Dar un Kudo» y el muro, con el panel cerrado', async () => {
    mostrar()

    expect(await screen.findByRole('banner')).toHaveTextContent('Ana Docente')
    expect(screen.getByRole('button', { name: 'Dar un Kudo' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Muro' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('publica desde el panel: lo cierra, avisa y pone el Kudo arriba del muro', async () => {
    mostrar()
    await screen.findAllByRole('article')
    await userEvent.click(screen.getByRole('button', { name: 'Dar un Kudo' }))
    const panel = screen.getByRole('dialog', { name: 'Da un Kudo' })
    await userEvent.selectOptions(await within(panel).findByLabelText('¿A quién reconoces?'), 'Beto Estudiante')
    await userEvent.selectOptions(within(panel).getByLabelText('Categoría'), 'Innovación')
    await userEvent.type(within(panel).getByLabelText('Mensaje'), 'Excelente exposición')

    await userEvent.click(within(panel).getByRole('button', { name: 'Publicar Kudo' }))

    expect(await screen.findByRole('status')).toHaveTextContent('¡Listo! Tu Kudo ya está en el muro.')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    const [primero] = screen.getAllByRole('article')
    expect(primero).toHaveTextContent('Excelente exposición')
  })

  it('con un Kudo recibido en vivo, avisa en pantalla y lo pone arriba del muro', async () => {
    const { api, avisar } = apiConAvisos()
    const recibido = kudo({ id: 'k9', contenido: 'Gran trabajo en el taller' })
    api.muro.mockResolvedValueOnce([kudo()]).mockResolvedValueOnce([recibido, kudo()])
    mostrar(api)
    await screen.findByRole('article')

    avisar({ kudo: 'k9', autor: 'Ana Docente', categoria: 'Innovación' })

    expect(await screen.findByText('Ana Docente te dio un Kudo de Innovación')).toBeInTheDocument()
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(2))
    expect(screen.getAllByRole('article')[0]).toHaveTextContent('Gran trabajo en el taller')
  })

  it('escucha los avisos con una sola conexión y la cierra al salir', async () => {
    const { api, cerrar } = apiConAvisos()
    const { unmount } = mostrar(api)
    await screen.findByRole('article')

    unmount()

    expect(api.avisosEnVivo).toHaveBeenCalledOnce()
    expect(cerrar).toHaveBeenCalledOnce()
  })

  it('no escucha avisos mientras la cuenta no esté lista', async () => {
    const api = apiQueFallaEnYo('no-habilitada')
    mostrar(api)

    await screen.findByRole('heading', { name: 'Tu cuenta aún no está habilitada' })

    expect(api.avisosEnVivo).not.toHaveBeenCalled()
  })

  it('dice que la cuenta no está habilitada y deja cerrar sesión', async () => {
    const acciones = mostrar(apiQueFallaEnYo('no-habilitada'))

    expect(await screen.findByRole('heading', { name: 'Tu cuenta aún no está habilitada' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    expect(acciones.alCerrarSesion).toHaveBeenCalledTimes(1)
  })

  it('pide volver a iniciar sesión si la sesión terminó', async () => {
    const acciones = mostrar(apiQueFallaEnYo('sin-sesion'))

    await userEvent.click(await screen.findByRole('button', { name: 'Iniciar sesión' }))

    expect(acciones.alIniciarSesion).toHaveBeenCalledTimes(1)
  })

  it('deja reintentar si la API no respondió', async () => {
    const api = crearApiFalsa()
    api.yo.mockRejectedValueOnce(new ErrorDeApi('red', 'Sin conexión'))
    mostrar(api)

    await userEvent.click(await screen.findByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByRole('banner')).toHaveTextContent('Ana Docente')
  })
})
