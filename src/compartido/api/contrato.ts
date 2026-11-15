// El contrato de la API de UCO Kudos, tal como lo responde el back.

export type Rol =
  | 'ADMINISTRADOR'
  | 'RECTOR'
  | 'COORDINADOR_ACADEMICO'
  | 'COORDINADOR_FACULTAD'
  | 'COORDINADOR_PROGRAMA'
  | 'DOCENTE'
  | 'ESTUDIANTE'

/** GET /api/yo */
export interface PersonaDeLaSesion {
  readonly id: string
  readonly nombre: string
  readonly rol: Rol
}

/** GET /api/personas: nunca trae correo ni celular (D-16). */
export interface Persona {
  readonly id: string
  readonly nombre: string
}

/** GET /api/categorias */
export interface Categoria {
  readonly id: string
  readonly nombre: string
}

/** GET /api/kudos: un Kudo del muro. `publicadoEn` viene en ISO-8601, en UTC. */
export interface KudoDelMuro {
  readonly id: string
  readonly autor: Persona
  readonly destinatario: Persona
  readonly categoria: string
  readonly contenido: string
  readonly publicadoEn: string
}

/** POST /api/kudos: el autor sale del token, nunca del cuerpo. */
export interface SolicitudDePublicacion {
  readonly destinatario: string
  readonly categoria: string
  readonly contenido: string
}

/** Respuesta 201 de POST /api/kudos. */
export interface KudoPublicado {
  readonly id: string
  readonly publicadoEn: string
}

/** Los motivos con los que la API rechaza una publicación (422). */
export type MotivoDeRechazo =
  | 'AUTOR_ES_DESTINATARIO'
  | 'CONTENIDO_VACIO'
  | 'AUTOR_NO_DISPONIBLE'
  | 'DESTINATARIO_NO_DISPONIBLE'
  | 'CATEGORIA_NO_DISPONIBLE'

/** Evento `kudo-recibido` de GET /api/avisos/en-vivo: alguien le dio un Kudo a la persona de la sesión. */
export interface AvisoDeKudoRecibido {
  readonly kudo: string
  readonly autor: string
  readonly categoria: string
}

/** El puerto con el que el front habla con la API; las pruebas lo reemplazan por uno falso. */
export interface ApiDeUcoKudos {
  yo(): Promise<PersonaDeLaSesion>
  personas(): Promise<readonly Persona[]>
  categorias(): Promise<readonly Categoria[]>
  muro(pagina: number, tamano: number): Promise<readonly KudoDelMuro[]>
  publicar(solicitud: SolicitudDePublicacion): Promise<KudoPublicado>
  /** Escucha los avisos en vivo mientras la app está abierta (ADR-021). Devuelve la función que deja de escuchar. */
  avisosEnVivo(alAviso: (aviso: AvisoDeKudoRecibido) => void): () => void
}
