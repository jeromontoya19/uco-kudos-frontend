import { ProveedorDeApi } from '../compartido/api/ProveedorDeApi'
import { configuracion } from '../compartido/configuracion'
import { PantallaDeEstado } from '../compartido/PantallaDeEstado'
import { VERSION_DE_LA_APP } from '../compartido/version'
import { PantallaBienvenida } from '../funcionalidades/bienvenida/PantallaBienvenida'
import { AvisoDeInstalacion } from '../funcionalidades/instalacion/AvisoDeInstalacion'
import { ProveedorDeSesion } from '../funcionalidades/sesion/ProveedorDeSesion'
import { useSesion } from '../funcionalidades/sesion/useSesion'
import { PantallaPrincipal } from './PantallaPrincipal'

// Raíz de la aplicación: arma la sesión y, con ella, la API. Las funcionalidades no se importan entre sí.
export function App() {
  return (
    <ProveedorDeSesion>
      <PantallaSegunLaSesion />
    </ProveedorDeSesion>
  )
}

function PantallaSegunLaSesion() {
  const sesion = useSesion()
  const iniciarSesion = () => void sesion.iniciarSesion()
  const cerrarSesion = () => void sesion.cerrarSesion()

  if (sesion.estado === 'cargando') {
    return <PantallaDeEstado titulo="Cargando UCO Kudos…" ocupada />
  }

  if (sesion.estado === 'anonima') {
    return (
      <PantallaBienvenida version={VERSION_DE_LA_APP}>
        {sesion.falloAlIniciar && (
          <p className="aviso-de-error" role="alert">
            No se pudo iniciar sesión. Intenta de nuevo.
          </p>
        )}
        <button type="button" className="boton" onClick={iniciarSesion}>
          Iniciar sesión
        </button>
        <AvisoDeInstalacion />
      </PantallaBienvenida>
    )
  }

  return (
    <ProveedorDeApi urlBase={configuracion.urlDeLaApi} obtenerToken={sesion.obtenerToken}>
      <PantallaPrincipal alIniciarSesion={iniciarSesion} alCerrarSesion={cerrarSesion} />
    </ProveedorDeApi>
  )
}
