import type { ReactNode } from 'react'
import estilos from './PantallaBienvenida.module.css'

interface FuncionProxima {
  readonly titulo: string
  readonly detalle: string
}

const FUNCIONES_PROXIMAS: readonly FuncionProxima[] = [
  {
    titulo: 'Da un Kudo',
    detalle: 'Reconoce a un compañero, docente o colaborador en una sola pantalla.',
  },
  {
    titulo: 'Mira el muro',
    detalle: 'Encuentra los reconocimientos de toda la comunidad UCO.',
  },
  {
    titulo: 'Recibe avisos',
    detalle: 'Entérate por correo o por WhatsApp cuando alguien te reconozca.',
  },
]

interface PropiedadesPantallaBienvenida {
  /** Versión corta del commit desplegado, o «local». */
  readonly version: string
  /** Lo que va en la zona de acciones; hoy, el aviso para instalar la PWA. */
  readonly children?: ReactNode
}

export function PantallaBienvenida({ version, children }: PropiedadesPantallaBienvenida) {
  return (
    <main className={estilos.pantalla}>
      <header className={estilos.encabezado}>
        <img className={estilos.logo} src="/logo.svg" alt="" width={96} height={96} />
        <h1 className={estilos.titulo}>UCO Kudos</h1>
        <p className={estilos.lema}>Reconoce a quienes hacen grande a la UCO.</p>
      </header>

      <section className={estilos.tarjeta} aria-labelledby="titulo-proximamente">
        <h2 id="titulo-proximamente" className={estilos.subtitulo}>
          Muy pronto podrás
        </h2>
        <ul className={estilos.lista}>
          {FUNCIONES_PROXIMAS.map(({ titulo, detalle }) => (
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
