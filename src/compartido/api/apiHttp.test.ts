import { describe, expect, it, vi } from 'vitest'
import { crearApiHttp } from './apiHttp'
import type { ClienteHttp } from './clienteHttp'
import type { AvisoDeKudoRecibido } from './contrato'
import type { EventoSse } from './sse'

/** Un cliente que solo anota qué se le pidió; del flujo guarda a quién entregarle los eventos. */
function clienteFalso() {
  const pedidos: unknown[][] = []
  const cerrar = vi.fn<() => void>()
  let entregar: (evento: EventoSse) => void = () => {}
  const cliente: ClienteHttp = {
    obtener: <T,>(ruta: string) => {
      pedidos.push(['GET', ruta])
      return Promise.resolve([] as T)
    },
    enviar: <T,>(ruta: string, cuerpo: unknown) => {
      pedidos.push(['POST', ruta, cuerpo])
      return Promise.resolve({} as T)
    },
    escuchar: (ruta, alEvento) => {
      pedidos.push(['FLUJO', ruta])
      entregar = alEvento
      return cerrar
    },
  }
  return { cliente, pedidos, cerrar, entregar: (evento: EventoSse) => entregar(evento) }
}

describe('crearApiHttp', () => {
  it.each([
    ['yo', '/api/yo'],
    ['personas', '/api/personas'],
    ['categorias', '/api/categorias'],
  ] as const)('%s consulta %s', async (operacion, ruta) => {
    const { cliente, pedidos } = clienteFalso()

    await crearApiHttp(cliente)[operacion]()

    expect(pedidos).toEqual([['GET', ruta]])
  })

  it('pide el muro con la página y el tamaño', async () => {
    const { cliente, pedidos } = clienteFalso()

    await crearApiHttp(cliente).muro(2, 20)

    expect(pedidos).toEqual([['GET', '/api/kudos?pagina=2&tamano=20']])
  })

  it('publica enviando la solicitud a /api/kudos', async () => {
    const { cliente, pedidos } = clienteFalso()
    const solicitud = { destinatario: 'p7', categoria: 'c1', contenido: 'Gracias' }

    await crearApiHttp(cliente).publicar(solicitud)

    expect(pedidos).toEqual([['POST', '/api/kudos', solicitud]])
  })

  describe('avisosEnVivo', () => {
    const AVISO: AvisoDeKudoRecibido = { kudo: 'k9', autor: 'Ana Docente', categoria: 'Colaboración' }

    it('escucha /api/avisos/en-vivo y devuelve cómo cerrarlo', () => {
      const { cliente, pedidos, cerrar } = clienteFalso()

      const cerrarAvisos = crearApiHttp(cliente).avisosEnVivo(vi.fn<(aviso: AvisoDeKudoRecibido) => void>())
      cerrarAvisos()

      expect(pedidos).toEqual([['FLUJO', '/api/avisos/en-vivo']])
      expect(cerrar).toHaveBeenCalledOnce()
    })

    it('entrega cada «kudo-recibido» como un aviso', () => {
      const { cliente, entregar } = clienteFalso()
      const alAviso = vi.fn<(aviso: AvisoDeKudoRecibido) => void>()

      crearApiHttp(cliente).avisosEnVivo(alAviso)
      entregar({ tipo: 'kudo-recibido', datos: JSON.stringify(AVISO) })

      expect(alAviso).toHaveBeenCalledWith(AVISO)
    })

    it.each<[string, EventoSse]>([
      ['otro tipo de evento', { tipo: 'message', datos: JSON.stringify(AVISO) }],
      ['datos que no son JSON', { tipo: 'kudo-recibido', datos: 'hola' }],
      ['JSON que no es un objeto', { tipo: 'kudo-recibido', datos: 'null' }],
      ['un aviso sin autor', { tipo: 'kudo-recibido', datos: '{"kudo":"k9","categoria":"Colaboración"}' }],
      ['campos que no son texto', { tipo: 'kudo-recibido', datos: '{"kudo":9,"autor":"Ana","categoria":"C"}' }],
    ])('ignora %s', (_caso, evento) => {
      const { cliente, entregar } = clienteFalso()
      const alAviso = vi.fn<(aviso: AvisoDeKudoRecibido) => void>()

      crearApiHttp(cliente).avisosEnVivo(alAviso)
      entregar(evento)

      expect(alAviso).not.toHaveBeenCalled()
    })
  })
})
