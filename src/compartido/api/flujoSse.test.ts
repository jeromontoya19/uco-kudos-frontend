import { describe, expect, it, vi } from 'vitest'
import { conexionAbierta, respuestaSse } from '../../pruebas/flujos'
import type { ObtenerToken } from './clienteHttp'
import { ErrorDeApi } from './ErrorDeApi'
import { abrirFlujoSse, type Esperar } from './flujoSse'
import type { EventoSse } from './sse'

const URL_DEL_FLUJO = 'https://api.prueba/api/avisos/en-vivo'
const EVENTO = 'event:kudo-recibido\ndata:{"kudo":"k1"}\n\n'

/**
 * Abre el flujo con un fetch simulado y lo cierra después de `intentos` esperas, que no tardan nada.
 * Devuelve lo que pasó: los eventos, las esperas pedidas y cómo se pidió el token cada vez.
 */
async function correr(fetch: typeof globalThis.fetch, intentos: number, obtenerToken?: ObtenerToken) {
  const eventos: EventoSse[] = []
  const esperas: number[] = []
  const token = vi.fn<ObtenerToken>(obtenerToken ?? (() => Promise.resolve('token')))
  let cerrar = () => {}
  const esperar: Esperar = (ms) => {
    esperas.push(ms)
    if (esperas.length >= intentos) {
      cerrar()
    }
    return Promise.resolve()
  }

  cerrar = abrirFlujoSse({ url: URL_DEL_FLUJO, obtenerToken: token, alEvento: (evento) => eventos.push(evento), fetch, esperar })
  await vi.waitFor(() => expect(esperas).toHaveLength(intentos))
  return { eventos, esperas, token }
}

describe('abrirFlujoSse', () => {
  it('pide el flujo con el token y entrega sus eventos, sin el latido', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(() => Promise.resolve(respuestaSse(':latido\n\n', EVENTO)))

    const { eventos } = await correr(fetch, 1)

    expect(eventos).toEqual([{ tipo: 'kudo-recibido', datos: '{"kudo":"k1"}' }])
    const [url, opciones] = fetch.mock.calls[0] ?? []
    expect(url).toBe(URL_DEL_FLUJO)
    expect(opciones?.headers).toMatchObject({ Accept: 'text/event-stream', Authorization: 'Bearer token' })
  })

  it('cuando el servidor cierra el flujo, espera 1 s y vuelve a conectarse pidiendo el token otra vez', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(() => Promise.resolve(respuestaSse(EVENTO)))

    const { eventos, esperas, token } = await correr(fetch, 2)

    expect(eventos).toHaveLength(2)
    expect(esperas).toEqual([1_000, 1_000])
    expect(token).toHaveBeenCalledTimes(2)
  })

  it('con fallas seguidas espera 1, 2, 4… hasta 30 s', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(() => Promise.reject(new TypeError('Failed to fetch')))

    const { esperas } = await correr(fetch, 7)

    expect(esperas).toEqual([1_000, 2_000, 4_000, 8_000, 16_000, 30_000, 30_000])
  })

  it('después de un 401 pide un token nuevo, no el de la caché', async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValue(respuestaSse(EVENTO))

    const { eventos, token } = await correr(fetch, 2)

    expect(token.mock.calls).toEqual([[{ renovar: false }], [{ renovar: true }]])
    expect(eventos).toHaveLength(1)
  })

  it('trata como falla una respuesta de error del servidor', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(() => Promise.resolve(new Response(null, { status: 503 })))

    const { esperas } = await correr(fetch, 2)

    expect(esperas).toEqual([1_000, 2_000])
  })

  it('reintenta si no pudo obtener el token, sin llamar a la API', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>()
    const sinToken: ObtenerToken = () => Promise.reject(new ErrorDeApi('sin-sesion', 'Sin refresh token'))

    const { esperas } = await correr(fetch, 2, sinToken)

    expect(esperas).toEqual([1_000, 2_000])
    expect(fetch).not.toHaveBeenCalled()
  })

  it('vuelve a la espera de 1 s en cuanto una conexión funciona', async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(respuestaSse(EVENTO))
      .mockRejectedValue(new TypeError('Failed to fetch'))

    const { esperas } = await correr(fetch, 4)

    expect(esperas).toEqual([1_000, 2_000, 1_000, 1_000])
  })

  it('sigue conectándose si la conexión se corta a mitad del flujo', async () => {
    const cortada = new Response(
      new ReadableStream<Uint8Array>({
        start(control) {
          control.error(new TypeError('network error'))
        },
      }),
    )
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValueOnce(cortada).mockResolvedValue(respuestaSse(EVENTO))

    const { eventos, esperas } = await correr(fetch, 2)

    expect(eventos).toHaveLength(1)
    expect(esperas).toEqual([1_000, 1_000])
  })

  it('al cerrarlo corta la conexión y no vuelve a conectarse', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(conexionAbierta)
    const esperar = vi.fn<Esperar>(() => Promise.resolve())
    const cerrar = abrirFlujoSse({
      url: URL_DEL_FLUJO,
      obtenerToken: () => Promise.resolve('token'),
      alEvento: vi.fn<(evento: EventoSse) => void>(),
      fetch,
      esperar,
    })
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))

    cerrar()
    await new Promise((resolver) => setTimeout(resolver, 20))

    const [, opciones] = fetch.mock.calls[0] ?? []
    expect(opciones?.signal?.aborted).toBe(true)
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(esperar).not.toHaveBeenCalled()
  })

  it('con la espera real, cerrarlo no deja temporizadores pendientes', async () => {
    vi.useFakeTimers()
    try {
      const fetch = vi.fn<typeof globalThis.fetch>(() => Promise.reject(new TypeError('Failed to fetch')))
      const cerrar = abrirFlujoSse({
        url: URL_DEL_FLUJO,
        obtenerToken: () => Promise.resolve('token'),
        alEvento: vi.fn<(evento: EventoSse) => void>(),
        fetch,
      })
      await vi.advanceTimersByTimeAsync(1_000)
      expect(fetch).toHaveBeenCalledTimes(2)

      cerrar()
      await vi.advanceTimersByTimeAsync(60_000)

      expect(fetch).toHaveBeenCalledTimes(2)
      expect(vi.getTimerCount()).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })
})
