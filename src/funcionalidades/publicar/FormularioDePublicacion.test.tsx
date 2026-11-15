import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ProveedorDeApiFija } from '../../compartido/api/ProveedorDeApi'
import type { KudoDelMuro, MotivoDeRechazo } from '../../compartido/api/contrato'
import { ErrorDeApi } from '../../compartido/api/ErrorDeApi'
import { crearApiFalsa, DOCENTE, ESTUDIANTE } from '../../pruebas/datos'
import { FormularioDePublicacion } from './FormularioDePublicacion'

function mostrarFormulario(api = crearApiFalsa()) {
  const alPublicar = vi.fn<(kudo: KudoDelMuro) => void>()
  render(
    <ProveedorDeApiFija api={api}>
      <FormularioDePublicacion persona={DOCENTE} alPublicar={alPublicar} />
    </ProveedorDeApiFija>,
  )
  return { api, alPublicar }
}

async function llenar({ destinatario = ESTUDIANTE.nombre, categoria = 'Innovación', mensaje = 'Gracias por todo' } = {}) {
  await userEvent.selectOptions(await screen.findByLabelText('¿A quién reconoces?'), destinatario)
  await userEvent.selectOptions(screen.getByLabelText('Categoría'), categoria)
  await userEvent.type(screen.getByLabelText('Mensaje'), mensaje)
}

const publicar = () => userEvent.click(screen.getByRole('button', { name: 'Publicar Kudo' }))

describe('FormularioDePublicacion', () => {
  it('no ofrece a la persona de la sesión como destinataria', async () => {
    mostrarFormulario()

    const destinatarios = within(await screen.findByLabelText('¿A quién reconoces?')).getAllByRole('option')

    expect(destinatarios.map((opcion) => opcion.textContent)).toEqual(['Elige a una persona', ESTUDIANTE.nombre])
  })

  it('publica, entrega el Kudo nuevo y limpia el formulario', async () => {
    const { api, alPublicar } = mostrarFormulario()
    await llenar({ mensaje: '  Gracias por todo  ' })

    await publicar()

    expect(api.publicar).toHaveBeenCalledWith({ destinatario: ESTUDIANTE.id, categoria: 'c2', contenido: 'Gracias por todo' })
    expect(alPublicar).toHaveBeenCalledWith({
      id: 'nuevo',
      autor: { id: DOCENTE.id, nombre: DOCENTE.nombre },
      destinatario: ESTUDIANTE,
      categoria: 'Innovación',
      contenido: 'Gracias por todo',
      publicadoEn: '2026-11-15T03:00:00Z',
    })
    expect(screen.getByLabelText('Mensaje')).toHaveValue('')
  })

  it('pide elegir destinatario y categoría antes de publicar', async () => {
    const { api } = mostrarFormulario()
    await screen.findByLabelText('¿A quién reconoces?')

    await publicar()

    expect(screen.getByRole('alert')).toHaveTextContent('Elige a quién reconoces y la categoría.')
    expect(api.publicar).not.toHaveBeenCalled()
  })

  it('no publica un mensaje vacío', async () => {
    const { api } = mostrarFormulario()
    await llenar({ mensaje: '   ' })

    await publicar()

    expect(screen.getByRole('alert')).toHaveTextContent('Escribe un mensaje para tu Kudo.')
    expect(api.publicar).not.toHaveBeenCalled()
  })

  it.each<[MotivoDeRechazo, RegExp]>([
    ['AUTOR_ES_DESTINATARIO', /no puedes dártelo tú/],
    ['CONTENIDO_VACIO', /Escribe un mensaje/],
    ['AUTOR_NO_DISPONIBLE', /Tu cuenta no está activa/],
    ['DESTINATARIO_NO_DISPONIBLE', /Esa persona ya no está disponible/],
    ['CATEGORIA_NO_DISPONIBLE', /Esa categoría ya no está disponible/],
  ])('explica el rechazo %s de la API', async (motivo, mensaje) => {
    const api = crearApiFalsa({ publicar: () => Promise.reject(new ErrorDeApi('rechazo', 'Rechazado', { motivo })) })
    const { alPublicar } = mostrarFormulario(api)
    await llenar()

    await publicar()

    expect(await screen.findByRole('alert')).toHaveTextContent(mensaje)
    expect(alPublicar).not.toHaveBeenCalled()
  })

  it('da un mensaje general si la API rechaza con un motivo desconocido', async () => {
    const api = crearApiFalsa({ publicar: () => Promise.reject(new ErrorDeApi('rechazo', 'Rechazado', { motivo: 'OTRO' })) })
    mostrarFormulario(api)
    await llenar()

    await publicar()

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo publicar el Kudo.')
  })

  it('explica si la cuenta no está habilitada', async () => {
    const api = crearApiFalsa({ publicar: () => Promise.reject(new ErrorDeApi('no-habilitada', 'Prohibido')) })
    mostrarFormulario(api)
    await llenar()

    await publicar()

    expect(await screen.findByRole('alert')).toHaveTextContent('Tu cuenta aún no está habilitada.')
  })

  it('permite reintentar si no pudo cargar las personas y las categorías', async () => {
    const api = crearApiFalsa()
    api.categorias.mockRejectedValueOnce(new ErrorDeApi('red', 'Sin conexión'))
    mostrarFormulario(api)

    await userEvent.click(await screen.findByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByLabelText('Categoría')).toBeInTheDocument()
  })
})
