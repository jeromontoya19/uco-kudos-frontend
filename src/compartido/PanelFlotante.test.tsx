import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PanelFlotante } from './PanelFlotante'

function mostrar(abierto: boolean) {
  const alCerrar = vi.fn<() => void>()
  const resultado = render(
    <PanelFlotante abierto={abierto} titulo="Da un Kudo" alCerrar={alCerrar}>
      <p>Contenido del panel</p>
    </PanelFlotante>,
  )
  return { alCerrar, ...resultado }
}

describe('PanelFlotante', () => {
  it('no se ve mientras está cerrado', () => {
    mostrar(false)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('se abre como diálogo con su título', () => {
    mostrar(true)

    expect(screen.getByRole('dialog', { name: 'Da un Kudo' })).toHaveTextContent('Contenido del panel')
  })

  it('se cierra con la ✕', async () => {
    const { alCerrar } = mostrar(true)

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }))

    expect(alCerrar).toHaveBeenCalled()
  })

  it('avisa cuando el navegador lo cierra, por ejemplo con Esc', () => {
    const { alCerrar } = mostrar(true)

    fireEvent(screen.getByRole('dialog'), new Event('close'))

    expect(alCerrar).toHaveBeenCalledTimes(1)
  })

  it('se cierra cuando deja de estar abierto', () => {
    const { rerender } = mostrar(true)

    rerender(
      <PanelFlotante abierto={false} titulo="Da un Kudo" alCerrar={vi.fn<() => void>()}>
        <p>Contenido del panel</p>
      </PanelFlotante>,
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
