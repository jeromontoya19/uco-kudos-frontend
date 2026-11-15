import { useAuth0, type Auth0ContextInterface } from '@auth0/auth0-react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CATEGORIAS, DOCENTE, kudo, PERSONAS } from '../pruebas/datos'
import { App } from './App'

vi.mock('@auth0/auth0-react', () => ({
  useAuth0: vi.fn<() => Auth0ContextInterface>(),
  Auth0Provider: ({ children }: { children: ReactNode }) => children,
}))

const loginWithRedirect = vi.fn<Auth0ContextInterface['loginWithRedirect']>(() => Promise.resolve())

function simularAuth0(estado: { isLoading?: boolean; isAuthenticated?: boolean; error?: Error }) {
  vi.mocked(useAuth0).mockReturnValue({
    isLoading: false,
    isAuthenticated: false,
    error: undefined,
    ...estado,
    loginWithRedirect,
    logout: vi.fn<Auth0ContextInterface['logout']>(),
    getAccessTokenSilently: vi.fn<() => Promise<string>>(() => Promise.resolve('token-de-prueba')),
  } as unknown as Auth0ContextInterface)
}

/** La API de verdad responde estas rutas; aquí fetch las simula. */
const RESPUESTAS: Readonly<Record<string, unknown>> = {
  '/api/yo': DOCENTE,
  '/api/personas': PERSONAS,
  '/api/categorias': CATEGORIAS,
  '/api/kudos?pagina=0&tamano=20': [kudo()],
}

function simularApi() {
  const fetch = vi.fn<typeof globalThis.fetch>((entrada) => {
    const cuerpo = RESPUESTAS[String(entrada)]
    return Promise.resolve(
      cuerpo === undefined ? new Response(null, { status: 404 }) : new Response(JSON.stringify(cuerpo), { status: 200 }),
    )
  })
  vi.stubGlobal('fetch', fetch)
  return fetch
}

describe('App', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('espera mientras Auth0 revisa la sesión', () => {
    simularAuth0({ isLoading: true })

    render(<App />)

    expect(screen.getByRole('heading', { name: 'Cargando UCO Kudos…' })).toBeInTheDocument()
  })

  it('sin sesión, muestra la bienvenida e inicia sesión con Auth0', async () => {
    simularAuth0({ isAuthenticated: false })
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: 'UCO Kudos' })).toBeInTheDocument()
    expect(screen.getByText(/Agregar a la pantalla de inicio/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

    expect(loginWithRedirect).toHaveBeenCalled()
  })

  it('avisa si no se pudo iniciar sesión', () => {
    simularAuth0({ error: new Error('access_denied') })

    render(<App />)

    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo iniciar sesión.')
  })

  it('con sesión, llama a la API con el token y muestra la cuenta y el muro', async () => {
    simularAuth0({ isAuthenticated: true })
    const fetch = simularApi()

    render(<App />)

    expect(await screen.findByRole('banner')).toHaveTextContent('Ana Docente')
    expect(await screen.findByRole('article')).toHaveTextContent('Gracias por la ayuda con el laboratorio.')
    const [, opciones] = fetch.mock.calls[0] ?? []
    expect(opciones?.headers).toMatchObject({ Authorization: 'Bearer token-de-prueba' })
  })
})
