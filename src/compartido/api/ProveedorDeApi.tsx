import { useMemo, type ReactNode } from 'react'
import { crearApiHttp } from './apiHttp'
import { crearClienteHttp, type ObtenerToken } from './clienteHttp'
import { ContextoDeApi } from './contextoDeApi'
import type { ApiDeUcoKudos } from './contrato'

interface PropiedadesProveedorDeApi {
  readonly urlBase: string
  readonly obtenerToken: ObtenerToken
  readonly children: ReactNode
}

/** Crea la API real, con el token de la sesión, para los componentes de adentro. */
export function ProveedorDeApi({ urlBase, obtenerToken, children }: PropiedadesProveedorDeApi) {
  const api = useMemo(() => crearApiHttp(crearClienteHttp({ urlBase, obtenerToken })), [urlBase, obtenerToken])
  return <ContextoDeApi.Provider value={api}>{children}</ContextoDeApi.Provider>
}

/** Para las pruebas: entrega una API falsa a los componentes de adentro. */
export function ProveedorDeApiFija({ api, children }: { readonly api: ApiDeUcoKudos; readonly children: ReactNode }) {
  return <ContextoDeApi.Provider value={api}>{children}</ContextoDeApi.Provider>
}
