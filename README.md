# UCO Kudos · Front-End

Aplicación web *mobile first* de la plataforma institucional de reconocimientos UCO Kudos.

> **Jerónimo Montoya Londoño** · Proyecto integrador de Ingeniería del Software II

**URL pública:** _pendiente_ · **Back-End y documentación:** _enlace a `uco-kudos-backend`_ (la documentación vive en su carpeta `docs/`)

## Cómo correrla en local

_Pendiente: se completa cuando exista el esqueleto._

## Estrategia de ramas

| Rama | Qué corre ahí | Cómo sale |
|---|---|---|
| `main` | El CD despliega desde aquí | Solo recibe pull requests |
| `codigo-desarrollo` | CI rápida: lint y pruebas unitarias | PR a `codigo-testing` |
| `codigo-testing` | CI completa: build, Sonar y Trivy | PR a `main`, que dispara el despliegue |
