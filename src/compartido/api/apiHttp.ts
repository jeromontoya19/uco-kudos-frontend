import type { ClienteHttp } from './clienteHttp'
import type {
  ApiDeUcoKudos,
  AvisoDeKudoRecibido,
  Categoria,
  KudoDelMuro,
  KudoPublicado,
  Persona,
  PersonaDeLaSesion,
  SolicitudDePublicacion,
} from './contrato'

const EVENTO_KUDO_RECIBIDO = 'kudo-recibido'

/** Lee los datos de un evento `kudo-recibido`; si no traen lo esperado, el evento se ignora. */
function leerAviso(datos: string): AvisoDeKudoRecibido | undefined {
  let aviso: Partial<Record<keyof AvisoDeKudoRecibido, unknown>> | null
  try {
    aviso = JSON.parse(datos) as typeof aviso
  } catch {
    // Datos que no son JSON: no hay aviso que mostrar.
    return undefined
  }
  const kudo = aviso?.kudo
  const autor = aviso?.autor
  const categoria = aviso?.categoria
  if (typeof kudo === 'string' && typeof autor === 'string' && typeof categoria === 'string') {
    return { kudo, autor, categoria }
  }
  return undefined
}

/** El adaptador HTTP del puerto ApiDeUcoKudos: una ruta de la API por operación. */
export function crearApiHttp(cliente: ClienteHttp): ApiDeUcoKudos {
  return {
    yo: () => cliente.obtener<PersonaDeLaSesion>('/api/yo'),
    personas: () => cliente.obtener<Persona[]>('/api/personas'),
    categorias: () => cliente.obtener<Categoria[]>('/api/categorias'),
    muro: (pagina, tamano) => {
      const parametros = new URLSearchParams({ pagina: String(pagina), tamano: String(tamano) })
      return cliente.obtener<KudoDelMuro[]>(`/api/kudos?${parametros.toString()}`)
    },
    publicar: (solicitud: SolicitudDePublicacion) => cliente.enviar<KudoPublicado>('/api/kudos', solicitud),
    avisosEnVivo: (alAviso) =>
      cliente.escuchar('/api/avisos/en-vivo', (evento) => {
        if (evento.tipo !== EVENTO_KUDO_RECIBIDO) {
          return
        }
        const aviso = leerAviso(evento.datos)
        if (aviso) {
          alAviso(aviso)
        }
      }),
  }
}
