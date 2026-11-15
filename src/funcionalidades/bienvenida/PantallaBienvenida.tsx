import type { ReactNode } from 'react'
import estilos from './PantallaBienvenida.module.css'

interface Funcion {
  readonly titulo: string
  readonly detalle: string
}

const FUNCIONES: readonly Funcion[] = [
  {
    titulo: 'Da un Kudo',
    detalle: 'Reconoce a un compañero, docente o colaborador en una sola pantalla.',
  },
  {
    titulo: 'Mira el muro',
    detalle: 'Encuentra los reconocimientos de toda la comunidad UCO.',
  },
  {
    titulo: 'Llévala en tu celular',
    detalle: 'Instálala y ábrela desde su ícono, como cualquier aplicación.',
  },
]

interface PropiedadesPantallaBienvenida {
  /** Versión corta del commit desplegado, o «local». */
  readonly version: string
  /** Lo que va en la zona de acciones: iniciar sesión y el aviso para instalar la PWA. */
  readonly children?: ReactNode
}

export function PantallaBienvenida({ version, children }: PropiedadesPantallaBienvenida) {
  return (
    <main className={estilos.pantalla}>
      <header className={estilos.encabezado}>
        <img className={estilos.logo} src="/logo.svg" alt="" width={96} height={96} />
        <h1 className={estilos.titulo}>
          UCO <span className="resaltado">Kudos</span>
        </h1>
        <p className={estilos.lema}>Reconoce a quienes hacen grande a la UCO.</p>
      </header>

      <section className={`vidrio ${estilos.tarjeta}`} aria-labelledby="titulo-funciones">
        <h2 id="titulo-funciones" className={estilos.subtitulo}>
          Con UCO Kudos puedes
        </h2>
        <ul className={estilos.lista}>
          {FUNCIONES.map(({ titulo, detalle }) => (
            <li key={titulo} className={estilos.elemento}>
              <strong>{titulo}</strong>
              <span>{detalle}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className={estilos.acciones}>{children}</div>

      <footer className={estilos.pie}>
        <p>Proyecto integrador de Ingeniería del Software II</p>
        <p>Versión {version}</p>
      </footer>
    </main>
  )
}
