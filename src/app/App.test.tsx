import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('App', () => {
  it('muestra la bienvenida con el aviso para instalarla', () => {
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: 'UCO Kudos' })).toBeInTheDocument()
    expect(screen.getByText(/Agregar a la pantalla de inicio/)).toBeInTheDocument()
  })
})
