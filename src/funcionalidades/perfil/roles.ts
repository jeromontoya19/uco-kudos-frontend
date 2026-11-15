import type { Rol } from '../../compartido/api/contrato'

const NOMBRES_DE_LOS_ROLES: Readonly<Record<Rol, string>> = {
  ADMINISTRADOR: 'Administrador',
  RECTOR: 'Rector',
  COORDINADOR_ACADEMICO: 'Coordinador académico',
  COORDINADOR_FACULTAD: 'Coordinador de facultad',
  COORDINADOR_PROGRAMA: 'Coordinador de programa',
  DOCENTE: 'Docente',
  ESTUDIANTE: 'Estudiante',
}

/** El rol como lo lee una persona. Si la API agrega un rol nuevo, se muestra tal cual llega. */
export function nombreDelRol(rol: string): string {
  return NOMBRES_DE_LOS_ROLES[rol as Rol] ?? rol
}
