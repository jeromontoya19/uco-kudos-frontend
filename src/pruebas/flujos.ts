/** Una respuesta SSE que entrega estos trozos y después se cierra, como hace el servidor a los 30 min. */
export function respuestaSse(...trozos: string[]): Response {
  const codificador = new TextEncoder()
  const cuerpo = new ReadableStream<Uint8Array>({
    start(control) {
      trozos.forEach((trozo) => control.enqueue(codificador.encode(trozo)))
      control.close()
    },
  })
  return new Response(cuerpo, { status: 200, headers: { 'Content-Type': 'text/event-stream' } })
}

/** Un fetch que no responde nunca, hasta que se aborta: una conexión que se queda abierta. */
export function conexionAbierta(_url: RequestInfo | URL, opciones?: RequestInit): Promise<Response> {
  return new Promise((_resolver, rechazar) => {
    opciones?.signal?.addEventListener('abort', () => rechazar(new DOMException('Abortada', 'AbortError')))
  })
}
