import { useCallback, useEffect, useState } from 'react'
import type { ApiDeUcoKudos, KudoDelMuro } from '../../compartido/api/contrato'
import { comoErrorDeApi, type ErrorDeApi } from '../../compartido/api/ErrorDeApi'

/** Kudos por página; la API acepta hasta 50. */
export const TAMANO_DE_PAGINA = 20

export interface EstadoDelMuro {
  readonly kudos: readonly KudoDelMuro[]
  readonly cargando: boolean
  /** Falso cuando una página llegó incompleta: ya no hay más Kudos que pedir. */
  readonly hayMas: boolean
  readonly error: ErrorDeApi | undefined
  /** Pide la página siguiente; si la anterior falló, la vuelve a pedir. */
  readonly cargarMas: () => void
  /** Pone arriba un Kudo recién publicado, sin volver a pedir el muro. */
  readonly agregarAlInicio: (kudo: KudoDelMuro) => void
}

/**
 * Las páginas se piden por posición, así que un Kudo publicado después de cargar la primera corre los
 * demás un lugar: la página siguiente puede repetir uno que ya se muestra. Por eso se une sin repetir.
 */
function unirSinRepetir(actuales: readonly KudoDelMuro[], nuevos: readonly KudoDelMuro[]): readonly KudoDelMuro[] {
  const yaMostrados = new Set(actuales.map((kudo) => kudo.id))
  return [...actuales, ...nuevos.filter((kudo) => !yaMostrados.has(kudo.id))]
}

export function useMuro(api: ApiDeUcoKudos): EstadoDelMuro {
  const [kudos, setKudos] = useState<readonly KudoDelMuro[]>([])
  const [siguientePagina, setSiguientePagina] = useState(0)
  const [hayMas, setHayMas] = useState(true)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<ErrorDeApi | undefined>()

  const recibirPagina = useCallback((pagina: number, nuevos: readonly KudoDelMuro[]) => {
    setKudos((actuales) => unirSinRepetir(actuales, nuevos))
    setSiguientePagina(pagina + 1)
    setHayMas(nuevos.length === TAMANO_DE_PAGINA)
    setCargando(false)
  }, [])

  const recibirError = useCallback((causa: unknown) => {
    setError(comoErrorDeApi(causa))
    setCargando(false)
  }, [])

  // La primera página. El estado inicial ya dice que está cargando; si el componente desaparece antes
  // de la respuesta, esta se ignora.
  useEffect(() => {
    let vigente = true
    api.muro(0, TAMANO_DE_PAGINA).then(
      (nuevos) => {
        if (vigente) {
          recibirPagina(0, nuevos)
        }
      },
      (causa: unknown) => {
        if (vigente) {
          recibirError(causa)
        }
      },
    )
    return () => {
      vigente = false
    }
  }, [api, recibirPagina, recibirError])

  const cargarMas = useCallback(() => {
    setCargando(true)
    setError(undefined)
    api.muro(siguientePagina, TAMANO_DE_PAGINA).then((nuevos) => recibirPagina(siguientePagina, nuevos), recibirError)
  }, [api, siguientePagina, recibirPagina, recibirError])

  const agregarAlInicio = useCallback((kudo: KudoDelMuro) => {
    setKudos((actuales) => [kudo, ...actuales.filter((actual) => actual.id !== kudo.id)])
  }, [])

  return { kudos, cargando, hayMas, error, cargarMas, agregarAlInicio }
}
