import { useEffect, useId, useRef, type ReactNode } from 'react'
import estilos from './PanelFlotante.module.css'

interface PropiedadesPanelFlotante {
  readonly abierto: boolean
  readonly titulo: string
  readonly alCerrar: () => void
  readonly children: ReactNode
}

/**
 * Un panel que flota sobre la página. Usa el <dialog> nativo en modo modal: el navegador mueve el foco
 * adentro, lo encierra ahí y lo cierra con Esc o con el gesto de «atrás» de Android. También se cierra
 * con la ✕. El contenido sigue montado cuando se cierra, así que un borrador a medio escribir no se pierde.
 */
export function PanelFlotante({ abierto, titulo, alCerrar, children }: PropiedadesPanelFlotante) {
  const referencia = useRef<HTMLDialogElement>(null)
  const idDelTitulo = useId()

  useEffect(() => {
    const dialogo = referencia.current
    if (!dialogo) {
      return
    }
    if (abierto && !dialogo.open) {
      dialogo.showModal()
    } else if (!abierto && dialogo.open) {
      dialogo.close()
    }
  }, [abierto])

  return (
    <dialog ref={referencia} className={`vidrio ${estilos.panel}`} aria-labelledby={idDelTitulo} onClose={alCerrar}>
      <div className={estilos.interior}>
        <div className={estilos.encabezado}>
          <h2 id={idDelTitulo} className={estilos.titulo}>
            {titulo}
          </h2>
          <button type="button" className={estilos.cerrar} aria-label="Cerrar" onClick={alCerrar}>
            ×
          </button>
        </div>
        {children}
      </div>
    </dialog>
  )
}
