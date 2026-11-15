import { describe, expect, it } from 'vitest'
import { crearApiHttp } from './apiHttp'
import type { ClienteHttp } from './clienteHttp'

/** Un cliente que solo anota qué se le pidió. */
function clienteFalso() {
  const pedidos: unknown[][] = []
  const cliente: ClienteHttp = {
    obtener: <T,>(ruta: string) => {
      pedidos.push(['GET', ruta])
      return Promise.resolve([] as T)
    },
    enviar: <T,>(ruta: string, cuerpo: unknown) => {
      pedidos.push(['POST', ruta, cuerpo])
      return Promise.resolve({} as T)
    },
  }
  return { cliente, pedidos }
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
})
