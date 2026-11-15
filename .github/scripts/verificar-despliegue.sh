#!/usr/bin/env bash
# Comprueba que Static Web Apps ya sirve la versión recién desplegada:
# el commit dentro del JavaScript principal, el manifiesto y el service worker.
# Uso: verificar-despliegue.sh <url-del-sitio> <commit> [inicio]
#   inicio: segundos desde 1970 (date +%s) al empezar el job; si llega, el resumen dice cuánto tardó.
set -euo pipefail

URL="${1%/}"
COMMIT="$2"
INICIO="${3:-}"
INTENTOS=12
ESPERA_SEGUNDOS=10

if [[ -z "$URL" ]]; then
  echo "::error::La acción de despliegue no devolvió la URL del sitio."
  exit 1
fi
case "$URL" in
  https://*) ;;
  http://*)
    echo "::error::La URL del sitio debe usar HTTPS: $URL"
    exit 1
    ;;
  *) URL="https://$URL" ;;
esac

# Descarga una URL solo por HTTPS, también si el servidor redirige.
descargar() {
  curl -fsSL --proto '=https' --proto-redir '=https' "$@"
}

# Responde 0 si el JavaScript principal que enlaza index.html trae el commit.
# Descarga cada respuesta completa antes de buscar en ella, para no cortar la descarga a mitad de camino.
sirve_el_commit() {
  local html script javascript
  html="$(descargar "$URL/")" || return 1
  script="$(grep -o -m 1 '/assets/index-[A-Za-z0-9_-]*\.js' <<< "$html")" || return 1
  javascript="$(descargar "$URL$script")" || return 1
  [[ "$javascript" == *"$COMMIT"* ]]
}

for intento in $(seq 1 "$INTENTOS"); do
  if sirve_el_commit; then
    descargar -o /dev/null "$URL/manifest.webmanifest"
    descargar -o /dev/null "$URL/sw.js"
    duracion=""
    if [[ -n "$INICIO" ]]; then
      duracion=", en $(($(date +%s) - INICIO)) s"
    fi
    echo "Responde la versión ${COMMIT:0:7} en $URL, con su manifiesto y su service worker${duracion}."
    echo "### Front desplegado: [$URL]($URL) (versión \`${COMMIT:0:7}\`${duracion})" >> "${GITHUB_STEP_SUMMARY:-/dev/null}"
    exit 0
  fi
  echo "Intento $intento de $INTENTOS: todavía no responde la versión ${COMMIT:0:7}."
  sleep "$ESPERA_SEGUNDOS"
done

echo "::error::$URL no sirvió la versión ${COMMIT:0:7} en $((INTENTOS * ESPERA_SEGUNDOS)) s."
exit 1
