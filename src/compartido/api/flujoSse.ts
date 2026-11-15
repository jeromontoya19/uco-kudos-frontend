import type { ObtenerToken } from './clienteHttp'
import { crearLectorSse, type EventoSse } from './sse'

/** La primera espera antes de reconectar; se duplica en cada falla seguida. */
export const ESPERA_INICIAL_MS = 1_000
/** La espera más larga entre intentos. */
export const ESPERA_MAXIMA_MS = 30_000

const ESTADO_SIN_SESION = 401

/** Espera `ms`, o menos si se cierra el flujo mientras tanto. */
export type Esperar = (ms: number, senal: AbortSignal) => Promise<void>

interface OpcionesDelFlujo {
  readonly url: string
  readonly obtenerToken: ObtenerToken
  readonly alEvento: (evento: EventoSse) => void
  readonly fetch?: typeof globalThis.fetch
  readonly esperar?: Esperar
}

type Resultado = 'conecto' | 'sin-sesion' | 'fallo'

const esperarCancelable: Esperar = (ms, senal) =>
  new Promise((resolver) => {
    const temporizador = setTimeout(resolver, ms)
    senal.addEventListener(
      'abort',
      () => {
        clearTimeout(temporizador)
        resolver()
      },
      { once: true },
    )
  })

/**
 * Abre un flujo SSE con fetch, porque EventSource no deja mandar el encabezado Authorization, y lo
 * mantiene abierto: cuando el servidor lo cierra (cada 30 min), se cae la red o llega un 401, vuelve a
 * conectarse con un token fresco. Tras una conexión que funcionó espera 1 s; tras fallas seguidas,
 * 1, 2, 4… hasta 30 s. Devuelve la función que lo cierra del todo.
 */
export function abrirFlujoSse({
  url,
  obtenerToken,
  alEvento,
  fetch = globalThis.fetch,
  esperar = esperarCancelable,
}: OpcionesDelFlujo): () => void {
  const control = new AbortController()
  const senal = control.signal

  async function leerHastaQueTermine(cuerpo: ReadableStream<Uint8Array>) {
    const leer = crearLectorSse(alEvento)
    const lector = cuerpo.getReader()
    const decodificador = new TextDecoder()
    try {
      for (;;) {
        const { done, value } = await lector.read()
        if (done) {
          return
        }
        leer(decodificador.decode(value, { stream: true }))
      }
    } catch {
      // Se cortó la conexión a mitad del flujo: el ciclo de afuera vuelve a conectar.
    }
  }

  async function conectarUnaVez(renovarToken: boolean): Promise<Resultado> {
    try {
      const token = await obtenerToken({ renovar: renovarToken })
      const respuesta = await fetch(url, {
        headers: { Accept: 'text/event-stream', Authorization: `Bearer ${token}` },
        signal: senal,
      })
      if (respuesta.status === ESTADO_SIN_SESION) {
        return 'sin-sesion'
      }
      if (!respuesta.ok || !respuesta.body) {
        return 'fallo'
      }
      await leerHastaQueTermine(respuesta.body)
      return 'conecto'
    } catch {
      // Sin red, sin token o flujo cerrado a propósito: se decide afuera si se reintenta.
      return 'fallo'
    }
  }

  async function mantenerAbierto() {
    let espera = ESPERA_INICIAL_MS
    let renovarToken = false
    while (!senal.aborted) {
      const resultado = await conectarUnaVez(renovarToken)
      if (senal.aborted) {
        return
      }
      if (resultado === 'conecto') {
        espera = ESPERA_INICIAL_MS
      }
      // Con un 401, el token que había en caché ya no sirve: se pide uno nuevo a Auth0.
      renovarToken = resultado === 'sin-sesion'
      await esperar(espera, senal)
      if (resultado !== 'conecto') {
        espera = Math.min(espera * 2, ESPERA_MAXIMA_MS)
      }
    }
  }

  void mantenerAbierto()
  return () => control.abort()
}
