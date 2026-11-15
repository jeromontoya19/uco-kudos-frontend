import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ErrorDeApi } from './api/ErrorDeApi'
import { useConsulta } from './useConsulta'

describe('useConsulta', () => {
  it('pasa de «cargando» a «lista» con el valor', async () => {
    const consultar = vi.fn<() => Promise<number>>(() => Promise.resolve(42))

    const { result } = renderHook(() => useConsulta(consultar))

    expect(result.current.estado).toEqual({ tipo: 'cargando' })
    await waitFor(() => expect(result.current.estado).toEqual({ tipo: 'lista', valor: 42 }))
  })

  it('queda «fallida» con el error de la API', async () => {
    const error = new ErrorDeApi('red', 'Sin conexión')
    const consultar = vi.fn<() => Promise<number>>(() => Promise.reject(error))

    const { result } = renderHook(() => useConsulta(consultar))

    await waitFor(() => expect(result.current.estado).toEqual({ tipo: 'fallida', error }))
  })

  it('vuelve a consultar al reintentar', async () => {
    const consultar = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new ErrorDeApi('red', 'Sin conexión'))
      .mockResolvedValue('listo')
    const { result } = renderHook(() => useConsulta(consultar))
    await waitFor(() => expect(result.current.estado.tipo).toBe('fallida'))

    act(() => result.current.reintentar())

    await waitFor(() => expect(result.current.estado).toEqual({ tipo: 'lista', valor: 'listo' }))
  })
})
