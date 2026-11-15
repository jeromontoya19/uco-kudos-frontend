import { useEffect, useEffectEvent } from 'react'
import type { ApiDeUcoKudos, AvisoDeKudoRecibido } from '../../compartido/api/contrato'

/**
 * Escucha los avisos en vivo mientras el componente está montado, es decir, mientras hay sesión, y deja
 * de escuchar al desmontarse (al cerrar sesión). Cambiar `alAviso` no abre una conexión nueva.
 */
export function useAvisosEnVivo(api: ApiDeUcoKudos, alAviso: (aviso: AvisoDeKudoRecibido) => void): void {
  const recibir = useEffectEvent(alAviso)
  useEffect(() => api.avisosEnVivo((aviso) => recibir(aviso)), [api])
}

/** El texto del aviso, el mismo en la pantalla y en la notificación del sistema. */
export function textoDelAviso({ autor, categoria }: AvisoDeKudoRecibido): string {
  return `${autor} te dio un Kudo de ${categoria}`
}
