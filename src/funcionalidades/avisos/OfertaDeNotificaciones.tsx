import { useState } from 'react'
import { pedirPermisoDeNotificaciones, sePuedenOfrecerNotificaciones } from './notificaciones'
import estilos from './OfertaDeNotificaciones.module.css'

/** Ofrece, una sola vez, los avisos del sistema mientras la app está en segundo plano. */
export function OfertaDeNotificaciones() {
  const [visible, setVisible] = useState(sePuedenOfrecerNotificaciones)

  if (!visible) {
    return null
  }

  const activar = async () => {
    await pedirPermisoDeNotificaciones()
    setVisible(false)
  }

  return (
    <section className={`vidrio-ligero ${estilos.oferta}`} aria-label="Avisos del sistema">
      <p className={estilos.texto}>¿Te avisamos con una notificación cuando te den un Kudo y la app esté en segundo plano?</p>
      <div className={estilos.acciones}>
        <button type="button" className="boton boton-secundario" onClick={() => void activar()}>
          Activar avisos
        </button>
        <button type="button" className={estilos.ahoraNo} onClick={() => setVisible(false)}>
          Ahora no
        </button>
      </div>
    </section>
  )
}
