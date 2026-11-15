const LARGO_DE_LA_VERSION_CORTA = 7
const VERSION_LOCAL = 'local'

/** Recorta el commit a 7 caracteres, como lo muestra GitHub. Sin commit, la versión es «local». */
export function versionCorta(commit: string | undefined): string {
  const limpio = commit?.trim() ?? ''
  return limpio === '' ? VERSION_LOCAL : limpio.slice(0, LARGO_DE_LA_VERSION_CORTA)
}

export const VERSION_DE_LA_APP = versionCorta(import.meta.env.VITE_VERSION)
