import { describe, expect, it } from 'vitest'
import { crearLectorSse, type EventoSse } from './sse'

function leer(...trozos: string[]): EventoSse[] {
  const eventos: EventoSse[] = []
  const lector = crearLectorSse((evento) => eventos.push(evento))
  trozos.forEach(lector)
  return eventos
}

describe('crearLectorSse', () => {
  it('entrega un evento con su tipo y sus datos', () => {
    expect(leer('event:kudo-recibido\ndata:{"kudo":"k1"}\n\n')).toEqual([
      { tipo: 'kudo-recibido', datos: '{"kudo":"k1"}' },
    ])
  })

  it('usa el tipo «message» si el evento no trae «event»', () => {
    expect(leer('data: hola\n\n')).toEqual([{ tipo: 'message', datos: 'hola' }])
  })

  it('une con saltos de línea las líneas «data» de un mismo evento', () => {
    expect(leer('data: uno\ndata: dos\n\n')).toEqual([{ tipo: 'message', datos: 'uno\ndos' }])
  })

  it('ignora los comentarios, como el latido del servidor', () => {
    expect(leer(':latido\n\n', ':latido\n\n')).toEqual([])
  })

  it('ignora los campos que no usa y los eventos sin datos', () => {
    expect(leer('id: 7\nretry: 5000\nevent: vacio\n\n')).toEqual([])
  })

  it('arma un evento que llega cortado en varios trozos', () => {
    expect(leer('event:kudo-re', 'cibido\ndata:{"ku', 'do":"k1"}\n', '\n')).toEqual([
      { tipo: 'kudo-recibido', datos: '{"kudo":"k1"}' },
    ])
  })

  it('no entrega nada mientras el evento no termine con una línea vacía', () => {
    expect(leer('event:kudo-recibido\ndata:{"kudo":"k1"}\n')).toEqual([])
  })

  it('separa dos eventos que llegan en el mismo trozo', () => {
    expect(leer('data: uno\n\ndata: dos\n\n')).toEqual([
      { tipo: 'message', datos: 'uno' },
      { tipo: 'message', datos: 'dos' },
    ])
  })

  it('acepta finales de línea «\\r\\n», aunque el trozo corte entre el «\\r» y el «\\n»', () => {
    expect(leer('event: a\r\ndata: uno\r', '\n\r\n')).toEqual([{ tipo: 'a', datos: 'uno' }])
  })

  it('no arrastra el tipo de un evento al siguiente', () => {
    expect(leer('event: a\ndata: uno\n\ndata: dos\n\n')).toEqual([
      { tipo: 'a', datos: 'uno' },
      { tipo: 'message', datos: 'dos' },
    ])
  })
})
