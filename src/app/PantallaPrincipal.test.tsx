import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ProveedorDeApiFija } from '../compartido/api/ProveedorDeApi'
import { ErrorDeApi, type TipoDeErrorDeApi } from '../compartido/api/ErrorDeApi'
import { crearApiFalsa } from '../pruebas/datos'
import { PantallaPrincipal } from './PantallaPrincipal'

function mostrar(api = crearApiFalsa()) {
  const acciones = { alIniciarSesion: vi.fn<() => void>(), alCerrarSesion: vi.fn<() => void>() }
  render(
    <ProveedorDeApiFija api={api}>
      <PantallaPrincipal {...acciones} />
    </ProveedorDeApiFija>,
  )
  return acciones
}

function apiQueFallaEnYo(tipo: TipoDeErrorDeApi) {
  return crearApiFalsa({ yo: () => Promise.reject(new ErrorDeApi(tipo, 'Falla de prueba')) })
}

describe('PantallaPrincipal', () => {
  it('muestra la cabecera, el formulario para publicar y el muro', async () => {
    mostrar()

    expect(await screen.findByRole('banner')).toHaveTextContent('Ana Docente')
    expect(await screen.findByRole('heading', { name: 'Da un Kudo' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Muro' })).toBeInTheDocument()
  })

  it('pone arriba del muro el Kudo recién publicado', async () => {
    mostrar()
    await userEvent.selectOptions(await screen.findByLabelText('¿A quién reconoces?'), 'Beto Estudiante')
    await userEvent.selectOptions(screen.getByLabelText('Categoría'), 'Innovación')
    await userEvent.type(screen.getByLabelText('Mensaje'), 'Excelente exposición')
    await screen.findAllByRole('article')

    await userEvent.click(screen.getByRole('button', { name: 'Publicar Kudo' }))

    const [primero] = await screen.findAllByRole('article')
    expect(primero).toHaveTextContent('Excelente exposición')
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
