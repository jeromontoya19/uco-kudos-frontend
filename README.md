# UCO Kudos · Front-End

Aplicación web *mobile first* de la plataforma institucional de reconocimientos UCO Kudos. Es una
**PWA instalable** (`ADR-006`) hecha con **React, Vite y TypeScript** (`ADR-016`).

> **Jerónimo Montoya Londoño** · Proyecto integrador de Ingeniería del Software II

**URL pública:** <https://happy-bush-0fa58021e.4.azurestaticapps.net> (Azure Static Web Apps) ·
**Back-End y documentación:** [`uco-kudos-backend`](https://github.com/jeromontoya19/uco-kudos-backend)
(la documentación vive en su carpeta `docs/`)

## Cómo correrla en local

Necesita **Node 24 LTS**, la versión de `.nvmrc` y de la CI. Vitest admite Node 22.12 o más, 24 y 26,
pero no Node 23.

```bash
npm ci               # instala las versiones exactas del package-lock
npm run dev          # servidor de desarrollo en http://localhost:5173
npm run lint         # oxlint, sin advertencias permitidas
npm test             # pruebas unitarias con Vitest y Testing Library
npm run test:cobertura   # las mismas, con cobertura (mínimo 70 %)
npm run build        # revisa los tipos y compila en dist/
npm run preview      # sirve dist/ con las cabeceras de seguridad de Azure
npm run iconos       # vuelve a generar los íconos desde public/logo.svg
```

Sin Node instalado, con Docker (Git Bash):

```bash
MSYS_NO_PATHCONV=1 docker run --rm -v "$(pwd -W):/app" -v uco-kudos-front-node-modules:/app/node_modules -w /app node:24-alpine sh -c "npm ci && npm run lint && npm test && npm run build"
```

El service worker solo se registra con `npm run build` y `npm run preview`, no con `npm run dev`.

**La API en local.** Con `npm run dev`, el front llama a `/api` en su mismo origen, y el proxy de Vite
lo reenvía a la API de producción. Así no hace falta que la API acepte `localhost` en CORS. El inicio de
sesión funciona en `http://localhost:5173`, que está registrado en Auth0. Para usar otra API, como el
back corriendo en local, define `VITE_API_URL` (ver `.env.example`). `npm run preview` no sirve para
iniciar sesión: el puerto 4173 no está registrado en Auth0, y la API no acepta ese origen.

## Estructura

```text
src/
  main.tsx                 monta la app
  app/                     raíz: arma la sesión y la API, y elige la pantalla
  funcionalidades/
    sesion/                Auth0: el único lugar que lo conoce (proveedor + useSesion)
    perfil/                cabecera con el nombre y el rol
    publicar/              formulario para dar un Kudo y sus mensajes de error
    muro/                  el muro paginado («Ver más») y la tarjeta de cada Kudo
    bienvenida/            pantalla de bienvenida, sin sesión
    instalacion/           ofrecer la instalación de la PWA (hook + aviso)
  compartido/
    api/                   contrato de la API, cliente HTTP con el token y errores tipados
    configuracion.ts       Auth0 y la URL de la API (valores públicos)
    useConsulta.ts         cargar datos con estados de carga, error y reintento
    estilos/global.css     tokens de diseño, botones y campos
  pruebas/                 configuración, datos de prueba y una API falsa
public/
  logo.svg                 logo, del que salen los íconos PNG
  staticwebapp.config.json rutas y cabeceras de Azure Static Web Apps (CSP incluida)
config/marca.ts            colores compartidos por el manifiesto y los íconos
```

Cada funcionalidad guarda junto a ella su componente, sus estilos (CSS Modules) y sus pruebas. Las
funcionalidades no se importan entre sí: `app/` las compone. Los componentes hablan con la API por el
puerto `ApiDeUcoKudos` (`compartido/api/contrato.ts`), así que las pruebas le pasan una API falsa; el
cliente HTTP y la sesión se prueban aparte, simulando `fetch` y Auth0.

## Sesión y API

- **Inicio de sesión:** Auth0, con el flujo de código y PKCE de `@auth0/auth0-react` (`ADR-007`). El
  token se pide con la audiencia `https://api.ucokudos`; sin ella, la API no lo acepta.
- **Dónde quedan los tokens:** en `localStorage`, con refresh tokens rotativos. Así la PWA instalada
  no pide iniciar sesión cada vez que se abre. El riesgo es que un script inyectado (XSS) los lea; lo
  reducen la CSP estricta, que React muestre el contenido de los Kudos solo como texto y que el access
  token dure 15 min. La decisión completa está en `src/funcionalidades/sesion/ProveedorDeSesion.tsx`.
- **Errores de la API:** el 401 pide volver a iniciar sesión; el 403 muestra «Tu cuenta aún no está
  habilitada»; cada motivo del 422 al publicar tiene su mensaje.
- **CSP:** `connect-src` solo deja llamar a la API y a Auth0.

## PWA

- **Manifiesto e íconos:** los genera `vite-plugin-pwa` desde `vite.config.ts`, con los íconos de
  `public/` (normal, *maskable* y de iPhone).
- **Service worker:** Workbox guarda la app en caché, así que abre sin conexión. Cuando hay una
  versión nueva, se instala sola y se usa en la siguiente carga.
- **Instalación:** en Chrome y Edge, la app muestra el botón «Instalar UCO Kudos». En los demás
  navegadores, explica cómo instalarla desde el menú.

## Estrategia de ramas y pipeline

| Rama | Qué corre ahí | Cómo sale |
|---|---|---|
| `codigo-desarrollo` | CI rápida: lint, pruebas unitarias y build | PR a `codigo-testing` |
| `codigo-testing` | CI completa en el PR: además, cobertura, Sonar y Trivy | PR a `main` |
| `main` | CI completa en el PR y, tras el merge, el CD a Azure Static Web Apps | Solo recibe pull requests |

- **CI** (`.github/workflows/ci.yml`): Trivy frena el cambio si hay una vulnerabilidad CRÍTICA o ALTA
  con corrección, también en las dependencias de desarrollo.
- **CD** (`.github/workflows/cd.yml`): compila con el commit como versión, despliega en
  `ucokudos-web` con la acción oficial de Static Web Apps y comprueba que el sitio sirve ese commit.
  El resumen del job dice cuánto tardó.
- **Vuelta atrás** (`.github/workflows/vuelta-atras.yml`, `ESC-15`): en *Actions → Vuelta atrás →
  Run workflow*, desde `main`, con el SHA completo de un commit anterior de `main`. Static Web Apps
  no guarda versiones anteriores, así que el workflow compila ese commit con su propio
  `package-lock.json` (las mismas versiones exactas), lo publica y comprueba que el sitio lo sirve.
- Las acciones de terceros se fijan por SHA de commit.
