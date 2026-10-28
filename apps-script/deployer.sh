#!/bin/sh
# Envoie apps-script/Code.gs dans le projet Apps Script de la feuille « Leads » et en fait une nouvelle version
# du déploiement existant : l'adresse du script (formulaires, compteur, Clipper) ne change pas.
# Une fois : `clasp login` (compte propriétaire de la feuille) et .clasp.json à la racine (ID du script, hors git).
set -e
cd "$(dirname "$0")/.."
# ID du déploiement = celui de l'adresse du compteur dans la charte (…/macros/s/<ID>/exec).
DEPLOIEMENT=$(node -e 'const u=require("./charte/theme.json").suivi.compteur; process.stdout.write(u.split("/s/")[1].split("/")[0])')
clasp push --force
clasp deploy --deploymentId "$DEPLOIEMENT" --description "${1:-$(git log -1 --format=%s -- apps-script/Code.gs)}"
