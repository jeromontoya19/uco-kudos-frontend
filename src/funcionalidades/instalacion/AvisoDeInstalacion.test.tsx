import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { crearOfrecimientoDeInstalacion } from '../../pruebas/ofrecimientoDeInstalacion'
import { simularModoAplicacion } from '../../pruebas/simularModoAplicacion'
import { AvisoDeInstalacion } from './AvisoDeInstalacion'

describe('AvisoDeInstalacion', () => {
  it('explica cómo instalarla desde el menú si el navegador no la ofrece', () => {
    render(<AvisoDeInstalacion />)

    expect(screen.getByText(/Agregar a la pantalla de inicio/)).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('muestra el botón y abre el diálogo del navegador al tocarlo', async () => {
    const usuario = userEvent.setup()
    render(<AvisoDeInstalacion />)
    const ofrecimiento = crearOfrecimientoDeInstalacion()
    act(() => {
      window.dispatchEvent(ofrecimiento)
    })

    await usuario.click(screen.getByRole('button', { name: 'Instalar UCO Kudos' }))

    expect(ofrecimiento.prompt).toHaveBeenCalledTimes(1)
  })

  it('no muestra nada si ya se abrió como aplicación', () => {
    simularModoAplicacion(true)

    const { container } = render(<AvisoDeInstalacion />)

    expect(container).toBeEmptyDOMElement()
  })
})
