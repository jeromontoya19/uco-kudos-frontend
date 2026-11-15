/** Un evento del formato text/event-stream (Server-Sent Events). */
export interface EventoSse {
  /** El campo «event»; si no viene, «message», como en el estándar. */
  readonly tipo: string
  /** Las líneas «data», unidas con saltos de línea. */
  readonly datos: string
}

const TIPO_POR_DEFECTO = 'message'

/**
 * Lee un flujo SSE que llega por trozos. Un trozo puede cortar una línea, o incluso un «\r\n», por la
 * mitad: lo incompleto se guarda hasta el trozo siguiente. Los comentarios (líneas que empiezan con «:»,
 * como el latido del servidor) se ignoran, y también «id» y «retry»: la reconexión la maneja abrirFlujoSse.
 */
export function crearLectorSse(alEvento: (evento: EventoSse) => void): (trozo: string) => void {
  let pendiente = ''
  let tipo = ''
  let datos: string[] = []

  function despachar() {
    if (datos.length > 0) {
      alEvento({ tipo: tipo === '' ? TIPO_POR_DEFECTO : tipo, datos: datos.join('\n') })
    }
    tipo = ''
    datos = []
  }

  function procesarLinea(linea: string) {
    if (linea === '') {
      despachar()
      return
    }
    if (linea.startsWith(':')) {
      return
    }
    const separador = linea.indexOf(':')
    const campo = separador === -1 ? linea : linea.slice(0, separador)
    const valorCrudo = separador === -1 ? '' : linea.slice(separador + 1)
    const valor = valorCrudo.startsWith(' ') ? valorCrudo.slice(1) : valorCrudo
    if (campo === 'event') {
      tipo = valor
    } else if (campo === 'data') {
      datos.push(valor)
    }
  }

  return (trozo) => {
    pendiente += trozo
    // Un «\r» al final puede ser la mitad de un «\r\n»: se corta solo si ya viene algo después.
    const lineas = pendiente.split(/\r\n|\r(?!$)|\n/)
    pendiente = lineas.pop() ?? ''
    lineas.forEach(procesarLinea)
  }
}
