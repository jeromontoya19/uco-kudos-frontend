import type { ClienteHttp } from './clienteHttp'
import type {
  ApiDeUcoKudos,
  Categoria,
  KudoDelMuro,
  KudoPublicado,
  Persona,
  PersonaDeLaSesion,
  SolicitudDePublicacion,
} from './contrato'

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
  }
}
