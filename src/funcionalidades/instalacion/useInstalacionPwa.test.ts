import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { crearOfrecimientoDeInstalacion } from '../../pruebas/ofrecimientoDeInstalacion'
import { simularModoAplicacion } from '../../pruebas/simularModoAplicacion'
import { useInstalacionPwa } from './useInstalacionPwa'

describe('useInstalacionPwa', () => {
  it('empieza en «manual» si el navegador no ha ofrecido instalarla', () => {
    const { result } = renderHook(() => useInstalacionPwa())

    expect(result.current.estado).toBe('manual')
  })

  it('empieza en «instalada» si se abrió como aplicación', () => {
    simularModoAplicacion(true)

    const { result } = renderHook(() => useInstalacionPwa())

    expect(result.current.estado).toBe('instalada')
  })

  it('pasa a «disponible» y frena el aviso propio del navegador cuando este ofrece instalarla', () => {
    const { result } = renderHook(() => useInstalacionPwa())
    const ofrecimiento = crearOfrecimientoDeInstalacion()

    act(() => {
      window.dispatchEvent(ofrecimiento)
    })

    expect(result.current.estado).toBe('disponible')
    expect(ofrecimiento.defaultPrevented).toBe(true)
  })

  it('ignora un evento de instalación que no trae cómo instalarla', () => {
    const { result } = renderHook(() => useInstalacionPwa())

    act(() => {
      window.dispatchEvent(new Event('beforeinstallprompt'))
    })

    expect(result.current.estado).toBe('manual')
  })

  it('al instalar, muestra el diálogo del navegador una sola vez y vuelve a «manual»', async () => {
    const { result } = renderHook(() => useInstalacionPwa())
    const ofrecimiento = crearOfrecimientoDeInstalacion()
    act(() => {
      window.dispatchEvent(ofrecimiento)
    })

    await act(() => result.current.instalar())
    await act(() => result.current.instalar())

    expect(ofrecimiento.prompt).toHaveBeenCalledTimes(1)
    expect(result.current.estado).toBe('manual')
  })

  it('pasa a «instalada» cuando el navegador avisa que se instaló', () => {
    const { result } = renderHook(() => useInstalacionPwa())
    act(() => {
      window.dispatchEvent(crearOfrecimientoDeInstalacion())
    })

    act(() => {
      window.dispatchEvent(new Event('appinstalled'))
    })

    expect(result.current.estado).toBe('instalada')
  })

  it('deja de escuchar al navegador cuando el componente desaparece', () => {
    const { result, unmount } = renderHook(() => useInstalacionPwa())

    unmount()
    window.dispatchEvent(crearOfrecimientoDeInstalacion())

    expect(result.current.estado).toBe('manual')
  })
})
