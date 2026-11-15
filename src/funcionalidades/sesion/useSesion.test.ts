import { useAuth0, type Auth0ContextInterface } from '@auth0/auth0-react'
import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ErrorDeApi } from '../../compartido/api/ErrorDeApi'
import { useSesion } from './useSesion'

vi.mock('@auth0/auth0-react', () => ({ useAuth0: vi.fn<() => Auth0ContextInterface>() }))

const loginWithRedirect = vi.fn<Auth0ContextInterface['loginWithRedirect']>(() => Promise.resolve())
const logout = vi.fn<Auth0ContextInterface['logout']>(() => Promise.resolve())
const getAccessTokenSilently = vi.fn<() => Promise<string | undefined>>(() => Promise.resolve('token'))

function simularAuth0(estado: { isLoading?: boolean; isAuthenticated?: boolean; error?: Error } = {}) {
  vi.mocked(useAuth0).mockReturnValue({
    isLoading: false,
    isAuthenticated: false,
    error: undefined,
    ...estado,
    loginWithRedirect,
    logout,
    getAccessTokenSilently,
  } as unknown as Auth0ContextInterface)
}

describe('useSesion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each([
    [{ isLoading: true }, 'cargando'],
    [{ isAuthenticated: false }, 'anonima'],
    [{ isAuthenticated: true }, 'iniciada'],
  ] as const)('con Auth0 en %o, la sesión está «%s»', (estadoDeAuth0, esperado) => {
    simularAuth0(estadoDeAuth0)

    const { result } = renderHook(() => useSesion())

    expect(result.current.estado).toBe(esperado)
  })

  it('avisa si Auth0 devolvió un error al iniciar sesión', () => {
    simularAuth0({ error: new Error('access_denied') })

    const { result } = renderHook(() => useSesion())

    expect(result.current.falloAlIniciar).toBe(true)
  })

  it('inicia sesión con la página de Auth0', async () => {
    simularAuth0()
    const { result } = renderHook(() => useSesion())

    await result.current.iniciarSesion()

    expect(loginWithRedirect).toHaveBeenCalledTimes(1)
  })

  it('al cerrar sesión vuelve al inicio de la app', async () => {
    simularAuth0({ isAuthenticated: true })
    const { result } = renderHook(() => useSesion())

    await result.current.cerrarSesion()

    expect(logout).toHaveBeenCalledWith({ logoutParams: { returnTo: window.location.origin } })
  })

  it('entrega el access token de Auth0', async () => {
    simularAuth0({ isAuthenticated: true })
    const { result } = renderHook(() => useSesion())

    await expect(result.current.obtenerToken()).resolves.toBe('token')
  })

  it('convierte una falla al renovar el token en un error «sin-sesion»', async () => {
    getAccessTokenSilently.mockRejectedValueOnce(new Error('missing_refresh_token'))
    simularAuth0({ isAuthenticated: true })
    const { result } = renderHook(() => useSesion())

    await expect(result.current.obtenerToken()).rejects.toMatchObject({ tipo: 'sin-sesion' })
  })

  it('trata un token vacío como sesión terminada', async () => {
    getAccessTokenSilently.mockResolvedValueOnce(undefined)
    simularAuth0({ isAuthenticated: true })
    const { result } = renderHook(() => useSesion())

    await expect(result.current.obtenerToken()).rejects.toBeInstanceOf(ErrorDeApi)
  })

  it('usa el token de la caché si no se pide renovarlo', async () => {
    simularAuth0({ isAuthenticated: true })
    const { result } = renderHook(() => useSesion())

    await result.current.obtenerToken({ renovar: false })

    expect(getAccessTokenSilently).toHaveBeenCalledWith(undefined)
  })

  it('pide un token nuevo, sin la caché, cuando se pide renovarlo', async () => {
    simularAuth0({ isAuthenticated: true })
    const { result } = renderHook(() => useSesion())

    await result.current.obtenerToken({ renovar: true })

    expect(getAccessTokenSilently).toHaveBeenCalledWith({ cacheMode: 'off' })
  })
})
