/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Commit desplegado. Lo pone el CD al compilar; en local no existe. */
  readonly VITE_VERSION?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
