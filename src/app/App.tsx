import { VERSION_DE_LA_APP } from '../compartido/version'
import { PantallaBienvenida } from '../funcionalidades/bienvenida/PantallaBienvenida'
import { AvisoDeInstalacion } from '../funcionalidades/instalacion/AvisoDeInstalacion'

// Compone las funcionalidades: la bienvenida no sabe nada de la PWA; aquí se le entrega el aviso.
export function App() {
  return (
    <PantallaBienvenida version={VERSION_DE_LA_APP}>
      <AvisoDeInstalacion />
    </PantallaBienvenida>
  )
}
