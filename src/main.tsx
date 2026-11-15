// Raíz de composición: monta la aplicación en el elemento #root de index.html.
// Los estilos globales van primero: así, los de cada componente pueden ajustarlos.
import './compartido/estilos/global.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'

const contenedor = document.getElementById('root')
if (!contenedor) {
  throw new Error('No se encontró el elemento #root en index.html.')
}

createRoot(contenedor).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
