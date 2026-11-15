import { useEffect } from 'react'
import estilos from './AvisoFlotante.module.css'

export interface AvisoEnPantalla {
  readonly id: string
  readonly texto: string
}

/** Cuánto se ve el aviso si nadie lo cierra. */
export const DURACION_DEL_AVISO_MS = 8_000

interface PropiedadesAvisoFlotante {
  readonly aviso: AvisoEnPantalla | undefined
  readonly alCerrar: () => void
}

/**
 * El aviso de un Kudo recibido, flotando abajo de la pantalla. La región «aria-live» está siempre en la
 * página, así los lectores de pantalla anuncian cada aviso nuevo.
 */
export function AvisoFlotante({ aviso, alCerrar }: PropiedadesAvisoFlotante) {
  useEffect(() => {
    if (!aviso) {
      return
    }
    const temporizador = setTimeout(alCerrar, DURACION_DEL_AVISO_MS)
    return () => clearTimeout(temporizador)
  }, [aviso, alCerrar])

  return (
    <div className={estilos.region} aria-live="polite" aria-atomic="true">
      {aviso && (
        <div className={`vidrio ${estilos.aviso}`}>
          <span className={estilos.icono} aria-hidden="true">
            ★
          </span>
          <p className={estilos.texto}>{aviso.texto}</p>
          <button type="button" className={estilos.cerrar} aria-label="Cerrar aviso" onClick={alCerrar}>
            ×
          </button>
        </div>
      )}
    </div>
  )
}
