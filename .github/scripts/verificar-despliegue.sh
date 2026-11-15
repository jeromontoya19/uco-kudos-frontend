#!/usr/bin/env bash
# Comprueba que Static Web Apps ya sirve la versión recién desplegada:
# el commit dentro del JavaScript principal, el manifiesto y el service worker.
# Uso: verificar-despliegue.sh <url-del-sitio> <commit>
set -euo pipefail

URL="${1%/}"
COMMIT="$2"
INTENTOS=12
ESPERA_SEGUNDOS=10

if [ -z "$URL" ]; then
  echo "::error::La acción de despliegue no devolvió la URL del sitio."
  exit 1
fi
case "$URL" in
  http://* | https://*) ;;
  *) URL="https://$URL" ;;
esac

# Responde 0 si el JavaScript principal que enlaza index.html trae el commit.
# Descarga cada respuesta completa antes de buscar en ella, para no cortar curl a mitad de camino.
sirve_el_commit() {
  local html script javascript
  html="$(curl -fsSL "$URL/")" || return 1
  script="$(grep -o -m 1 '/assets/index-[A-Za-z0-9_-]*\.js' <<< "$html")" || return 1
  javascript="$(curl -fsSL "$URL$script")" || return 1
  [[ "$javascript" == *"$COMMIT"* ]]
}

for intento in $(seq 1 "$INTENTOS"); do
  if sirve_el_commit; then
    curl -fsSL -o /dev/null "$URL/manifest.webmanifest"
    curl -fsSL -o /dev/null "$URL/sw.js"
    echo "Responde la versión ${COMMIT:0:7} en $URL, con su manifiesto y su service worker."
    echo "### Front desplegado: [$URL]($URL) (versión \`${COMMIT:0:7}\`)" >> "${GITHUB_STEP_SUMMARY:-/dev/null}"
    exit 0
  fi
  echo "Intento $intento de $INTENTOS: todavía no responde la versión ${COMMIT:0:7}."
  sleep "$ESPERA_SEGUNDOS"
done

echo "::error::$URL no sirvió la versión ${COMMIT:0:7} en $((INTENTOS * ESPERA_SEGUNDOS)) s."
exit 1
