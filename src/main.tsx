// Raíz de composición: monta la aplicación en el elemento #root de index.html.
// Los estilos globales van primero: así, los de cada componente pueden ajustarlos.
import './compartido/estilos/global.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { App } from './app/App'

// El service worker: deja la app disponible sin conexión y la mantiene al día. Cuando hay una versión
// nueva desplegada, toma el control y la página se recarga sola con ella.
registerSW({
  immediate: true,
  onRegisteredSW(_url, registro) {
    // Una PWA que vuelve del segundo plano no recarga la página: al verla de nuevo, se pregunta si hay
    // una versión nueva.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        void registro?.update()
      }
    })
  },
})

const contenedor = document.getElementById('root')
if (!contenedor) {
  throw new Error('No se encontró el elemento #root en index.html.')
}

createRoot(contenedor).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
