import { ErrorDeApi } from './ErrorDeApi'
import { abrirFlujoSse } from './flujoSse'
import type { EventoSse } from './sse'

/**
 * Entrega un access token vigente; si no puede, lanza un ErrorDeApi de tipo `sin-sesion`.
 * Con `renovar`, no usa el de la caché: se pide uno nuevo (por ejemplo, después de un 401).
 */
export type ObtenerToken = (opciones?: { readonly renovar?: boolean }) => Promise<string>

export interface ClienteHttp {
  obtener<T>(ruta: string): Promise<T>
  enviar<T>(ruta: string, cuerpo: unknown): Promise<T>
  /** Escucha un flujo SSE y se reconecta solo. Devuelve la función que lo cierra. */
  escuchar(ruta: string, alEvento: (evento: EventoSse) => void): () => void
}

interface DependenciasDelCliente {
  readonly urlBase: string
  readonly obtenerToken: ObtenerToken
  readonly fetch?: typeof globalThis.fetch
}

const ESTADO_SIN_SESION = 401
const ESTADO_NO_HABILITADA = 403
const ESTADO_SOLICITUD_INVALIDA = 400
const ESTADO_RECHAZO = 422

/** Lee el cuerpo Problem Details (RFC 9457) de un error, si lo hay. */
async function leerProblema(respuesta: Response): Promise<{ detail?: string; motivo?: string }> {
  try {
    return (await respuesta.json()) as { detail?: string; motivo?: string }
  } catch {
    // El 401 y el 403 de la API llegan sin cuerpo: no hay detalle que leer.
    return {}
  }
}

async function errorDesde(respuesta: Response): Promise<ErrorDeApi> {
  switch (respuesta.status) {
    case ESTADO_SIN_SESION:
      return new ErrorDeApi('sin-sesion', 'La API no aceptó el token.')
    case ESTADO_NO_HABILITADA:
      return new ErrorDeApi('no-habilitada', 'La cuenta no está vinculada a una persona activa.')
    case ESTADO_SOLICITUD_INVALIDA: {
      const problema = await leerProblema(respuesta)
      return new ErrorDeApi('solicitud', problema.detail ?? 'Solicitud incompleta.')
    }
    case ESTADO_RECHAZO: {
      const problema = await leerProblema(respuesta)
      return new ErrorDeApi('rechazo', problema.detail ?? 'Operación rechazada.', { motivo: problema.motivo })
    }
    default:
      return new ErrorDeApi('servidor', `La API respondió ${respuesta.status}.`)
  }
}

/** Habla con la API: pone el token en cada petición y convierte los errores en ErrorDeApi. */
export function crearClienteHttp({ urlBase, obtenerToken, fetch = globalThis.fetch }: DependenciasDelCliente): ClienteHttp {
  async function pedir<T>(ruta: string, metodo: 'GET' | 'POST', cuerpo?: unknown): Promise<T> {
    const token = await obtenerToken()
    const encabezados: Record<string, string> = { Accept: 'application/json', Authorization: `Bearer ${token}` }
    if (cuerpo !== undefined) {
      encabezados['Content-Type'] = 'application/json'
    }

    let respuesta: Response
    try {
      respuesta = await fetch(`${urlBase}${ruta}`, {
        method: metodo,
        headers: encabezados,
        body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      })
    } catch (causa) {
      throw new ErrorDeApi('red', 'No hubo respuesta de la API.', { causa })
    }

    if (!respuesta.ok) {
      throw await errorDesde(respuesta)
    }
    return (await respuesta.json()) as T
  }

  return {
    obtener: (ruta) => pedir(ruta, 'GET'),
    enviar: (ruta, cuerpo) => pedir(ruta, 'POST', cuerpo),
    escuchar: (ruta, alEvento) => abrirFlujoSse({ url: `${urlBase}${ruta}`, obtenerToken, alEvento, fetch }),
  }
}
