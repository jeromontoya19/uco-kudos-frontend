import { describe, expect, it } from 'vitest'
import { versionCorta } from './version'

describe('versionCorta', () => {
  it('recorta el commit a 7 caracteres', () => {
    expect(versionCorta('c05718c870fcbd54452c3dea0b99ca4d6c8670d3')).toBe('c05718c')
  })

  it('deja igual un commit que ya es corto', () => {
    expect(versionCorta('abc12')).toBe('abc12')
  })

  it.each([undefined, '', '   '])('devuelve «local» cuando no hay commit (%j)', (commit) => {
    expect(versionCorta(commit)).toBe('local')
  })
})
