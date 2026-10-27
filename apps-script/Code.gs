// Reçoit les formulaires du site : enregistre chaque demande dans la feuille,
// prévient Nicolas par e-mail, puis envoie l'accusé de réception au visiteur.
// La demande est enregistrée AVANT les e-mails : si un envoi échoue, rien n'est perdu.
// Envoie aussi les e-mails de prospection depuis l'onglet « Prospects » (menu « Clips » de la feuille).
// Déploiement : voir README.md.

// <charte> Généré par charte/synchroniser.mjs depuis charte/theme.json : ne pas modifier ici.
const CHARTE = {
  "marque": {
    "signature": "Nicolas Diarra — Clips",
    "raison_sociale": "Nicolas Diarra EI",
    "prenom": "Nicolas",
    "site": "https://ichtuus.github.io/offre-clips/",
    "contact": "devichtus.pro@gmail.com"
  },
  "couleurs": {
    "fond": "#fefefe",
    "encre": "#1e1e1e",
    "encre-douce": "#1e1e1edb",
    "gris-fonce": "#3d3d3d",
    "gris-fenetre": "#dedede",
    "gris-filet": "#c4c4c4",
    "gris-trait": "#858585",
    "rose": "#f386a1",
    "magenta": "#d45bb6",
    "fuchsia": "#e551ba",
    "violet": "#9a6cf0",
    "ciel-haut": "#7aa8d6",
    "ciel-bas": "#b3cde9"
  },
  "polices": {
    "grotesk": "'Inter Tight','Helvetica Neue',Helvetica,Arial,sans-serif",
    "mono": "'JetBrains Mono',Menlo,Consolas,'Courier New',monospace",
    "terminal": "'VT323',Menlo,Consolas,'Courier New',monospace"
  },
  "offre": {
    "usage": "À poster en Shorts, TikTok et Reels : chaque clip fait découvrir ta chaîne à de nouvelles personnes et les renvoie vers ta vidéo longue.",
    "usage_chaine_extraits": "Tu fais des podcasts, des interviews ou des lives ? Je peux aussi te livrer des extraits horizontaux de 2 à 5 minutes, pour alimenter une chaîne d'extraits.",
    "lien": "https://ichtuus.github.io/offre-clips/#prix",
    "formules": [
      {
        "nom": "Hebdo",
        "detail": "4 vidéos longues par mois, environ 30 à 40 clips.",
        "prix": "290 €/mois"
      },
      {
        "nom": "Intensif",
        "detail": "8 vidéos longues par mois, environ 60 à 80 clips.",
        "prix": "490 €/mois"
      }
    ],
    "mentions": "Résiliable à tout moment. TVA non applicable, art. 293 B du CGI."
  }
};
// </charte>

const DESTINATAIRE = CHARTE.marque.contact;
const SIGNATURE = CHARTE.marque.raison_sociale;
const SITE = CHARTE.marque.site;
const LONGUEUR_MAX = 500;
const MAX_PAR_EMAIL_PAR_HEURE = 5;
const MAX_ACCUSES_PAR_JOUR = 80; // quota Gmail gratuit : 100 e-mails par jour

// Accusés de réception : textes fixes, écrits ici. Rien de ce que le visiteur a saisi n'y est repris
// (sinon n'importe qui pourrait faire envoyer un texte ou un lien de son choix à une autre adresse).
const TYPES = {
  essai: {
    feuille: 'Essais',
    sujet: 'Essai : 3 clips gratuits',
    champs: ['video', 'chaine', 'email'],
    accuse: {
      objet: 'C\'est noté : tes 3 clips arrivent sous 48 h',
      etiquette: 'Essai gratuit',
      fenetre: 'demande_recue.txt',
      statut: 'Demande bien reçue ✓',
      titre: 'C\'est noté.<br>Tes 3 clips arrivent<br>sous 48 h ouvrées.',
      intro: 'Merci pour ta confiance. Voici ce qui se passe maintenant :',
      etapes: [
        ['01 — La sélection', 'Je regarde ta vidéo en entier et je repère les passages qui tiennent seuls.'],
        ['02 — Le montage', 'Format vertical, coupes calées sur les phrases, sous-titres mot à mot, un titre et une miniature par clip.'],
        ['03 — La livraison', 'Tu reçois un lien pour regarder tes clips et les télécharger, prêts à poster.'],
      ],
      encadre: 'Rien à payer, aucun abonnement derrière. Si les clips te plaisent, on parle de la suite. Sinon, tu les gardes.',
      question: 'Une question ? Réponds simplement à cet e-mail.',
      salut: '— Nicolas',
      rappel: 'Tu reçois cet e-mail parce qu\'une demande d\'essai a été faite avec cette adresse sur le site. ' +
        'Si ce n\'est pas toi, ignore-le : tu ne recevras rien d\'autre.',
    },
  },
  resiliation: {
    feuille: 'Résiliations',
    sujet: 'Notification de résiliation',
    champs: ['nom', 'email', 'reference', 'date_souhaitee'],
    accuse: {
      objet: 'Accusé de réception — Notification de résiliation',
      etiquette: 'Résiliation',
      fenetre: 'accuse_reception.txt',
      statut: 'Notification reçue ✓',
      titre: 'Votre notification<br>de résiliation<br>est bien reçue.',
      intro: 'Accusé de réception : votre notification de résiliation a bien été reçue. ' +
        'Vous recevrez sous peu un e-mail confirmant la date de fin de votre contrat.',
      question: 'Une question ? Répondez simplement à cet e-mail.',
      salut: '— ' + SIGNATURE,
      rappel: 'Vous recevez cet e-mail parce qu\'une notification de résiliation a été envoyée avec cette adresse sur le site.',
    },
  },
  retractation: {
    feuille: 'Rétractations',
    sujet: 'Rétractation',
    champs: ['nom', 'email', 'date_commande', 'reference', 'declaration'],
    accuse: {
      objet: 'Accusé de réception — Rétractation',
      etiquette: 'Rétractation',
      fenetre: 'accuse_reception.txt',
      statut: 'Rétractation reçue ✓',
      titre: 'Votre rétractation<br>est bien reçue.',
      intro: 'Accusé de réception : votre rétractation a bien été reçue. ' +
        'Le remboursement des sommes dues interviendra au plus tard dans les 14 jours.',
      question: 'Une question ? Répondez simplement à cet e-mail.',
      salut: '— ' + SIGNATURE,
      rappel: 'Vous recevez cet e-mail parce qu\'une rétractation a été envoyée avec cette adresse sur le site.',
    },
  },
};

function doPost(e) {
  try {
    const p = e.parameter || {};
    if (p._honey) return repondre(true, 'reçu'); // robot : on fait comme si de rien n'était
    const type = TYPES[p.type];
    if (!type) return refuser('Type de formulaire inconnu.');

    const email = nettoyer(p.email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return refuser('Adresse e-mail invalide.');
    if (!sousLaLimite('email:' + email.toLowerCase(), MAX_PAR_EMAIL_PAR_HEURE, 3600)) {
      return refuser('Trop de demandes avec cette adresse. Réessayez dans une heure.');
    }

    const id = nettoyer(p.id) || Utilities.getUuid();
    const valeurs = type.champs.map((champ) => protegerFormule(nettoyer(p[champ])));
    const ligne = enregistrer(type, id, valeurs, nettoyer(p.page));
    if (ligne === null) return repondre(true, 'déjà reçu'); // renvoi automatique d'une demande déjà enregistrée

    notifier(type, valeurs, email, id);
    const accuse = envoyerAccuse(type, email);
    ligne.feuille.getRange(ligne.numero, ligne.colonneAccuse).setValue(accuse ? 'oui' : 'NON, à envoyer à la main');
    return repondre(true, 'reçu', { accuse: accuse });
  } catch (erreur) {
    console.error(erreur);
    return repondre(false, 'Erreur du serveur.');
  }
}

// Écrit la demande dans l'onglet de son type. Renvoie null si l'identifiant existe déjà.
function enregistrer(type, id, valeurs, page) {
  const verrou = LockService.getScriptLock();
  verrou.waitLock(10000);
  try {
    const entetes = ['Reçu le', 'Identifiant'].concat(type.champs, ['Page', 'Accusé envoyé']);
    const classeur = SpreadsheetApp.getActiveSpreadsheet();
    const feuille = classeur.getSheetByName(type.feuille) || classeur.insertSheet(type.feuille);
    if (feuille.getLastRow() === 0) feuille.appendRow(entetes).setFrozenRows(1);
    const doublon = feuille.getRange('B:B').createTextFinder(id).matchEntireCell(true).findNext();
    if (doublon) return null;
    feuille.appendRow([new Date(), id].concat(valeurs, [page, '…']));
    return { feuille: feuille, numero: feuille.getLastRow(), colonneAccuse: entetes.length };
  } finally {
    verrou.releaseLock();
  }
}

function notifier(type, valeurs, email, id) {
  try {
    const corps = type.champs.map((champ, i) => champ + ' : ' + valeurs[i]).join('\n');
    MailApp.sendEmail({
      to: DESTINATAIRE,
      replyTo: email,
      subject: '[Site] ' + type.sujet,
      body: corps + '\n\nIdentifiant : ' + id + '\nDemande enregistrée dans la feuille « ' + type.feuille + ' ».',
    });
  } catch (erreur) {
    console.error('Notification non envoyée', erreur); // la demande reste dans la feuille
  }
}

function envoyerAccuse(type, email) {
  if (!sousLaLimite('accuses-du-jour', MAX_ACCUSES_PAR_JOUR, 86400)) return false;
  try {
    // Texte fixe, écrit ici : personne ne peut s'en servir pour envoyer autre chose.
    const a = type.accuse;
    MailApp.sendEmail({ to: email, replyTo: DESTINATAIRE, name: SIGNATURE, subject: a.objet, body: accuseTexte(a), htmlBody: accuseHtml(a) });
    return true;
  } catch (erreur) {
    console.error('Accusé non envoyé', erreur);
    return false;
  }
}

// Version texte (messageries qui n'affichent pas le HTML, aperçu des notifications).
function accuseTexte(a) {
  const lignes = [a.titre.replace(/<br>/g, ' '), '', a.intro];
  (a.etapes || []).forEach((e) => lignes.push('', e[0], e[1]));
  if (a.encadre) lignes.push('', a.encadre);
  lignes.push('', a.question, '', a.salut, '', '—', SIGNATURE + ' · ' + SITE, a.rappel);
  return lignes.join('\n');
}

// --- Gabarit commun à tous les e-mails (accusés, prospection) -----------------------------
// Les messageries ignorent feuilles de style et polices web : tableaux et styles en ligne,
// couleurs et polices de repli tirées de CHARTE (généré depuis charte/theme.json).
// Les morceaux de `corps` sont du HTML déjà sûr : tout texte venant d'une feuille passe par echapper().

function gabaritEmail(m) {
  const c = CHARTE.couleurs, f = CHARTE.polices;
  const siteAffiche = SITE.replace(/^https?:\/\//, '').replace(/\/$/, '');
  return '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="color-scheme" content="light only"><title>' + echapper(m.objet) + '</title></head>' +
    '<body style="margin:0;padding:0;background:' + c.fond + ';">' +
    // Texte d'aperçu affiché par la messagerie à côté de l'objet, invisible dans l'e-mail.
    '<div style="display:none;max-height:0;overflow:hidden;">' + m.apercu + '</div>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' + c.fond + ';"><tr><td align="center" style="padding:0;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">' +

    // En-tête : ciel du site, boîtes blanche et noire, fenêtre rétro.
    '<tr><td bgcolor="' + c['ciel-haut'] + '" style="background:' + c['ciel-haut'] + ';background-image:linear-gradient(135deg,' +
      c.magenta + ' 0%,' + c.violet + ' 30%,' + c['ciel-haut'] + ' 60%,' + c['ciel-bas'] + ' 100%);padding:14px 16px 34px 16px;">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' +
        '<td align="left"><span style="background:' + c.fond + ';color:' + c.encre + ';font:500 15px/28px ' + f.grotesk + ';padding:4px 7px;">' + echapper(CHARTE.marque.signature) + '</span></td>' +
        '<td align="right"><span style="background:' + c.encre + ';color:' + c.fond + ';font:500 15px/28px ' + f.grotesk + ';padding:4px 7px;">' + m.etiquette + '</span></td>' +
      '</tr></table>' +
      '<table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:34px auto 0 auto;width:280px;max-width:100%;border:2px solid ' + c.encre + ';background:' + c['gris-fenetre'] + ';">' +
        '<tr><td style="background:' + c.encre + ';color:' + c['gris-fenetre'] + ';font:400 13px/22px ' + f.mono + ';padding:0 8px;">' + m.fenetre + '</td></tr>' +
        '<tr><td style="padding:14px 12px;font:400 16px/1.3 ' + f.mono + ';color:' + c.encre + ';text-align:center;">' + m.statut + '</td></tr>' +
      '</table>' +
    '</td></tr>' +

    // Corps
    '<tr><td style="padding:34px 20px 8px 20px;">' +
      '<h1 style="margin:0 0 22px 0;font:500 36px/1 ' + f.grotesk + ';color:' + c.encre + ';letter-spacing:-0.5px;">' + m.titre + '</h1>' +
      m.corps.filter(Boolean).join('') +
      '<p style="margin:18px 0 0 0;font:500 17px/1.45 ' + f.grotesk + ';color:' + c.encre + ';">' + m.salut + '</p>' +
    '</td></tr>' +

    // Pied
    '<tr><td style="padding:30px 20px 34px 20px;">' +
      '<div style="height:24px;border-top:2px solid ' + c['gris-trait'] + ';"></div>' +
      '<p style="margin:0 0 8px 0;font:400 12px/1.5 ' + f.mono + ';color:' + c.encre + ';">' + echapper(SIGNATURE) + ' · <a href="' + SITE + '" style="color:' + c.encre + ';">' + siteAffiche + '</a></p>' +
      '<p style="margin:0;font:400 12px/1.5 ' + f.mono + ';color:#6b6b6b;">' + m.rappel + '</p>' +
    '</td></tr>' +

    '</table></td></tr></table></body></html>';
}

function blocParagraphe(html) {
  return '<p style="margin:0 0 22px 0;font:400 17px/1.45 ' + CHARTE.polices.grotesk + ';color:' + CHARTE.couleurs['gris-fonce'] + ';">' + html + '</p>';
}

function blocEtapes(etapes) {
  const c = CHARTE.couleurs, f = CHARTE.polices;
  if (!etapes || !etapes.length) return '';
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + etapes.map((e) =>
    '<tr><td style="padding:0 0 18px 0;"><div style="border-left:1px solid ' + c.encre + ';padding-left:12px;">' +
      '<div style="font:700 12px/1.4 ' + f.mono + ';color:' + c.encre + ';margin-bottom:4px;">' + e[0] + '</div>' +
      '<div style="font:400 16px/1.4 ' + f.grotesk + ';color:' + c['gris-fonce'] + ';">' + e[1] + '</div>' +
    '</div></td></tr>').join('') + '</table>';
}

function blocEncadre(html) {
  const c = CHARTE.couleurs;
  if (!html) return '';
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 24px 0;background:' + c.rose + ';border:2px solid ' + c.encre + ';">' +
    '<tr><td style="padding:14px 16px;font:500 16px/1.4 ' + CHARTE.polices.grotesk + ';color:' + c.encre + ';">' + html + '</td></tr></table>';
}

// Image cliquable (miniature) et bouton : `lien` et `image` doivent être passés par lienSur().
function blocImage(image, lien, texteAlt) {
  return '<a href="' + lien + '" style="display:block;margin:0 0 18px 0;text-decoration:none;">' +
    '<img src="' + image + '" alt="' + echapper(texteAlt) + '" width="520" style="display:block;width:100%;max-width:520px;height:auto;border:2px solid ' + CHARTE.couleurs.encre + ';"></a>';
}

function blocBouton(texte, lien) {
  const c = CHARTE.couleurs;
  return '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 26px 0;"><tr>' +
    '<td bgcolor="' + c.encre + '" style="background:' + c.encre + ';border:2px solid ' + c.encre + ';">' +
    '<a href="' + lien + '" style="display:inline-block;padding:12px 20px;font:500 18px/1 ' + CHARTE.polices.grotesk + ';color:' + c.fond + ';text-decoration:none;">' + echapper(texte) + '</a>' +
    '</td></tr></table>';
}

// Texte venant d'une feuille ou d'un visiteur : jamais interprété comme du HTML.
function echapper(texte) {
  return String(texte == null ? '' : texte).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Lien http(s) complet seulement (pas de javascript:, data:…), prêt à mettre dans un attribut.
function lienSur(url) {
  const u = String(url || '').trim();
  return /^https:\/\/[^\s"'<>\\]+$/i.test(u) ? echapper(u) : null;
}

// --- Accusés de réception --------------------------------------------------------------

function accuseHtml(a) {
  return gabaritEmail({
    objet: a.objet, apercu: a.intro, etiquette: a.etiquette, fenetre: a.fenetre, statut: a.statut, titre: a.titre,
    corps: [blocParagraphe(a.intro), blocEtapes(a.etapes), blocEncadre(a.encadre), blocParagraphe(a.question)],
    salut: a.salut, rappel: a.rappel,
  });
}

// Envoie les 3 accusés (essai, résiliation, rétractation) à ta propre adresse pour voir le rendu
// (à lancer depuis l'éditeur Apps Script).
function testerAccuse() {
  Object.keys(TYPES).forEach((cle) => {
    const a = TYPES[cle].accuse;
    MailApp.sendEmail({ to: DESTINATAIRE, name: SIGNATURE, subject: '[Test] ' + a.objet, body: accuseTexte(a), htmlBody: accuseHtml(a) });
  });
}

// --- Prospection : onglet « Prospects » et menu « Clips » ------------------------------
// Ces fonctions ne sont appelables que depuis la feuille (menu) ou l'éditeur, avec le compte propriétaire :
// le site (doPost) n'y a pas accès. Les textes de la feuille sont quand même échappés.

const ONGLET_PROSPECTS = 'Prospects';
const COLONNES = ['Envoyer', 'E-mail', 'Prénom', 'Chaîne', 'Lien de la page', 'Phrase perso', 'Envoyé le', 'Ne plus contacter', 'Résultat'];
const COL = { envoyer: 0, email: 1, prenom: 2, chaine: 3, lien: 4, phrase: 5, envoye: 6, stop: 7, resultat: 8 };
const MARGE_QUOTA = 20; // e-mails gardés pour les accusés de réception du jour

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Clips')
    .addItem('Envoyer les prospects cochés', 'envoyerProspects')
    .addItem('Aperçu : m\'envoyer le premier prospect coché', 'apercuProspect')
    .addSeparator()
    .addItem('Créer ou réparer l\'onglet Prospects', 'preparerOngletProspects')
    .addToUi();
}

function preparerOngletProspects() {
  const classeur = SpreadsheetApp.getActiveSpreadsheet();
  const feuille = classeur.getSheetByName(ONGLET_PROSPECTS) || classeur.insertSheet(ONGLET_PROSPECTS);
  feuille.getRange(1, 1, 1, COLONNES.length).setValues([COLONNES]).setFontWeight('bold');
  feuille.setFrozenRows(1);
  const lignes = Math.max(feuille.getMaxRows() - 1, 200);
  if (feuille.getMaxRows() < lignes + 1) feuille.insertRowsAfter(feuille.getMaxRows(), lignes + 1 - feuille.getMaxRows());
  feuille.getRange(2, COL.envoyer + 1, lignes, 1).insertCheckboxes();
  feuille.getRange(2, COL.stop + 1, lignes, 1).insertCheckboxes();
  feuille.getRange(2, COL.envoye + 1, lignes, 1).setNumberFormat('dd/mm/yyyy hh:mm');
  [70, 220, 110, 160, 280, 360, 130, 120, 260].forEach((largeur, i) => feuille.setColumnWidth(i + 1, largeur));
  feuille.getRange(2, COL.phrase + 1, lignes, 1).setWrap(true);
  SpreadsheetApp.getUi().alert('Onglet « Prospects » prêt. Une ligne par créateur : coche « Envoyer », puis menu Clips → Envoyer les prospects cochés.');
}

function lireProspects() {
  const feuille = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ONGLET_PROSPECTS);
  if (!feuille) throw new Error('Onglet « Prospects » absent : menu Clips → Créer ou réparer l\'onglet Prospects.');
  const valeurs = feuille.getLastRow() < 2 ? [] : feuille.getRange(2, 1, feuille.getLastRow() - 1, COLONNES.length).getValues();
  return { feuille: feuille, lignes: valeurs.map((v, i) => ({ numero: i + 2, v: v })) };
}

// Construit l'e-mail d'une ligne. Lève une erreur lisible si la ligne est incomplète.
function messageProspect(v) {
  const email = String(v[COL.email]).trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('adresse e-mail invalide');
  const page = String(v[COL.lien]).trim().replace(/index\.html$/, '').replace(/\/?$/, '/');
  const lien = lienSur(page);
  if (!lien) throw new Error('lien de la page manquant ou invalide (https://… attendu)');
  const image = lienSur(page + 'apercu.jpg'); // écrit par `clipper export` dans chaque dossier livré
  const prenom = String(v[COL.prenom]).trim().slice(0, 60);
  const chaine = String(v[COL.chaine]).trim().slice(0, 60);
  const phrase = String(v[COL.phrase]).trim().slice(0, LONGUEUR_MAX);
  const prix = CHARTE.offre.formules.length ? CHARTE.offre.formules[0].prix : '';

  const objet = prenom ? prenom + ', j\'ai découpé ta vidéo en clips' : 'J\'ai découpé ta vidéo en clips prêts à poster';
  const intro = 'J\'ai pris une de tes vidéos et j\'en ai tiré des clips courts, prêts à poster : coupés au bon endroit, ' +
    'sous-titrés, avec un titre et une miniature.';
  const offre = 'C\'est offert, sans engagement : tu peux les poster tels quels.' +
    (prix ? ' Si tu veux la même chose pour chaque vidéo, c\'est à partir de ' + prix + ', résiliable à tout moment.' : '');
  const question = 'Une question, une retouche ? Réponds simplement à cet e-mail.';
  const rappel = 'Tu reçois ce message parce que j\'ai préparé ces clips à partir d\'une de tes vidéos publiques. ' +
    'Tu ne veux plus de message de ma part ? Réponds STOP, c\'est noté.';
  const salut = '— ' + CHARTE.marque.prenom;

  const html = gabaritEmail({
    objet: objet,
    apercu: 'Tes clips sont prêts : regarde-les et télécharge-les en un clic.',
    etiquette: chaine ? echapper(chaine) : 'Clips offerts',
    fenetre: 'clips_prets.txt',
    statut: 'Prêts à poster ✓',
    titre: prenom ? 'Salut ' + echapper(prenom) + ',<br>tes clips<br>sont prêts.' : 'Tes clips<br>sont prêts.',
    corps: [
      blocParagraphe(intro + ' ' + echapper(CHARTE.offre.usage)),
      phrase ? blocParagraphe(echapper(phrase).replace(/\n/g, '<br>')) : '',
      image ? blocImage(image, lien, 'Aperçu de tes clips') : '',
      blocBouton('▶ Voir tes clips', lien),
      blocEncadre(offre),
      blocParagraphe(question),
    ],
    salut: salut,
    rappel: rappel,
  });
  const texte = [prenom ? 'Salut ' + prenom + ',' : 'Salut,', '', intro + ' ' + CHARTE.offre.usage, phrase ? '\n' + phrase : '', '',
    'Voir tes clips : ' + page, '', offre, '', question, '', salut, '', '—', SIGNATURE + ' · ' + SITE, rappel].join('\n');
  return { email: email, objet: objet, html: html, texte: texte };
}

function envoyerProspects() {
  const ui = SpreadsheetApp.getUi();
  const { feuille, lignes } = lireProspects();
  const stop = new Set(lignes.filter((l) => l.v[COL.stop] === true).map((l) => String(l.v[COL.email]).trim().toLowerCase()));
  const dejaContactes = new Set(lignes.filter((l) => l.v[COL.envoye]).map((l) => String(l.v[COL.email]).trim().toLowerCase()));
  const aEnvoyer = lignes.filter((l) => l.v[COL.envoyer] === true);
  if (!aEnvoyer.length) return ui.alert('Aucune ligne cochée dans la colonne « Envoyer ».');

  const quota = MailApp.getRemainingDailyQuota() - MARGE_QUOTA;
  if (quota <= 0) return ui.alert('Quota Gmail du jour presque atteint : on garde les derniers envois pour les accusés de réception. Réessaie demain.');
  const reponse = ui.alert('Envoyer ' + Math.min(aEnvoyer.length, quota) + ' e-mail(s) de prospection depuis ton Gmail ?' +
    (aEnvoyer.length > quota ? '\n(' + (aEnvoyer.length - quota) + ' resteront cochés pour demain : quota du jour)' : ''), ui.ButtonSet.YES_NO);
  if (reponse !== ui.Button.YES) return;

  let envoyes = 0, ignores = 0, erreurs = 0;
  aEnvoyer.slice(0, quota).forEach((l) => {
    const cle = String(l.v[COL.email]).trim().toLowerCase();
    const resultat = feuille.getRange(l.numero, COL.resultat + 1);
    if (stop.has(cle)) { resultat.setValue('Ignoré : ne plus contacter'); ignores++; return; }
    if (dejaContactes.has(cle)) { resultat.setValue('Ignoré : déjà contacté'); ignores++; return; }
    try {
      const m = messageProspect(l.v);
      MailApp.sendEmail({ to: m.email, replyTo: DESTINATAIRE, name: CHARTE.marque.signature, subject: m.objet, body: m.texte, htmlBody: m.html });
      feuille.getRange(l.numero, COL.envoye + 1).setValue(new Date());
      feuille.getRange(l.numero, COL.envoyer + 1).setValue(false);
      resultat.setValue('Envoyé');
      dejaContactes.add(cle);
      envoyes++;
    } catch (erreur) {
      resultat.setValue('Erreur : ' + erreur.message);
      erreurs++;
    }
  });
  ui.alert(envoyes + ' envoyé(s), ' + ignores + ' ignoré(s), ' + erreurs + ' en erreur. Détail dans la colonne « Résultat ».');
}

// Envoie le premier prospect coché à ta propre adresse, sans rien changer dans la feuille.
function apercuProspect() {
  const ui = SpreadsheetApp.getUi();
  const ligne = lireProspects().lignes.find((l) => l.v[COL.envoyer] === true);
  if (!ligne) return ui.alert('Coche une ligne dans « Envoyer » pour l\'aperçu.');
  try {
    const m = messageProspect(ligne.v);
    MailApp.sendEmail({ to: DESTINATAIRE, name: CHARTE.marque.signature, subject: '[Aperçu] ' + m.objet, body: m.texte, htmlBody: m.html });
    ui.alert('Aperçu envoyé sur ' + DESTINATAIRE + '.');
  } catch (erreur) {
    ui.alert('Ligne ' + ligne.numero + ' : ' + erreur.message);
  }
}

// Compteur glissant en cache : faux si la limite est atteinte.
function sousLaLimite(cle, max, dureeSecondes) {
  const cache = CacheService.getScriptCache();
  const n = Number(cache.get(cle) || 0);
  if (n >= max) return false;
  cache.put(cle, String(n + 1), dureeSecondes);
  return true;
}

function nettoyer(valeur) {
  return String(valeur || '').trim().slice(0, LONGUEUR_MAX);
}

// Une saisie qui commence par = + - @ serait exécutée comme une formule par Sheets.
function protegerFormule(valeur) {
  return /^[=+\-@]/.test(valeur) ? "'" + valeur : valeur;
}

// Refus définitif (saisie invalide, abus) : le site ne tente pas l'envoi de secours.
function refuser(message) {
  return repondre(false, message, { refus: true });
}

function repondre(ok, message, extra) {
  return ContentService
    .createTextOutput(JSON.stringify(Object.assign({ ok: ok, message: message }, extra || {})))
    .setMimeType(ContentService.MimeType.JSON);
}
