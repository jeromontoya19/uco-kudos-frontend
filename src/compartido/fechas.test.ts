import { describe, expect, it } from 'vitest'
import { formatearFecha } from './fechas'

describe('formatearFecha', () => {
  it('muestra la fecha en la hora de Colombia', () => {
    // 02:45 en UTC son las 9:45 p. m. del día anterior en Bogotá.
    const texto = formatearFecha('2026-11-15T02:45:00Z')

    expect(texto).toMatch(/14/)
    expect(texto).toMatch(/nov/)
    expect(texto).toMatch(/9:45/)
  })

  it('devuelve un texto vacío si la fecha no es válida', () => {
    expect(formatearFecha('no es una fecha')).toBe('')
  })
})
