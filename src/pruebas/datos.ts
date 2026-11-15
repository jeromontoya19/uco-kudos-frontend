import { vi } from 'vitest'
import type { ApiDeUcoKudos, Categoria, KudoDelMuro, Persona, PersonaDeLaSesion } from '../compartido/api/contrato'

export const DOCENTE: PersonaDeLaSesion = {
  id: '00000000-0000-0000-0000-000000000006',
  nombre: 'Ana Docente',
  rol: 'DOCENTE',
}

export const ESTUDIANTE: Persona = { id: '00000000-0000-0000-0000-000000000007', nombre: 'Beto Estudiante' }

export const PERSONAS: readonly Persona[] = [{ id: DOCENTE.id, nombre: DOCENTE.nombre }, ESTUDIANTE]

export const CATEGORIAS: readonly Categoria[] = [
  { id: 'c1', nombre: 'Colaboración' },
  { id: 'c2', nombre: 'Innovación' },
]

/** Un Kudo del muro; cada prueba cambia lo que le importe. */
export function kudo(cambios: Partial<KudoDelMuro> = {}): KudoDelMuro {
  return {
    id: 'k1',
    autor: { id: DOCENTE.id, nombre: DOCENTE.nombre },
    destinatario: ESTUDIANTE,
    categoria: 'Colaboración',
    contenido: 'Gracias por la ayuda con el laboratorio.',
    publicadoEn: '2026-11-15T02:45:00Z',
    ...cambios,
  }
}

/** Varios Kudos con identificadores distintos, para llenar páginas. */
export function kudos(cantidad: number, desde = 0): KudoDelMuro[] {
  return Array.from({ length: cantidad }, (_, indice) => kudo({ id: `k${desde + indice}` }))
}

/** Una API falsa que responde datos de prueba; cada prueba reemplaza lo que necesite. */
export function crearApiFalsa(cambios: Partial<ApiDeUcoKudos> = {}) {
  return {
    yo: vi.fn<ApiDeUcoKudos['yo']>(cambios.yo ?? (() => Promise.resolve(DOCENTE))),
    personas: vi.fn<ApiDeUcoKudos['personas']>(cambios.personas ?? (() => Promise.resolve(PERSONAS))),
    categorias: vi.fn<ApiDeUcoKudos['categorias']>(cambios.categorias ?? (() => Promise.resolve(CATEGORIAS))),
    muro: vi.fn<ApiDeUcoKudos['muro']>(cambios.muro ?? (() => Promise.resolve([kudo()]))),
    publicar: vi.fn<ApiDeUcoKudos['publicar']>(
      cambios.publicar ?? (() => Promise.resolve({ id: 'nuevo', publicadoEn: '2026-11-15T03:00:00Z' })),
    ),
  }
}
