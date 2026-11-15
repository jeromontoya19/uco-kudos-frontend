import { act, render, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ErrorDeApi } from '../../compartido/api/ErrorDeApi'
import { crearApiFalsa, kudo, kudos } from '../../pruebas/datos'
import { Muro } from './Muro'
import { TAMANO_DE_PAGINA, useMuro, type EstadoDelMuro } from './useMuro'

function MuroConApi({ api }: { readonly api: ReturnType<typeof crearApiFalsa> }) {
  return <Muro muro={useMuro(api)} />
}

describe('Muro', () => {
  it('muestra los Kudos con autor, destinatario, categoría y mensaje', async () => {
    render(<MuroConApi api={crearApiFalsa()} />)

    const tarjeta = await screen.findByRole('article')
    expect(tarjeta).toHaveTextContent('Ana Docente reconoció a Beto Estudiante')
    expect(tarjeta).toHaveTextContent('Colaboración')
    expect(tarjeta).toHaveTextContent('Gracias por la ayuda con el laboratorio.')
  })

  it('invita a publicar cuando el muro está vacío', async () => {
    render(<MuroConApi api={crearApiFalsa({ muro: () => Promise.resolve([]) })} />)

    expect(await screen.findByText('Todavía no hay Kudos. ¡Publica el primero!')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ver más' })).not.toBeInTheDocument()
  })

  it('pide la página siguiente con «Ver más»', async () => {
    const api = crearApiFalsa()
    api.muro.mockResolvedValueOnce(kudos(TAMANO_DE_PAGINA)).mockResolvedValueOnce(kudos(3, TAMANO_DE_PAGINA))
    render(<MuroConApi api={api} />)

    await userEvent.click(await screen.findByRole('button', { name: 'Ver más' }))

    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(TAMANO_DE_PAGINA + 3))
    expect(api.muro).toHaveBeenLastCalledWith(1, TAMANO_DE_PAGINA)
    // La segunda página llegó incompleta: ya no hay más.
    expect(screen.queryByRole('button', { name: 'Ver más' })).not.toBeInTheDocument()
  })

  it('explica el error y vuelve a pedir con «Reintentar»', async () => {
    const api = crearApiFalsa()
    api.muro.mockRejectedValueOnce(new ErrorDeApi('red', 'Sin conexión'))
    render(<MuroConApi api={api} />)

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos conectar con UCO Kudos')
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByRole('article')).toBeInTheDocument()
    expect(api.muro).toHaveBeenLastCalledWith(0, TAMANO_DE_PAGINA)
  })
})

describe('useMuro', () => {
  async function muroCargado(api = crearApiFalsa()): Promise<{ current: EstadoDelMuro }> {
    const { result } = renderHook(() => useMuro(api))
    await waitFor(() => expect(result.current.cargando).toBe(false))
    return result
  }

  it('pone arriba un Kudo recién publicado', async () => {
    const resultado = await muroCargado()

    act(() => resultado.current.agregarAlInicio(kudo({ id: 'nuevo', contenido: 'Recién publicado' })))

    expect(resultado.current.kudos.map((uno) => uno.id)).toEqual(['nuevo', 'k1'])
  })

  it('no repite un Kudo que la página siguiente vuelve a traer', async () => {
    const api = crearApiFalsa()
    api.muro.mockResolvedValueOnce(kudos(TAMANO_DE_PAGINA)).mockResolvedValueOnce(kudos(2, TAMANO_DE_PAGINA - 1))
    const resultado = await muroCargado(api)

    act(() => resultado.current.cargarMas())

    await waitFor(() => expect(resultado.current.kudos).toHaveLength(TAMANO_DE_PAGINA + 1))
  })
})
