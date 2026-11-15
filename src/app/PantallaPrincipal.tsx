import { useCallback, useState } from 'react'
import { useApi } from '../compartido/api/contextoDeApi'
import type { KudoDelMuro, PersonaDeLaSesion } from '../compartido/api/contrato'
import { mensajeParaLaPersona } from '../compartido/api/ErrorDeApi'
import { PanelFlotante } from '../compartido/PanelFlotante'
import { PantallaDeEstado } from '../compartido/PantallaDeEstado'
import { useConsulta } from '../compartido/useConsulta'
import { Muro } from '../funcionalidades/muro/Muro'
import { useMuro } from '../funcionalidades/muro/useMuro'
import { Cabecera } from '../funcionalidades/perfil/Cabecera'
import { FormularioDePublicacion } from '../funcionalidades/publicar/FormularioDePublicacion'
import { MENSAJE_PUBLICADO } from '../funcionalidades/publicar/mensajesDePublicacion'
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

/** La pantalla de todos los días: el muro, y el panel para publicar que abre el botón de la cabecera. */
function Inicio({ persona, alCerrarSesion }: { readonly persona: PersonaDeLaSesion; readonly alCerrarSesion: () => void }) {
  const muro = useMuro(useApi())
  const { agregarAlInicio } = muro
  const [panelAbierto, setPanelAbierto] = useState(false)
  const [avisoDePublicacion, setAvisoDePublicacion] = useState<string | undefined>()

  const abrirPanel = useCallback(() => {
    setAvisoDePublicacion(undefined)
    setPanelAbierto(true)
  }, [])

  const cerrarPanel = useCallback(() => setPanelAbierto(false), [])

  const alPublicar = useCallback(
    (kudo: KudoDelMuro) => {
      agregarAlInicio(kudo)
      setPanelAbierto(false)
      setAvisoDePublicacion(MENSAJE_PUBLICADO)
    },
    [agregarAlInicio],
  )

  return (
    <>
      <Cabecera persona={persona} alDarUnKudo={abrirPanel} alCerrarSesion={alCerrarSesion} />
      <main className={estilos.contenido}>
        {avisoDePublicacion && (
          <output className={`vidrio-ligero ${estilos.exito}`}>{avisoDePublicacion}</output>
        )}
        <Muro muro={muro} />
      </main>
      <PanelFlotante abierto={panelAbierto} titulo="Da un Kudo" alCerrar={cerrarPanel}>
        <FormularioDePublicacion persona={persona} alPublicar={alPublicar} />
      </PanelFlotante>
    </>
  )
}
