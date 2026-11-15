import { describe, expect, it, vi } from 'vitest'
import { conexionAbierta } from '../../pruebas/flujos'
import { crearClienteHttp } from './clienteHttp'
import { ErrorDeApi } from './ErrorDeApi'
import type { EventoSse } from './sse'

const URL_BASE = 'https://api.prueba'

function respuestaJson(estado: number, cuerpo?: unknown): Response {
  return new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), {
    status: estado,
    headers: { 'Content-Type': 'application/json' },
  })
}

function crearCliente(fetch: typeof globalThis.fetch, obtenerToken = () => Promise.resolve('token-de-prueba')) {
  return crearClienteHttp({ urlBase: URL_BASE, obtenerToken, fetch })
}

async function errorAl(pedido: Promise<unknown>): Promise<ErrorDeApi> {
  try {
    await pedido
  } catch (error) {
    if (error instanceof ErrorDeApi) {
      return error
    }
    throw error
  }
  throw new Error('Se esperaba un ErrorDeApi.')
}

describe('crearClienteHttp', () => {
  it('pide con el token en el encabezado Authorization y devuelve el JSON', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(() => Promise.resolve(respuestaJson(200, { nombre: 'Ana' })))

    const respuesta = await crearCliente(fetch).obtener<{ nombre: string }>('/api/yo')

    expect(respuesta).toEqual({ nombre: 'Ana' })
    const [url, opciones] = fetch.mock.calls[0] ?? []
    expect(url).toBe('https://api.prueba/api/yo')
    expect(opciones?.method).toBe('GET')
    expect(opciones?.headers).toMatchObject({ Authorization: 'Bearer token-de-prueba' })
  })

  it('envía el cuerpo como JSON', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(() => Promise.resolve(respuestaJson(201, { id: 'k1' })))

    await crearCliente(fetch).enviar('/api/kudos', { contenido: 'Gracias' })

    const [, opciones] = fetch.mock.calls[0] ?? []
    expect(opciones?.method).toBe('POST')
    expect(opciones?.headers).toMatchObject({ 'Content-Type': 'application/json' })
    expect(opciones?.body).toBe('{"contenido":"Gracias"}')
  })

  it.each([
    [401, 'sin-sesion'],
    [403, 'no-habilitada'],
    [500, 'servidor'],
  ] as const)('convierte la respuesta %i en un error de tipo «%s»', async (estado, tipo) => {
    const fetch = vi.fn<typeof globalThis.fetch>(() => Promise.resolve(respuestaJson(estado)))

    const error = await errorAl(crearCliente(fetch).obtener('/api/yo'))

    expect(error.tipo).toBe(tipo)
  })

  it('lee el motivo del rechazo (422) en Problem Details', async () => {
    const problema = { title: 'No se pudo publicar el Kudo', detail: 'El autor es el destinatario', motivo: 'AUTOR_ES_DESTINATARIO' }
    const fetch = vi.fn<typeof globalThis.fetch>(() => Promise.resolve(respuestaJson(422, problema)))

    const error = await errorAl(crearCliente(fetch).enviar('/api/kudos', {}))

    expect(error.tipo).toBe('rechazo')
    expect(error.motivo).toBe('AUTOR_ES_DESTINATARIO')
    expect(error.message).toBe('El autor es el destinatario')
  })

  it('convierte el 400 en un error de solicitud con su detalle', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(() => Promise.resolve(respuestaJson(400, { detail: 'Falta la categoría' })))

    const error = await errorAl(crearCliente(fetch).enviar('/api/kudos', {}))

    expect(error.tipo).toBe('solicitud')
    expect(error.message).toBe('Falta la categoría')
  })

  it('usa un mensaje por defecto si el rechazo llega sin cuerpo', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(() => Promise.resolve(new Response('no es JSON', { status: 422 })))

    const error = await errorAl(crearCliente(fetch).enviar('/api/kudos', {}))

    expect(error.tipo).toBe('rechazo')
    expect(error.motivo).toBeUndefined()
  })

  it('convierte una falla de red en un error de tipo «red»', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(() => Promise.reject(new TypeError('Failed to fetch')))

    const error = await errorAl(crearCliente(fetch).obtener('/api/kudos'))

    expect(error.tipo).toBe('red')
  })

  it('no llama a la API si no hay token', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>()
    const sinToken = () => Promise.reject(new ErrorDeApi('sin-sesion', 'Sin refresh token'))

    const error = await errorAl(crearCliente(fetch, sinToken).obtener('/api/yo'))

    expect(error.tipo).toBe('sin-sesion')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('escucha un flujo en la URL de la API con el mismo token, hasta que se cierra', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(conexionAbierta)

    const cerrar = crearCliente(fetch).escuchar('/api/avisos/en-vivo', vi.fn<(evento: EventoSse) => void>())
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce())
    cerrar()

    const [url, opciones] = fetch.mock.calls[0] ?? []
    expect(url).toBe('https://api.prueba/api/avisos/en-vivo')
    expect(opciones?.headers).toMatchObject({ Authorization: 'Bearer token-de-prueba' })
    expect(opciones?.signal?.aborted).toBe(true)
  })
})
