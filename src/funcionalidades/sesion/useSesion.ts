import { useAuth0 } from '@auth0/auth0-react'
import { useCallback } from 'react'
import type { ObtenerToken } from '../../compartido/api/clienteHttp'
import { ErrorDeApi } from '../../compartido/api/ErrorDeApi'

export type EstadoDeSesion = 'cargando' | 'anonima' | 'iniciada'

/** Lo que el resto del front sabe de la sesión. Solo este archivo conoce a Auth0. */
export interface Sesion {
  readonly estado: EstadoDeSesion
  /** Auth0 devolvió un error al volver del inicio de sesión (por ejemplo, la persona canceló). */
  readonly falloAlIniciar: boolean
  readonly iniciarSesion: () => Promise<void>
  readonly cerrarSesion: () => Promise<void>
  readonly obtenerToken: ObtenerToken
}

function estadoDe(cargando: boolean, autenticada: boolean): EstadoDeSesion {
  if (cargando) {
    return 'cargando'
  }
  return autenticada ? 'iniciada' : 'anonima'
}

export function useSesion(): Sesion {
  const { isLoading, isAuthenticated, error, loginWithRedirect, logout, getAccessTokenSilently } = useAuth0()

  const obtenerToken = useCallback(async () => {
    let token: string | undefined
    try {
      token = await getAccessTokenSilently()
    } catch (causa) {
      // Sin refresh token vigente, o Auth0 no responde: hay que volver a iniciar sesión.
      throw new ErrorDeApi('sin-sesion', 'No se pudo obtener el access token.', { causa })
    }
    if (!token) {
      throw new ErrorDeApi('sin-sesion', 'Auth0 no entregó un access token.')
    }
    return token
  }, [getAccessTokenSilently])

  const iniciarSesion = useCallback(() => loginWithRedirect(), [loginWithRedirect])

  const cerrarSesion = useCallback(
    () => logout({ logoutParams: { returnTo: window.location.origin } }),
    [logout],
  )

  return {
    estado: estadoDe(isLoading, isAuthenticated),
    falloAlIniciar: error !== undefined,
    iniciarSesion,
    cerrarSesion,
    obtenerToken,
  }
}
