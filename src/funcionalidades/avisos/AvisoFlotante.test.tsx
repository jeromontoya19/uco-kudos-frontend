import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AvisoFlotante, DURACION_DEL_AVISO_MS, type AvisoEnPantalla } from './AvisoFlotante'

const AVISO: AvisoEnPantalla = { id: 'k9', texto: 'Ana Docente te dio un Kudo de Colaboración' }

describe('AvisoFlotante', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('sin aviso no muestra nada', () => {
    render(<AvisoFlotante aviso={undefined} alCerrar={vi.fn<() => void>()} />)

    expect(screen.queryByRole('button', { name: 'Cerrar aviso' })).not.toBeInTheDocument()
  })

  it('muestra el aviso y se cierra con «×»', async () => {
    const alCerrar = vi.fn<() => void>()
    render(<AvisoFlotante aviso={AVISO} alCerrar={alCerrar} />)

    expect(screen.getByText(AVISO.texto)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar aviso' }))

    expect(alCerrar).toHaveBeenCalledOnce()
  })

  it('se cierra solo después de unos segundos', () => {
    vi.useFakeTimers()
    const alCerrar = vi.fn<() => void>()
    render(<AvisoFlotante aviso={AVISO} alCerrar={alCerrar} />)

    act(() => vi.advanceTimersByTime(DURACION_DEL_AVISO_MS - 1))
    expect(alCerrar).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1))

    expect(alCerrar).toHaveBeenCalledOnce()
  })

  it('un aviso nuevo vuelve a contar el tiempo desde cero', () => {
    vi.useFakeTimers()
    const alCerrar = vi.fn<() => void>()
    const { rerender } = render(<AvisoFlotante aviso={AVISO} alCerrar={alCerrar} />)
    act(() => vi.advanceTimersByTime(DURACION_DEL_AVISO_MS - 1))

    rerender(<AvisoFlotante aviso={{ id: 'k10', texto: 'Otro aviso' }} alCerrar={alCerrar} />)
    act(() => vi.advanceTimersByTime(DURACION_DEL_AVISO_MS - 1))

    expect(alCerrar).not.toHaveBeenCalled()
  })
})
