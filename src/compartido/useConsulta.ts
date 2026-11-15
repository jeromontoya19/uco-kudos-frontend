import { useCallback, useEffect, useState } from 'react'
import { comoErrorDeApi, type ErrorDeApi } from './api/ErrorDeApi'

export type EstadoDeConsulta<T> =
  | { readonly tipo: 'cargando' }
  | { readonly tipo: 'lista'; readonly valor: T }
  | { readonly tipo: 'fallida'; readonly error: ErrorDeApi }

/**
 * Corre una consulta al montar el componente y cada vez que se pide reintentar.
 * `consultar` debe ser estable (useCallback); si cambia, la consulta vuelve a correr.
 */
export function useConsulta<T>(consultar: () => Promise<T>): {
  readonly estado: EstadoDeConsulta<T>
  readonly reintentar: () => void
} {
  const [estado, setEstado] = useState<EstadoDeConsulta<T>>({ tipo: 'cargando' })
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    // Si el componente desaparece o la consulta cambia antes de responder, la respuesta vieja se ignora.
    let vigente = true
    consultar().then(
      (valor) => {
        if (vigente) {
          setEstado({ tipo: 'lista', valor })
        }
      },
      (error: unknown) => {
        if (vigente) {
          setEstado({ tipo: 'fallida', error: comoErrorDeApi(error) })
        }
      },
    )
    return () => {
      vigente = false
    }
  }, [consultar, intento])

  const reintentar = useCallback(() => {
    setEstado({ tipo: 'cargando' })
    setIntento((anterior) => anterior + 1)
  }, [])

  return { estado, reintentar }
}
