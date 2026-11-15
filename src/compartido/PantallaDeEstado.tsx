import type { ReactNode } from 'react'
import estilos from './PantallaDeEstado.module.css'

interface PropiedadesPantallaDeEstado {
  readonly titulo: string
  readonly detalle?: string
  /** Mientras algo carga: lo anuncia a los lectores de pantalla. */
  readonly ocupada?: boolean
  /** Las acciones posibles, por ejemplo «Reintentar» o «Cerrar sesión». */
  readonly children?: ReactNode
}

/** Una pantalla completa para esperar o explicar por qué no se puede seguir. */
export function PantallaDeEstado({ titulo, detalle, ocupada = false, children }: PropiedadesPantallaDeEstado) {
  return (
    <main className={estilos.pantalla} aria-busy={ocupada}>
      <img className={estilos.logo} src="/logo.svg" alt="" width={72} height={72} />
      <h1 className={estilos.titulo}>{titulo}</h1>
      {detalle && <p className={estilos.detalle}>{detalle}</p>}
      {children && <div className={estilos.acciones}>{children}</div>}
    </main>
  )
}
