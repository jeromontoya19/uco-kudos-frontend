import type { PersonaDeLaSesion } from '../../compartido/api/contrato'
import estilos from './Cabecera.module.css'
import { nombreDelRol } from './roles'

interface PropiedadesCabecera {
  readonly persona: PersonaDeLaSesion
  readonly alCerrarSesion: () => void
}

export function Cabecera({ persona, alCerrarSesion }: PropiedadesCabecera) {
  return (
    <header className={estilos.cabecera}>
      <img className={estilos.logo} src="/logo.svg" alt="" width={40} height={40} />
      <div className={estilos.persona}>
        <p className={estilos.nombre}>{persona.nombre}</p>
        <p className={estilos.rol}>{nombreDelRol(persona.rol)}</p>
      </div>
      <button type="button" className="boton boton-secundario" onClick={alCerrarSesion}>
        Cerrar sesión
      </button>
    </header>
  )
}
