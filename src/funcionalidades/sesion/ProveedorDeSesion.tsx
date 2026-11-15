import { Auth0Provider } from '@auth0/auth0-react'
import type { ReactNode } from 'react'
import { configuracion } from '../../compartido/configuracion'

/**
 * La sesión con Auth0 (ADR-007), con el flujo de código y PKCE de @auth0/auth0-react.
 *
 * Decisión: los tokens se guardan en localStorage (`cacheLocation="localstorage"`) y se renuevan con
 * refresh tokens rotativos.
 * - Por qué: la PWA se reabre desde el ícono como una recarga. Con los tokens solo en memoria, cada
 *   apertura obligaría a iniciar sesión otra vez, porque la renovación silenciosa por iframe depende de
 *   cookies de terceros que Safari y Chrome bloquean. Eso choca con ESC-16 (publicar en ≤ 60 s).
 * - Qué cuesta: un script inyectado (XSS) podría leer los tokens.
 * - Cómo se reduce: una CSP estricta, sin scripts en línea ni de otros orígenes
 *   (public/staticwebapp.config.json); React escapa el contenido de los Kudos, que se muestra solo como
 *   texto; el access token dura 15 min, y el refresh token rota y Auth0 lo revoca si se reutiliza.
 */
export function ProveedorDeSesion({ children }: { readonly children: ReactNode }) {
  return (
    <Auth0Provider
      domain={configuracion.auth0.dominio}
      clientId={configuracion.auth0.idDelCliente}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: configuracion.auth0.audiencia,
      }}
      useRefreshTokens
      cacheLocation="localstorage"
    >
      {children}
    </Auth0Provider>
  )
}
