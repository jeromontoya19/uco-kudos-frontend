/**
 * - `sin-sesion`: 401, o no se pudo obtener el token; hay que volver a iniciar sesión.
 * - `no-habilitada`: 403, la cuenta de Auth0 no está vinculada a una persona activa.
 * - `rechazo`: 422, la API rechazó la operación por una regla del negocio; trae su `motivo`.
 * - `solicitud`: 400, faltan datos.
 * - `red`: no hubo respuesta (sin conexión, CORS o la API caída).
 * - `servidor`: cualquier otra respuesta de error.
 */
export type TipoDeErrorDeApi = 'sin-sesion' | 'no-habilitada' | 'rechazo' | 'solicitud' | 'red' | 'servidor'

export class ErrorDeApi extends Error {
  readonly tipo: TipoDeErrorDeApi
  /** Solo en los rechazos (422): por qué la API no aceptó la operación. */
  readonly motivo: string | undefined

  constructor(tipo: TipoDeErrorDeApi, mensaje: string, opciones: { motivo?: string; causa?: unknown } = {}) {
    super(mensaje, { cause: opciones.causa })
    this.name = 'ErrorDeApi'
    this.tipo = tipo
    this.motivo = opciones.motivo
  }
}

/** Cualquier error que llegue a la interfaz se trata como un ErrorDeApi. */
export function comoErrorDeApi(error: unknown): ErrorDeApi {
  if (error instanceof ErrorDeApi) {
    return error
  }
  return new ErrorDeApi('servidor', 'Error inesperado al hablar con la API.', { causa: error })
}

const MENSAJES: Readonly<Record<TipoDeErrorDeApi, string>> = {
  'sin-sesion': 'Tu sesión terminó. Vuelve a iniciar sesión.',
  'no-habilitada': 'Tu cuenta aún no está habilitada.',
  rechazo: 'La operación no cumple las reglas de UCO Kudos.',
  solicitud: 'Faltan datos. Revisa el formulario.',
  red: 'No pudimos conectar con UCO Kudos. Revisa tu conexión e intenta de nuevo.',
  servidor: 'Algo salió mal en UCO Kudos. Intenta de nuevo en un momento.',
}

/** El mensaje que ve la persona para cada tipo de error. */
export function mensajeParaLaPersona(error: ErrorDeApi): string {
  return MENSAJES[error.tipo]
}
