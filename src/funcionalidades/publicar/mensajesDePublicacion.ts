import type { MotivoDeRechazo } from '../../compartido/api/contrato'
import { mensajeParaLaPersona, type ErrorDeApi } from '../../compartido/api/ErrorDeApi'

export const MENSAJE_FALTAN_DATOS = 'Elige a quién reconoces y la categoría.'
export const MENSAJE_CONTENIDO_VACIO = 'Escribe un mensaje para tu Kudo.'
export const MENSAJE_PUBLICADO = '¡Listo! Tu Kudo ya está en el muro.'

const MENSAJES_POR_MOTIVO: Readonly<Record<MotivoDeRechazo, string>> = {
  AUTOR_ES_DESTINATARIO: 'Un Kudo es para otra persona: no puedes dártelo tú. Elige a quién reconoces.',
  CONTENIDO_VACIO: MENSAJE_CONTENIDO_VACIO,
  AUTOR_NO_DISPONIBLE: 'Tu cuenta no está activa, así que no puedes publicar.',
  DESTINATARIO_NO_DISPONIBLE: 'Esa persona ya no está disponible. Elige a otra.',
  CATEGORIA_NO_DISPONIBLE: 'Esa categoría ya no está disponible. Elige otra.',
}

const MENSAJE_RECHAZO_DESCONOCIDO = 'No se pudo publicar el Kudo. Revisa los datos e intenta de nuevo.'

/** El mensaje para la persona cuando no se pudo publicar: uno claro por cada motivo de la API. */
export function mensajeDelErrorAlPublicar(error: ErrorDeApi): string {
  if (error.tipo !== 'rechazo') {
    return mensajeParaLaPersona(error)
  }
  return MENSAJES_POR_MOTIVO[error.motivo as MotivoDeRechazo] ?? MENSAJE_RECHAZO_DESCONOCIDO
}
