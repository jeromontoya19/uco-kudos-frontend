import { mensajeParaLaPersona } from '../../compartido/api/ErrorDeApi'
import estilos from './Muro.module.css'
import { TarjetaDeKudo } from './TarjetaDeKudo'
import type { EstadoDelMuro } from './useMuro'

export function Muro({ muro }: { readonly muro: EstadoDelMuro }) {
  const { kudos, cargando, hayMas, error, cargarMas } = muro
  const primeraCarga = cargando && kudos.length === 0
  const vacio = !cargando && !error && kudos.length === 0

  return (
    <section className={estilos.muro} aria-labelledby="titulo-del-muro" aria-busy={cargando}>
      <h2 id="titulo-del-muro" className={estilos.titulo}>
        Muro
      </h2>

      {primeraCarga && <p className={estilos.nota}>Cargando el muro…</p>}
      {vacio && <p className={estilos.nota}>Todavía no hay Kudos. ¡Publica el primero!</p>}

      {kudos.length > 0 && (
        <ul className={estilos.lista}>
          {kudos.map((kudo) => (
            <li key={kudo.id}>
              <TarjetaDeKudo kudo={kudo} />
            </li>
          ))}
        </ul>
      )}

      {error && (
        <div className={estilos.error} role="alert">
          <p>{mensajeParaLaPersona(error)}</p>
          <button type="button" className="boton boton-secundario" onClick={cargarMas}>
            Reintentar
          </button>
        </div>
      )}

      {!error && hayMas && kudos.length > 0 && (
        <button type="button" className="boton boton-secundario" onClick={cargarMas} disabled={cargando}>
          {cargando ? 'Cargando…' : 'Ver más'}
        </button>
      )}
    </section>
  )
}
