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

## Estructura

```text
src/
  main.tsx                 raíz de composición: monta la app
  app/                     App: compone las funcionalidades
  funcionalidades/
    bienvenida/            pantalla de bienvenida
    instalacion/           ofrecer la instalación de la PWA (hook + aviso)
  compartido/
    estilos/global.css     tokens de diseño (colores, medidas) y estilos base
    version.ts             versión desplegada (commit corto, o «local»)
  pruebas/                 configuración y ayudas de las pruebas
public/
  logo.svg                 logo, del que salen los íconos PNG
  staticwebapp.config.json rutas y cabeceras de Azure Static Web Apps
config/marca.ts            colores compartidos por el manifiesto y los íconos
```

Cada funcionalidad guarda junto a ella su componente, sus estilos (CSS Modules) y sus pruebas. Las
funcionalidades no se importan entre sí: `App` las compone.

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
