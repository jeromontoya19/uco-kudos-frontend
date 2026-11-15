// Las fechas se muestran en la hora de Colombia, sin importar dónde esté el celular.
const FORMATO = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'America/Bogota',
})

/** Convierte una fecha ISO-8601 (UTC) de la API en texto legible, por ejemplo «14 nov 2026, 9:45 p. m.». */
export function formatearFecha(iso: string): string {
  const fecha = new Date(iso)
  return Number.isNaN(fecha.getTime()) ? '' : FORMATO.format(fecha)
}
