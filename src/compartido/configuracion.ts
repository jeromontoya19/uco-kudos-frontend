// Configuración del front. Nada de esto es secreto: el dominio, el Client ID y la audiencia de Auth0
// viajan en el JavaScript de cualquier SPA, y la URL de la API es pública.

/** La API en producción. vite.config.ts la usa también como destino del proxy local. */
const URL_DE_LA_API_EN_PRODUCCION = 'https://ucokudos-api.grayriver-ab7e245b.canadacentral.azurecontainerapps.io'

/**
 * - Con `VITE_API_URL`, se usa esa.
 * - En desarrollo (`npm run dev`), la URL vacía hace que el navegador llame a `/api` del mismo origen,
 *   y el proxy de Vite la reenvía a producción. Así no hace falta que la API acepte `localhost` en CORS.
 * - En la compilación para producción, la API de Azure.
 */
function urlDeLaApi(): string {
  const configurada = import.meta.env.VITE_API_URL
  if (configurada !== undefined) {
    return configurada
  }
  return import.meta.env.DEV ? '' : URL_DE_LA_API_EN_PRODUCCION
}

export const configuracion = {
  urlDeLaApi: urlDeLaApi(),
  auth0: {
    dominio: 'dev-efn6xnzpgyrvdd4v.us.auth0.com',
    idDelCliente: '9xQVVU891DCDz3apAQoRh66G8OSegGtQ',
    // Sin la audiencia, Auth0 entrega un token que la API no acepta.
    audiencia: 'https://api.ucokudos',
  },
} as const
