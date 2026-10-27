#!/usr/bin/env node
// Génère, depuis charte/theme.json et charte/fonts/, les fichiers de thème de chaque endroit
// qui porte l'identité : site (theme.css), e-mails (bloc CHARTE de apps-script/Code.gs),
// page de livraison Clipper (clipper/presentation/charte.json + fonts/).
//
//   node charte/synchroniser.mjs              écrit les fichiers
//   node charte/synchroniser.mjs --verifier   n'écrit rien, signale ce qui n'est plus à jour (code 1)
//   --clipper CHEMIN                          dépôt Clipper (défaut : ../../Clipper, ou $CLIPPER_DIR)
//
// Aucune dépendance : Node 18+ suffit.

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const CHARTE = dirname(fileURLToPath(import.meta.url));
const SITE = resolve(CHARTE, '..');
const args = process.argv.slice(2);
const verifier = args.includes('--verifier');
const i = args.indexOf('--clipper');
const CLIPPER = resolve(i >= 0 ? args[i + 1] : process.env.CLIPPER_DIR || join(SITE, '..', '..', 'Clipper'));

const theme = JSON.parse(readFileSync(join(CHARTE, 'theme.json'), 'utf8'));
const ENTETE = 'Généré par charte/synchroniser.mjs depuis charte/theme.json : ne pas modifier ici.';
const DEBUT_GS = '// <charte> ' + ENTETE;
const FIN_GS = '// </charte>';

// --- Contenus attendus ---------------------------------------------------------------

function themeCss() {
  const faces = Object.values(theme.polices).map((p) =>
    `@font-face { font-family: "${p.famille}"; src: url("charte/fonts/${p.fichier}") format("woff2"); ` +
    `font-weight: ${p.graisses}; font-display: swap; }`);
  const couleurs = Object.entries(theme.couleurs).map(([nom, valeur]) => `  --${nom}: ${valeur};`);
  const familles = Object.entries(theme.polices).map(([role, p]) => `  --${role}: "${p.famille}", ${p.repli};`);
  return `/* ${ENTETE} */\n${faces.join('\n')}\n\n:root {\n${couleurs.join('\n')}\n\n${familles.join('\n')}\n}\n`;
}

function blocGs() {
  const charte = {
    marque: theme.marque,
    couleurs: theme.couleurs,
    // Les messageries ignorent les polices web : nom de la police puis repli système proche.
    polices: Object.fromEntries(Object.entries(theme.polices).map(([role, p]) => [role, `'${p.famille}',${p.repli_email}`])),
    offre: theme.offre,
  };
  return `${DEBUT_GS}\nconst CHARTE = ${JSON.stringify(charte, null, 2)};\n${FIN_GS}`;
}

function charteClipper() {
  return JSON.stringify({ ...theme, _lisez_moi: ENTETE }, null, 2) + '\n';
}

// --- Écriture ou vérification ------------------------------------------------------------

const ecarts = [];

function attendre(chemin, contenu) {
  const actuel = existsSync(chemin) ? readFileSync(chemin) : null;
  const voulu = Buffer.isBuffer(contenu) ? contenu : Buffer.from(contenu, 'utf8');
  if (actuel && actuel.equals(voulu)) return;
  if (verifier) return ecarts.push(chemin);
  mkdirSync(dirname(chemin), { recursive: true });
  writeFileSync(chemin, voulu);
  console.log('écrit   ', chemin);
}

// Site
attendre(join(SITE, 'theme.css'), themeCss());

// E-mails : le bloc entre les marqueurs de Code.gs est remplacé, le reste du fichier n'est pas touché.
const gs = join(SITE, 'apps-script', 'Code.gs');
const code = readFileSync(gs, 'utf8');
const debut = code.indexOf(DEBUT_GS.split(' Généré')[0]);
const fin = code.indexOf(FIN_GS);
if (debut < 0 || fin < 0) throw new Error(`Marqueurs « // <charte> » et « ${FIN_GS} » introuvables dans ${gs}`);
attendre(gs, code.slice(0, debut) + blocGs() + code.slice(fin + FIN_GS.length));

// Clipper
if (existsSync(join(CLIPPER, 'clipper', 'presentation'))) {
  const dest = join(CLIPPER, 'clipper', 'presentation');
  attendre(join(dest, 'charte.json'), charteClipper());
  const voulues = new Set();
  for (const p of Object.values(theme.polices)) {
    for (const f of [p.fichier, p.licence]) {
      voulues.add(f);
      attendre(join(dest, 'fonts', f), readFileSync(join(CHARTE, 'fonts', f)));
    }
  }
  for (const f of readdirSync(join(dest, 'fonts'))) {
    if (!voulues.has(f) && f !== '.DS_Store') {
      if (verifier) ecarts.push(join(dest, 'fonts', f) + ' (en trop)');
      else { rmSync(join(dest, 'fonts', f)); console.log('supprimé', join(dest, 'fonts', f)); }
    }
  }
} else {
  console.log(`Clipper introuvable (${CLIPPER}) : ignoré. Indiquer son dossier avec --clipper.`);
}

// Les prix et les phrases d'usage du site sont écrits à la main dans index.html : on vérifie qu'ils suivent la charte.
const accueil = readFileSync(join(SITE, 'index.html'), 'utf8');
const prixAbsents = theme.offre.formules.filter((f) => !accueil.includes(f.prix)).map((f) => f.prix);
if (prixAbsents.length) ecarts.push(`index.html : prix absents (${prixAbsents.join(', ')}) — à corriger à la main`);
const textesAbsents = ['usage', 'usage_chaine_extraits'].filter((cle) => theme.offre[cle] && !accueil.includes(theme.offre[cle]));
if (textesAbsents.length) ecarts.push(`index.html : texte de la charte absent (offre.${textesAbsents.join(', offre.')}) — à recopier à la main`);

if (ecarts.length) {
  console.error((verifier ? 'Pas à jour avec la charte :\n  ' : 'À reprendre :\n  ') + ecarts.join('\n  '));
  if (verifier) console.error('Lancer : node charte/synchroniser.mjs');
  process.exit(1);
}
console.log(verifier ? 'Tout est à jour avec la charte.' : 'Synchronisation terminée.');
