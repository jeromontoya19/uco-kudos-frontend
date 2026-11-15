import { useCallback, useState, type FormEvent } from 'react'
import { useApi } from '../../compartido/api/contextoDeApi'
import type { Categoria, KudoDelMuro, KudoPublicado, Persona, PersonaDeLaSesion } from '../../compartido/api/contrato'
import { comoErrorDeApi, mensajeParaLaPersona } from '../../compartido/api/ErrorDeApi'
import { useConsulta } from '../../compartido/useConsulta'
import estilos from './FormularioDePublicacion.module.css'
import {
  MENSAJE_CONTENIDO_VACIO,
  MENSAJE_FALTAN_DATOS,
  MENSAJE_PUBLICADO,
  mensajeDelErrorAlPublicar,
} from './mensajesDePublicacion'

interface PropiedadesFormulario {
  /** Quien publica: se quita de los destinatarios y es el autor del Kudo nuevo. */
  readonly persona: PersonaDeLaSesion
  readonly alPublicar: (kudo: KudoDelMuro) => void
}

type Aviso = { readonly tipo: 'exito' | 'error'; readonly texto: string }

/** La API responde solo el id y la fecha; el resto del Kudo ya lo tiene el formulario. */
function kudoDelMuro(
  publicado: KudoPublicado,
  autor: PersonaDeLaSesion,
  destinatario: Persona,
  categoria: Categoria,
  contenido: string,
): KudoDelMuro {
  return {
    id: publicado.id,
    autor: { id: autor.id, nombre: autor.nombre },
    destinatario,
    categoria: categoria.nombre,
    contenido,
    publicadoEn: publicado.publicadoEn,
  }
}

/** Publicar un Kudo en una sola pantalla (ESC-16): a quién, por qué categoría y el mensaje. */
export function FormularioDePublicacion({ persona, alPublicar }: PropiedadesFormulario) {
  const api = useApi()
  const consultarOpciones = useCallback(() => Promise.all([api.personas(), api.categorias()]), [api])
  const { estado, reintentar } = useConsulta(consultarOpciones)

  const [destinatarioElegido, setDestinatarioElegido] = useState('')
  const [categoriaElegida, setCategoriaElegida] = useState('')
  const [contenido, setContenido] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState<Aviso | undefined>()

  if (estado.tipo === 'cargando') {
    return (
      <section className={estilos.tarjeta} aria-busy="true">
        <p className={estilos.nota}>Preparando el formulario…</p>
      </section>
    )
  }

  if (estado.tipo === 'fallida') {
    return (
      <section className={estilos.tarjeta}>
        <p className={estilos.error} role="alert">
          {mensajeParaLaPersona(estado.error)}
        </p>
        <button type="button" className="boton boton-secundario" onClick={reintentar}>
          Reintentar
        </button>
      </section>
    )
  }

  const [personas, categorias] = estado.valor
  const destinatarios = personas.filter((otra) => otra.id !== persona.id)

  async function publicar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const destinatario = destinatarios.find((otra) => otra.id === destinatarioElegido)
    const categoria = categorias.find((una) => una.id === categoriaElegida)
    const texto = contenido.trim()
    if (!destinatario || !categoria) {
      setAviso({ tipo: 'error', texto: MENSAJE_FALTAN_DATOS })
      return
    }
    if (texto === '') {
      setAviso({ tipo: 'error', texto: MENSAJE_CONTENIDO_VACIO })
      return
    }

    setEnviando(true)
    setAviso(undefined)
    try {
      const publicado = await api.publicar({ destinatario: destinatario.id, categoria: categoria.id, contenido: texto })
      alPublicar(kudoDelMuro(publicado, persona, destinatario, categoria, texto))
      setDestinatarioElegido('')
      setCategoriaElegida('')
      setContenido('')
      setAviso({ tipo: 'exito', texto: MENSAJE_PUBLICADO })
    } catch (causa) {
      setAviso({ tipo: 'error', texto: mensajeDelErrorAlPublicar(comoErrorDeApi(causa)) })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className={estilos.tarjeta} aria-labelledby="titulo-publicar">
      <h2 id="titulo-publicar" className={estilos.titulo}>
        Da un Kudo
      </h2>
      <form className={estilos.formulario} onSubmit={(evento) => void publicar(evento)} noValidate>
        <label className={estilos.campo}>
          <span>¿A quién reconoces?</span>
          <select value={destinatarioElegido} onChange={(evento) => setDestinatarioElegido(evento.target.value)}>
            <option value="">Elige a una persona</option>
            {destinatarios.map((otra) => (
              <option key={otra.id} value={otra.id}>
                {otra.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className={estilos.campo}>
          <span>Categoría</span>
          <select value={categoriaElegida} onChange={(evento) => setCategoriaElegida(evento.target.value)}>
            <option value="">Elige una categoría</option>
            {categorias.map((una) => (
              <option key={una.id} value={una.id}>
                {una.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className={estilos.campo}>
          <span>Mensaje</span>
          <textarea
            value={contenido}
            onChange={(evento) => setContenido(evento.target.value)}
            rows={4}
            placeholder="Cuenta por qué merece este reconocimiento"
          />
        </label>

        {aviso && (
          <p
            className={aviso.tipo === 'exito' ? estilos.exito : estilos.error}
            role={aviso.tipo === 'exito' ? 'status' : 'alert'}
          >
            {aviso.texto}
          </p>
        )}

        <button type="submit" className="boton" disabled={enviando}>
          {enviando ? 'Publicando…' : 'Publicar Kudo'}
        </button>
      </form>
    </section>
  )
}
