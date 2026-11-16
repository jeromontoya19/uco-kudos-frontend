import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { restaurarNavegador, simularNotificaciones } from '../../pruebas/notificaciones'
import { OfertaDeNotificaciones } from './OfertaDeNotificaciones'

describe('OfertaDeNotificaciones', () => {
  afterEach(() => {
    restaurarNavegador()
  })

  it('pide el permiso al tocar «Activar avisos» y después se oculta', async () => {
    const { requestPermission } = simularNotificaciones('default', 'granted')
    render(<OfertaDeNotificaciones />)

    await userEvent.click(screen.getByRole('button', { name: 'Activar avisos' }))

    expect(requestPermission).toHaveBeenCalledOnce()
    expect(screen.queryByRole('region', { name: 'Avisos del sistema' })).not.toBeInTheDocument()
  })

  it('con «Ahora no» se oculta sin pedir el permiso', async () => {
    const { requestPermission } = simularNotificaciones('default')
    render(<OfertaDeNotificaciones />)

    await userEvent.click(screen.getByRole('button', { name: 'Ahora no' }))

    expect(requestPermission).not.toHaveBeenCalled()
    expect(screen.queryByRole('region', { name: 'Avisos del sistema' })).not.toBeInTheDocument()
  })

  it.each(['granted', 'denied'] as const)('no se ofrece si el permiso ya es «%s»', (permiso) => {
    simularNotificaciones(permiso)

    const { container } = render(<OfertaDeNotificaciones />)

    expect(container).toBeEmptyDOMElement()
  })

  it('no se ofrece si el navegador no tiene notificaciones', () => {
    const { container } = render(<OfertaDeNotificaciones />)

    expect(container).toBeEmptyDOMElement()
  })
})
