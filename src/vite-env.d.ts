/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/vanillajs" />

interface ImportMetaEnv {
  /** Commit desplegado. Lo pone el CD al compilar; en local no existe. */
  readonly VITE_VERSION?: string
  /** URL de la API, si no es la de siempre (ver src/compartido/configuracion.ts). */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
