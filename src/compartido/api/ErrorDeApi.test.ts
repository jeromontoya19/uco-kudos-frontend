import { describe, expect, it } from 'vitest'
import { comoErrorDeApi, ErrorDeApi, mensajeParaLaPersona } from './ErrorDeApi'

describe('ErrorDeApi', () => {
  it('deja igual un ErrorDeApi', () => {
    const original = new ErrorDeApi('red', 'Sin conexión')

    expect(comoErrorDeApi(original)).toBe(original)
  })

  it('convierte cualquier otro error en uno de tipo «servidor» y guarda la causa', () => {
    const causa = new Error('inesperado')

    const error = comoErrorDeApi(causa)

    expect(error.tipo).toBe('servidor')
    expect(error.cause).toBe(causa)
  })

  it('da un mensaje en español para cada tipo', () => {
    expect(mensajeParaLaPersona(new ErrorDeApi('no-habilitada', ''))).toBe('Tu cuenta aún no está habilitada.')
    expect(mensajeParaLaPersona(new ErrorDeApi('red', ''))).toMatch(/Revisa tu conexión/)
  })
})
