import type { PersonaDeLaSesion } from '../../compartido/api/contrato'
import estilos from './Cabecera.module.css'
import { nombreDelRol } from './roles'

interface PropiedadesCabecera {
  readonly persona: PersonaDeLaSesion
  /** Abre el panel para publicar. El botón queda siempre a la vista, porque la cabecera es fija. */
  readonly alDarUnKudo: () => void
  readonly alCerrarSesion: () => void
}

export function Cabecera({ persona, alDarUnKudo, alCerrarSesion }: PropiedadesCabecera) {
  return (
    <header className={`vidrio ${estilos.cabecera}`}>
      <img className={estilos.logo} src="/logo.svg" alt="" width={40} height={40} />
      <div className={estilos.persona}>
        <p className={estilos.nombre}>{persona.nombre}</p>
        <p className={estilos.rol}>{nombreDelRol(persona.rol)}</p>
      </div>
      <button type="button" className={`boton boton-acento ${estilos.publicar}`} onClick={alDarUnKudo}>
        <span aria-hidden="true">★ </span>Dar un Kudo
      </button>
      <button type="button" className={`boton boton-secundario ${estilos.salir}`} onClick={alCerrarSesion}>
        Cerrar sesión
      </button>
    </header>
  )
}
