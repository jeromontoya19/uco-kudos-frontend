import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PantallaBienvenida } from './PantallaBienvenida'

describe('PantallaBienvenida', () => {
  it('muestra el nombre de la plataforma como título principal', () => {
    render(<PantallaBienvenida version="local" />)

    expect(screen.getByRole('heading', { level: 1, name: 'UCO Kudos' })).toBeInTheDocument()
  })

  it('presenta las tres cosas que se pueden hacer', () => {
    render(<PantallaBienvenida version="local" />)

    const seccion = screen.getByRole('region', { name: 'Con UCO Kudos puedes' })
    const funciones = within(seccion).getAllByRole('listitem')
    expect(funciones.map((funcion) => funcion.querySelector('strong')?.textContent)).toEqual([
      'Da un Kudo',
      'Mira el muro',
      'Llévala en tu celular',
    ])
  })

  it('muestra la versión desplegada en el pie', () => {
    render(<PantallaBienvenida version="c05718c" />)

    expect(screen.getByText('Versión c05718c')).toBeInTheDocument()
  })

  it('pone en la zona de acciones lo que recibe', () => {
    render(
      <PantallaBienvenida version="local">
        <button type="button">Acción de prueba</button>
      </PantallaBienvenida>,
    )

    expect(screen.getByRole('button', { name: 'Acción de prueba' })).toBeInTheDocument()
  })
})
