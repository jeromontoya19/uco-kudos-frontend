import { createContext, useContext } from 'react'
import type { ApiDeUcoKudos } from './contrato'

export const ContextoDeApi = createContext<ApiDeUcoKudos | undefined>(undefined)

/** La API para los componentes; la pone un ProveedorDeApi más arriba. */
export function useApi(): ApiDeUcoKudos {
  const api = useContext(ContextoDeApi)
  if (!api) {
    throw new Error('useApi necesita un ProveedorDeApi más arriba.')
  }
  return api
}
