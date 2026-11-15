import type { KudoDelMuro } from '../../compartido/api/contrato'
import { formatearFecha } from '../../compartido/fechas'
import estilos from './Muro.module.css'

// El contenido se muestra como texto: React lo escapa, así que un Kudo no puede inyectar HTML.
export function TarjetaDeKudo({ kudo }: { readonly kudo: KudoDelMuro }) {
  return (
    <article className={estilos.tarjeta}>
      <p className={estilos.quien}>
        <strong>{kudo.autor.nombre}</strong> reconoció a <strong>{kudo.destinatario.nombre}</strong>
      </p>
      <p className={estilos.categoria}>{kudo.categoria}</p>
      <p className={estilos.contenido}>{kudo.contenido}</p>
      <time className={estilos.fecha} dateTime={kudo.publicadoEn}>
        {formatearFecha(kudo.publicadoEn)}
      </time>
    </article>
  )
}
