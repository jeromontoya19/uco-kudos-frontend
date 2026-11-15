import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DOCENTE } from '../../pruebas/datos'
import { Cabecera } from './Cabecera'
import { nombreDelRol } from './roles'

describe('Cabecera', () => {
  it('muestra el nombre y el rol de la persona', () => {
    render(<Cabecera persona={DOCENTE} alCerrarSesion={vi.fn<() => void>()} />)

    expect(screen.getByText('Ana Docente')).toBeInTheDocument()
    expect(screen.getByText('Docente')).toBeInTheDocument()
  })

  it('cierra la sesión con su botón', async () => {
    const alCerrarSesion = vi.fn<() => void>()
    render(<Cabecera persona={DOCENTE} alCerrarSesion={alCerrarSesion} />)

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    expect(alCerrarSesion).toHaveBeenCalledTimes(1)
  })
})

describe('nombreDelRol', () => {
  it.each([
    ['COORDINADOR_ACADEMICO', 'Coordinador académico'],
    ['ESTUDIANTE', 'Estudiante'],
  ])('muestra %s como «%s»', (rol, nombre) => {
    expect(nombreDelRol(rol)).toBe(nombre)
  })

  it('muestra tal cual un rol que todavía no conoce', () => {
    expect(nombreDelRol('INVITADO')).toBe('INVITADO')
  })
})
