import estilos from './AvisoDeInstalacion.module.css'
import { useInstalacionPwa } from './useInstalacionPwa'

export function AvisoDeInstalacion() {
  const { estado, instalar } = useInstalacionPwa()

  if (estado === 'instalada') {
    return null
  }

  if (estado === 'disponible') {
    return (
      <button type="button" className="boton" onClick={() => void instalar()}>
        Instalar UCO Kudos
      </button>
    )
  }

  return (
    <p className={`vidrio-ligero ${estilos.pista}`}>
      Para tenerla en tu celular, abre el menú del navegador y elige «Instalar aplicación» o
      «Agregar a la pantalla de inicio». En iPhone, usa el botón Compartir de Safari.
    </p>
  )
}
