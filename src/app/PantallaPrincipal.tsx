import { useCallback } from 'react'
import { useApi } from '../compartido/api/contextoDeApi'
import type { PersonaDeLaSesion } from '../compartido/api/contrato'
import { mensajeParaLaPersona } from '../compartido/api/ErrorDeApi'
import { PantallaDeEstado } from '../compartido/PantallaDeEstado'
import { useConsulta } from '../compartido/useConsulta'
import { Muro } from '../funcionalidades/muro/Muro'
import { useMuro } from '../funcionalidades/muro/useMuro'
import { Cabecera } from '../funcionalidades/perfil/Cabecera'
import { FormularioDePublicacion } from '../funcionalidades/publicar/FormularioDePublicacion'
import estilos from './PantallaPrincipal.module.css'

interface AccionesDeSesion {
  readonly alIniciarSesion: () => void
  readonly alCerrarSesion: () => void
}

/** Con la sesión iniciada: primero averigua quién es la persona (GET /api/yo). */
export function PantallaPrincipal({ alIniciarSesion, alCerrarSesion }: AccionesDeSesion) {
  const api = useApi()
  const consultarYo = useCallback(() => api.yo(), [api])
  const { estado, reintentar } = useConsulta(consultarYo)

  if (estado.tipo === 'cargando') {
    return <PantallaDeEstado titulo="Cargando tu cuenta…" ocupada />
  }

  if (estado.tipo === 'lista') {
    return <Inicio persona={estado.valor} alCerrarSesion={alCerrarSesion} />
  }

  switch (estado.error.tipo) {
    case 'no-habilitada':
      return (
        <PantallaDeEstado
          titulo="Tu cuenta aún no está habilitada"
          detalle="Iniciaste sesión, pero tu cuenta todavía no está vinculada a una persona de UCO Kudos. Pide que la habiliten y vuelve a entrar."
        >
          <button type="button" className="boton" onClick={alCerrarSesion}>
            Cerrar sesión
          </button>
        </PantallaDeEstado>
      )
    case 'sin-sesion':
      return (
        <PantallaDeEstado titulo="Tu sesión terminó" detalle="Vuelve a iniciar sesión para seguir.">
          <button type="button" className="boton" onClick={alIniciarSesion}>
            Iniciar sesión
          </button>
        </PantallaDeEstado>
      )
    default:
      return (
        <PantallaDeEstado titulo="No pudimos cargar tu cuenta" detalle={mensajeParaLaPersona(estado.error)}>
          <button type="button" className="boton" onClick={reintentar}>
            Reintentar
          </button>
        </PantallaDeEstado>
      )
  }
}

/** La pantalla de todos los días: publicar arriba y el muro debajo. */
function Inicio({ persona, alCerrarSesion }: { readonly persona: PersonaDeLaSesion; readonly alCerrarSesion: () => void }) {
  const muro = useMuro(useApi())
  return (
    <>
      <Cabecera persona={persona} alCerrarSesion={alCerrarSesion} />
      <main className={estilos.contenido}>
        <FormularioDePublicacion persona={persona} alPublicar={muro.agregarAlInicio} />
        <Muro muro={muro} />
      </main>
    </>
  )
}
