// Reçoit les formulaires du site : enregistre chaque demande dans la feuille,
// prévient Nicolas par e-mail, puis envoie l'accusé de réception au visiteur.
// La demande est enregistrée AVANT les e-mails : si un envoi échoue, rien n'est perdu.
// Envoie aussi les e-mails de prospection depuis l'onglet « Prospects » (menu « Clips » de la feuille), en texte brut,
// et compte les visites des pages de livraison envoyées aux prospects (doGet).
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
    if (p.action === 'livraison') return livraisonDepuisClipper(p); // Clipper, avec le jeton secret
    if (p.action === 'prospect') return prospectDepuisClipper(p);   // page Prospects de Clipper, même jeton
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

// --- Gabarit commun des e-mails HTML (accusés de réception) ------------------------------
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

// Image cliquable et bouton, pour de futurs e-mails (récapitulatif client…) : `lien` et `image` doivent être passés par lienSur().
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
// le site (doPost) n'y a pas accès.
//
// Premier contact en texte brut, comme un e-mail écrit à la main : pas de mise en page, pas de prix,
// et deux lignes personnalisées obligatoires (sujet de la vidéo, passage précis). L'ancienne version
// en HTML est conservée dans l'historique Git (étiquette `prospection-html`).
// Les relances ne partent pas d'ici : le texte est préparé dans la feuille, puis envoyé à la main
// en répondant au premier e-mail dans Gmail, pour rester dans le même fil.

const ONGLET_PROSPECTS = 'Prospects';
const COLONNES = ['Envoyer', 'E-mail', 'Prénom', 'Chaîne', 'Lien de la page', 'Phrase perso', 'Envoyé le', 'Ne plus contacter', 'Résultat',
  'Sujet', 'Passage', 'Invité', 'Nb clips', 'Relance prévue le', 'Relancé', 'Texte de relance', 'Visites', 'Dernière visite',
  'Première visite', 'A répondu', 'Objet'];
const COL = { envoyer: 0, email: 1, prenom: 2, chaine: 3, lien: 4, phrase: 5, envoye: 6, stop: 7, resultat: 8,
  sujet: 9, passage: 10, invite: 11, nb: 12, relanceLe: 13, relance: 14, texteRelance: 15, visites: 16, derniereVisite: 17,
  premiereVisite: 18, repondu: 19, objet: 20 };
const NOTES_COLONNES = {
  sujet: 'Sujet de la vidéo, tel qu\'il suit « ta vidéo sur… ». Ex. : ton dernier freestyle',
  passage: 'Moment précis, tel qu\'il suit « J\'ai bien aimé… ». Ex. : ton image de la Porsche',
  objet: 'Objet de l\'e-mail : 3 à 6 mots, un détail de la vidéo. Ex. : tes bac+5 et la Porsche. Vide : « 4 clips de ta vidéo sur… ».',
  invite: 'Facultatif : nom de l\'invité, si l\'objet est vide : « … de ta vidéo avec [invité] ».',
  nb: 'Nombre de clips sur la page. Vide : « quelques clips ».',
  phrase: 'Facultatif : une phrase de plus, ajoutée après le lien.',
  visites: 'Ouvertures de la page depuis l\'envoi de l\'e-mail, comptées automatiquement (lien R2 donné par Clipper, ' +
    'ou site Netlify portant le nom proposé). Tes propres visites après l\'envoi comptent aussi. Visible aussi dans Clipper.',
  premiereVisite: 'Date de la première ouverture de la page après l\'envoi : combien de temps il a mis à cliquer.',
  repondu: 'À cocher quand le prospect répond : plus de relance prévue, et Clipper ne le signale plus « à relancer ».',
};
const MAX_VISITES_PAR_HEURE = 30; // par page : un robot qui recharge en boucle ne remplit pas la feuille
const JOURS_AVANT_RELANCE = 5;
const MARGE_QUOTA = 20; // e-mails gardés pour les accusés de réception du jour
const EXPEDITEUR = SIGNATURE.replace(/\s+EI$/, ''); // « Nicolas Diarra » : un nom de personne, pas d'entreprise

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Clips')
    .addItem('Envoyer les prospects cochés', 'envoyerProspects')
    .addItem('Aperçu : m\'envoyer le premier prospect coché', 'apercuProspect')
    .addItem('Préparer les relances du jour', 'preparerRelances')
    .addSeparator()
    .addItem('Créer ou réparer l\'onglet Prospects', 'preparerOngletProspects')
    .addToUi();
}

// Ajoute les colonnes manquantes à droite sans toucher aux données existantes.
function preparerOngletProspects() {
  const classeur = SpreadsheetApp.getActiveSpreadsheet();
  const feuille = classeur.getSheetByName(ONGLET_PROSPECTS) || classeur.insertSheet(ONGLET_PROSPECTS);
  if (feuille.getMaxColumns() < COLONNES.length) feuille.insertColumnsAfter(feuille.getMaxColumns(), COLONNES.length - feuille.getMaxColumns());
  feuille.getRange(1, 1, 1, COLONNES.length).setValues([COLONNES]).setFontWeight('bold');
  Object.keys(NOTES_COLONNES).forEach((cle) => feuille.getRange(1, COL[cle] + 1).setNote(NOTES_COLONNES[cle]));
  feuille.setFrozenRows(1);
  const lignes = Math.max(feuille.getMaxRows() - 1, 200);
  if (feuille.getMaxRows() < lignes + 1) feuille.insertRowsAfter(feuille.getMaxRows(), lignes + 1 - feuille.getMaxRows());
  [COL.envoyer, COL.stop, COL.relance, COL.repondu].forEach((c) => feuille.getRange(2, c + 1, lignes, 1).insertCheckboxes());
  feuille.getRange(2, COL.envoye + 1, lignes, 1).setNumberFormat('dd/mm/yyyy hh:mm');
  feuille.getRange(2, COL.relanceLe + 1, lignes, 1).setNumberFormat('dd/mm/yyyy');
  feuille.getRange(2, COL.derniereVisite + 1, lignes, 1).setNumberFormat('dd/mm/yyyy hh:mm');
  feuille.getRange(2, COL.premiereVisite + 1, lignes, 1).setNumberFormat('dd/mm/yyyy hh:mm');
  [70, 220, 110, 160, 280, 260, 130, 120, 260, 220, 320, 140, 80, 130, 80, 420, 70, 130, 130, 90].forEach((largeur, i) => feuille.setColumnWidth(i + 1, largeur));
  [COL.phrase, COL.passage, COL.texteRelance].forEach((c) => feuille.getRange(2, c + 1, lignes, 1).setWrap(true));

  // Date de relance pour les prospects déjà contactés qui n'en ont pas encore.
  lireProspects().lignes.forEach((l) => {
    if (l.v[COL.envoye] instanceof Date && !l.v[COL.relanceLe]) feuille.getRange(l.numero, COL.relanceLe + 1).setValue(dateRelance(l.v[COL.envoye]));
  });

  // Ligne surlignée quand la relance est due (date atteinte, pas encore relancé, pas de refus).
  const lettre = (c) => String.fromCharCode(65 + c);
  const regle = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND($' + lettre(COL.relanceLe) + '2<>"", $' + lettre(COL.relanceLe) + '2<=TODAY(), $' + lettre(COL.relance) + '2<>TRUE, $' + lettre(COL.stop) + '2<>TRUE, $' + lettre(COL.repondu) + '2<>TRUE)')
    .setBackground('#fde2ea')
    .setRanges([feuille.getRange(2, 1, lignes, COLONNES.length)])
    .build();
  feuille.setConditionalFormatRules(feuille.getConditionalFormatRules()
    .filter((r) => !r.getBooleanCondition() || r.getBooleanCondition().getCriteriaType() !== SpreadsheetApp.BooleanCriteria.CUSTOM_FORMULA)
    .concat(regle));

  SpreadsheetApp.getUi().alert('Onglet « Prospects » prêt. Une ligne par créateur : remplis au moins E-mail, Lien de la page, Sujet et Passage, ' +
    'coche « Envoyer », puis menu Clips → Envoyer les prospects cochés. Les lignes en rose sont à relancer.');
}

function lireProspects() {
  const feuille = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ONGLET_PROSPECTS);
  if (!feuille) throw new Error('Onglet « Prospects » absent : menu Clips → Créer ou réparer l\'onglet Prospects.');
  // Colonne ajoutée depuis la création de l'onglet : créée ici, sans attendre « Créer ou réparer l'onglet ».
  if (feuille.getMaxColumns() < COLONNES.length) feuille.insertColumnsAfter(feuille.getMaxColumns(), COLONNES.length - feuille.getMaxColumns());
  if (feuille.getRange(1, COLONNES.length).getValue() !== COLONNES[COLONNES.length - 1]) {
    feuille.getRange(1, COLONNES.length).setValue(COLONNES[COLONNES.length - 1]).setFontWeight('bold');
  }
  const valeurs = feuille.getLastRow() < 2 ? [] : feuille.getRange(2, 1, feuille.getLastRow() - 1, COLONNES.length).getValues();
  return { feuille: feuille, lignes: valeurs.map((v, i) => ({ numero: i + 2, v: v })) };
}

function dateRelance(envoi) {
  const d = new Date(envoi);
  d.setDate(d.getDate() + JOURS_AVANT_RELANCE);
  d.setHours(0, 0, 0, 0);
  return d;
}

function texteCellule(v, cle, max) {
  return String(v[COL[cle]] == null ? '' : v[COL[cle]]).trim().replace(/\s+/g, ' ').slice(0, max || 200);
}

// « Tu expliques… » → « tu expliques… », pour s'insérer après « le passage où ».
// Minuscule au milieu de la phrase (« Tu expliques » → « tu expliques »), mais jamais sur un nom propre
// (« Marc explique » reste tel quel) : seulement pour les mots qui ouvrent couramment une phrase.
const MINUSCULE_EN_TETE = ['tu', 'ton', 'ta', 'tes', 'il', 'elle', 'ils', 'elles', 'on', 'vous', 'nous', 'le', 'la', 'les', 'l',
  'un', 'une', 'des', 'ce', 'cette', 'ces', 'son', 'sa', 'ses', 'leur', 'leurs', 'votre', 'vos', 'en', 'pour', 'c', 'd', 'j', 'qu'];

function passageDe(v) {
  const p = texteCellule(v, 'passage', 300).replace(/[.!]+$/, '');
  const premier = p.split(/[\s'’]/)[0].toLowerCase();
  return MINUSCULE_EN_TETE.indexOf(premier) >= 0 ? p.charAt(0).toLowerCase() + p.slice(1) : p;
}

// Construit l'e-mail d'une ligne. Lève une erreur lisible si la ligne est incomplète.
// Moment cité dans l'e-mail. Les lignes écrites avant le 2026-11 ont une proposition (« tu expliques… ») : on garde leur sens.
function momentDe(v) {
  const p = passageDe(v);
  return /^(\S+\s+){0,3}?(expliques?|racontes?|montres?|dis|dit|compares?|révèles?|décris|décrit|parles?)\b/i.test(p) ? 'le passage où ' + p : p;
}

// Envoyé aussi en HTML sans aucune mise en forme, comme un message tapé dans Gmail : il suit la largeur de l'écran, alors
// que le texte brut est coupé à 70 caractères par l'envoi (retours à la ligne en pleine phrase, bien visibles sur téléphone).
function messageProspect(v) {
  const email = String(v[COL.email]).trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('adresse e-mail invalide');
  // Lien gardé tel quel sur R2, qui ne sert pas l'index d'un dossier ; adresse courte sur Netlify.
  const lien = String(v[COL.lien]).trim();
  const page = /\.r2\.dev\//.test(lien) ? lien : lien.replace(/index\.html$/, '').replace(/\/?$/, '/');
  if (!lienSur(page)) throw new Error('lien de la page manquant ou invalide (https://… attendu)');
  const sujet = texteCellule(v, 'sujet', 120);
  const passage = passageDe(v);
  if (!sujet || !passage) throw new Error('remplis « Sujet » et « Passage » : c\'est ce qui montre que tu as regardé la vidéo');
  const prenom = texteCellule(v, 'prenom', 60);
  const invite = texteCellule(v, 'invite', 80);
  const nb = parseInt(v[COL.nb], 10);
  const phrase = String(v[COL.phrase] == null ? '' : v[COL.phrase]).trim().slice(0, LONGUEUR_MAX);

  const clips = nb > 1 ? nb + ' clips' : nb === 1 ? 'un clip' : 'quelques clips';
  const chaine = texteCellule(v, 'chaine', 60);
  const objet = texteCellule(v, 'objet', 80) ||
    (nb > 1 ? nb + ' clips' : nb === 1 ? 'Un clip' : 'Des clips') + ' de ta vidéo ' + (invite ? 'avec ' + invite : 'sur ' + sujet);
  const fin = nb === 1 ? '' : 's';
  const debut = 'Du coup j\'ai sorti ';
  const lienTexte = clips + ' sous-titré' + fin;
  const suite = ', prêt' + fin + ' à poster en Short, TikTok ou Reel';
  const lignes = (ligneClips) => [
    'Salut' + (prenom || chaine ? ' ' + (prenom || chaine) : '') + ',',
    '',
    'J\'ai regardé ta vidéo sur ' + sujet + '. J\'ai bien aimé ' + momentDe(v) + ', ça marcherait super bien en format court.',
    '',
    ligneClips,
    phrase ? '\n' + phrase : '',
    '',
    'C\'est cadeau, tu en fais ce que tu veux.',
    '',
    // Une seule question, à laquelle on répond par oui ou non : c'est ce qui fait répondre.
    'Tu veux que je fasse pareil sur ta prochaine vidéo ?',
    '',
    CHARTE.marque.prenom,
    '',
    // Obligatoire en prospection (art. L34-5 CPCE) : un moyen simple de ne plus être contacté.
    'PS : si ce n\'est pas pour toi, dis-le-moi et je ne t\'écrirai plus.',
  ].join('\n').replace(/\n{3,}/g, '\n\n');
  // Le texte brut garde l'adresse en clair (messageries sans HTML) ; le HTML la met derrière les mots.
  const texte = lignes(debut + lienTexte + suite + ' :\n' + page);
  const html = lignes('@@CLIPS@@').split('\n').map((l) => (l ? '<div>' + echapper(l) + '</div>' : '<div><br></div>')).join('')
    .replace('@@CLIPS@@', echapper(debut) + '<a href="' + echapper(page) + '">' + echapper(lienTexte) + '</a>' + echapper(suite) + '.');
  return { email: email, objet: objet, texte: texte, html: html };
}

function texteRelance(v) {
  const prenom = texteCellule(v, 'prenom', 60);
  const sujet = texteCellule(v, 'sujet', 120);
  const passage = passageDe(v);
  if (!sujet || !passage) throw new Error('remplis « Sujet » et « Passage » pour préparer la relance');
  const moment = momentDe(v);
  return [
    prenom ? 'Salut ' + prenom + ',' : 'Salut,',
    '',
    'Petite relance pour les clips de ta vidéo sur ' + sujet + '. ' + moment.charAt(0).toUpperCase() + moment.slice(1) +
      ', c\'est ce que je posterais en premier.',
    '',
    'Tu as eu le temps d\'y jeter un œil ? Même un « pas pour moi » me va très bien.',
    '',
    CHARTE.marque.prenom,
  ].join('\n');
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
    const resultat = feuille.getRange(l.numero, COL.resultat + 1);
    try {
      envoyerLigne(feuille, l, lignes);
      envoyes++;
    } catch (erreur) {
      const ignore = erreur instanceof Ignore;
      resultat.setValue((ignore ? 'Ignoré : ' : 'Erreur : ') + erreur.message);
      if (ignore) ignores++; else erreurs++;
    }
  });
  ui.alert(envoyes + ' envoyé(s), ' + ignores + ' ignoré(s), ' + erreurs + ' en erreur. Détail dans la colonne « Résultat ».');
}

// Envoi refusé par une règle (pas une panne) : la ligne est « ignorée ».
class Ignore extends Error {}

// Envoie l'e-mail d'une ligne et l'inscrit comme envoyée. Mêmes règles depuis le menu de la feuille et depuis Clipper :
// jamais à une adresse « ne plus contacter » ni deux fois à la même adresse, et le quota du jour garde de quoi répondre.
function envoyerLigne(feuille, l, lignes) {
  const cle = String(l.v[COL.email]).trim().toLowerCase();
  const memeAdresse = lignes.filter((x) => String(x.v[COL.email]).trim().toLowerCase() === cle);
  if (memeAdresse.some((x) => x.v[COL.stop] === true)) throw new Ignore('ne plus contacter');
  if (memeAdresse.some((x) => x.v[COL.envoye])) throw new Ignore('déjà contacté');
  if (MailApp.getRemainingDailyQuota() - MARGE_QUOTA <= 0) throw new Error('quota Gmail du jour presque atteint, réessaie demain');
  const m = messageProspect(l.v);
  MailApp.sendEmail({ to: m.email, name: EXPEDITEUR, subject: m.objet, body: m.texte, htmlBody: m.html });
  const maintenant = new Date();
  feuille.getRange(l.numero, COL.envoye + 1).setValue(maintenant);
  feuille.getRange(l.numero, COL.relanceLe + 1).setValue(dateRelance(maintenant));
  feuille.getRange(l.numero, COL.envoyer + 1).setValue(false);
  feuille.getRange(l.numero, COL.resultat + 1).setValue('Envoyé');
  l.v[COL.envoye] = maintenant; // les lignes suivantes du même envoi voient l'adresse comme contactée
}

// Envoie le premier prospect coché à ta propre adresse, sans rien changer dans la feuille.
function apercuProspect() {
  const ui = SpreadsheetApp.getUi();
  const ligne = lireProspects().lignes.find((l) => l.v[COL.envoyer] === true);
  if (!ligne) return ui.alert('Coche une ligne dans « Envoyer » pour l\'aperçu.');
  try {
    const m = messageProspect(ligne.v);
    MailApp.sendEmail({ to: DESTINATAIRE, name: EXPEDITEUR, subject: '[Aperçu] ' + m.objet, body: m.texte, htmlBody: m.html });
    ui.alert('Aperçu envoyé sur ' + DESTINATAIRE + '.');
  } catch (erreur) {
    ui.alert('Ligne ' + ligne.numero + ' : ' + erreur.message);
  }
}

// Écrit le texte de relance des prospects dont la date est atteinte. Rien n'est envoyé :
// copier le texte, répondre au premier e-mail dans Gmail, puis cocher « Relancé ».
function preparerRelances() {
  const ui = SpreadsheetApp.getUi();
  const { feuille, lignes } = lireProspects();
  const aujourdhui = new Date();
  let prets = 0, incomplets = 0;
  lignes.forEach((l) => {
    const prevue = l.v[COL.relanceLe];
    if (!(prevue instanceof Date) || prevue > aujourdhui || l.v[COL.relance] === true || l.v[COL.stop] === true || l.v[COL.repondu] === true) return;
    const cellule = feuille.getRange(l.numero, COL.texteRelance + 1);
    try {
      cellule.setValue(texteRelance(l.v));
      prets++;
    } catch (erreur) {
      cellule.setValue('À compléter : ' + erreur.message);
      incomplets++;
    }
  });
  ui.alert(prets ? prets + ' relance(s) prête(s) dans la colonne « Texte de relance ». Pour chacune : dans Gmail, ouvre l\'e-mail envoyé, ' +
    'clique sur Répondre, colle le texte, envoie, puis coche « Relancé ».' + (incomplets ? '\n' + incomplets + ' ligne(s) à compléter (Sujet, Passage).' : '')
    : incomplets ? incomplets + ' ligne(s) à relancer, mais il manque Sujet ou Passage.' : 'Aucune relance due aujourd\'hui.');
}

// --- Compteur de visites des pages de livraison ----------------------------------------
// Clipper pose en bas de chaque page de prospection une image vide qui appelle ce script avec
// page=<nom de la page> (site Netlify ou dossier R2). La ligne de l'onglet « Prospects » dont le lien porte ce nom gagne une visite,
// seulement après l'envoi de l'e-mail (tes vérifications d'avant ne comptent pas). Aucun cookie, aucune
// donnée sur le visiteur : seulement le nombre d'ouvertures et la date de la dernière.

function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'visites') return visitesPourClipper(e.parameter.jeton);
  if (e && e.parameter && e.parameter.action === 'prospects') return prospectsPourClipper(e.parameter.jeton);
  try {
    const page = String((e && e.parameter && e.parameter.page) || '').trim().toLowerCase();
    if (/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(page) && sousLaLimite('visite:' + page, MAX_VISITES_PAR_HEURE, 3600)) {
      compterVisite(page);
    }
  } catch (erreur) {
    console.error('Visite non comptée', erreur);
  }
  return ContentService.createTextOutput('');
}

// Pour le tableau de bord de Clipper : ouvertures de chaque page, sans aucune donnée personnelle
// (ni e-mail, ni prénom) — nom de la page, date d'envoi, nombre et date des ouvertures.
// Protégé par un jeton secret : propriété du script JETON_CLIPPER, la même que SUIVI_JETON dans le .env de Clipper.
function visitesPourClipper(jeton) {
  const attendu = PropertiesService.getScriptProperties().getProperty('JETON_CLIPPER') || '';
  const json = (objet) => ContentService.createTextOutput(JSON.stringify(objet)).setMimeType(ContentService.MimeType.JSON);
  if (attendu.length < 20 || String(jeton || '') !== attendu || !sousLaLimite('visites-clipper', 120, 3600)) {
    return json({ ok: false });
  }
  const pages = {};
  lireProspects().lignes.forEach((l) => {
    const page = nomDuSite(l.v[COL.lien]);
    const envoi = l.v[COL.envoye];
    if (!page || !(envoi instanceof Date)) return;
    const derniere = l.v[COL.derniereVisite];
    const premiere = l.v[COL.premiereVisite];
    pages[page] = {
      envoye: envoi.toISOString(),
      visites: Number(l.v[COL.visites]) || 0,
      premiere: premiere instanceof Date ? premiere.toISOString() : null,
      derniere: derniere instanceof Date ? derniere.toISOString() : null,
      repondu: l.v[COL.repondu] === true,
      stop: l.v[COL.stop] === true,
    };
  });
  return json({ ok: true, pages: pages });
}

// --- Page Prospects de Clipper -------------------------------------------------------------
// Clipper lit et modifie l'onglet « Prospects » (la feuille reste le stockage : visites, formulaires et livraisons y
// arrivent déjà). Ici, les données personnelles (e-mail, prénom) partent vers Clipper : même jeton secret que les visites.
const CHAMPS_CLIPPER = { email: 200, prenom: 60, chaine: 120, lien: 300, phrase: LONGUEUR_MAX, objet: 80, sujet: 120, passage: 300, invite: 80 };

function jetonClipper(jeton, cle) {
  const attendu = PropertiesService.getScriptProperties().getProperty('JETON_CLIPPER') || '';
  return attendu.length >= 20 && String(jeton || '') === attendu && sousLaLimite(cle, 600, 3600);
}

function prospectJson(l) {
  const v = l.v;
  const iso = (d) => (d instanceof Date ? d.toISOString() : null);
  let apercu = null, erreur = '', relance = '';
  try { const m = messageProspect(v); apercu = { a: m.email, objet: m.objet, texte: m.texte }; } catch (e) { erreur = e.message; }
  try { relance = texteRelance(v); } catch (e) { relance = ''; }
  const champ = (k) => String(v[COL[k]] == null ? '' : v[COL[k]]).trim();
  return {
    ligne: l.numero, email: champ('email'), prenom: champ('prenom'), chaine: champ('chaine'), lien: champ('lien'),
    page: nomDuSite(v[COL.lien]), phrase: champ('phrase'), objet: champ('objet'), sujet: champ('sujet'), passage: champ('passage'),
    invite: champ('invite'), nb: parseInt(v[COL.nb], 10) || 0, envoye: iso(v[COL.envoye]), resultat: champ('resultat'),
    stop: v[COL.stop] === true, repondu: v[COL.repondu] === true, relanceLe: iso(v[COL.relanceLe]), relance: v[COL.relance] === true,
    visites: Number(v[COL.visites]) || 0, premiere: iso(v[COL.premiereVisite]), derniere: iso(v[COL.derniereVisite]),
    apercu: apercu, erreur: erreur, texteRelance: relance,
  };
}

function prospectsPourClipper(jeton) {
  const json = (objet) => ContentService.createTextOutput(JSON.stringify(objet)).setMimeType(ContentService.MimeType.JSON);
  if (!jetonClipper(jeton, 'prospects-clipper')) return json({ ok: false });
  const lignes = lireProspects().lignes.filter((l) => [COL.email, COL.chaine, COL.lien].some((c) => String(l.v[c] || '').trim()));
  return json({ ok: true, prospects: lignes.map(prospectJson), quota: Math.max(0, MailApp.getRemainingDailyQuota() - MARGE_QUOTA) });
}

// op : nouveau, modifier, envoyer, apercu (vers ta propre adresse), repondu, stop, relance. Pour une ligne existante,
// `attendu` = son e-mail tel que Clipper l'a lu : si la feuille a bougé entre-temps (tri, ligne supprimée), on refuse.
function prospectDepuisClipper(p) {
  if (!jetonClipper(p.jeton, 'prospect-clipper')) return repondre(false, 'refusé');
  const verrou = LockService.getScriptLock();
  verrou.waitLock(10000);
  try {
    const { feuille, lignes } = lireProspects();
    const ecrireChamps = (numero) => Object.keys(CHAMPS_CLIPPER).forEach((k) => {
      if (p[k] === undefined) return;
      const valeur = protegerFormule(nettoyer(p[k]).slice(0, CHAMPS_CLIPPER[k]));
      if (k === 'email' && valeur && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valeur)) throw new Ignore('adresse e-mail invalide');
      if (k === 'lien' && valeur && !lienSur(valeur)) throw new Ignore('lien invalide (https://… attendu)');
      feuille.getRange(numero, COL[k] + 1).setValue(valeur);
    });
    const relire = (numero) => prospectJson(lireProspects().lignes.find((x) => x.numero === numero));
    if (p.op === 'nouveau') {
      const numero = Math.max(feuille.getLastRow() + 1, 2);
      ecrireChamps(numero);
      return repondre(true, 'Prospect ajouté.', { prospect: relire(numero) });
    }
    const l = lignes.find((x) => x.numero === parseInt(p.ligne, 10));
    if (!l || String(l.v[COL.email]).trim().toLowerCase() !== String(p.attendu || '').trim().toLowerCase()) {
      return repondre(false, 'La feuille a changé depuis : recharge la page.');
    }
    let message = 'Enregistré.';
    if (p.op === 'modifier') ecrireChamps(l.numero);
    else if (p.op === 'envoyer') { envoyerLigne(feuille, l, lignes); message = 'E-mail envoyé depuis ton Gmail.'; }
    else if (p.op === 'apercu') {
      const m = messageProspect(l.v);
      MailApp.sendEmail({ to: DESTINATAIRE, name: EXPEDITEUR, subject: '[Aperçu] ' + m.objet, body: m.texte, htmlBody: m.html });
      message = 'Aperçu envoyé sur ' + DESTINATAIRE + '.';
    } else if (['repondu', 'stop', 'relance'].indexOf(p.op) >= 0) {
      feuille.getRange(l.numero, COL[p.op] + 1).setValue(p.valeur !== '0');
    } else return repondre(false, 'action inconnue');
    return repondre(true, message, { prospect: relire(l.numero) });
  } catch (erreur) {
    return repondre(false, erreur.message);
  } finally {
    verrou.releaseLock();
  }
}

// Clipper vient de mettre une page en ligne : il inscrit le lien dans l'onglet « Prospects » (plus de copier-coller).
// Ligne choisie : celle qui a déjà ce lien (mise à jour) ; sinon la première ligne de cette chaîne ou de cet e-mail
// sans lien ni envoi ; sinon une nouvelle ligne. E-mail, prénom, chaîne, sujet, passage et invité envoyés par Clipper
// ne remplissent que les cases vides. Protégé par le même jeton que la lecture des visites.
function livraisonDepuisClipper(p) {
  const attendu = PropertiesService.getScriptProperties().getProperty('JETON_CLIPPER') || '';
  if (attendu.length < 20 || String(p.jeton || '') !== attendu || !sousLaLimite('livraison-clipper', 120, 3600)) {
    return repondre(false, 'refusé');
  }
  const page = String(p.page || '').trim().toLowerCase();
  const lien = nettoyer(p.lien);
  if (!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(page) || !/^https:\/\/[^\s"'<>]+$/.test(lien) || nomDuSite(lien) !== page) {
    return repondre(false, 'lien ou nom de page invalide');
  }
  const chaine = protegerFormule(nettoyer(p.chaine).slice(0, 120));
  const nb = Math.max(0, Math.min(99, parseInt(p.nb, 10) || 0));
  const simple = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

  // Ce que Clipper sait déjà (contact du client, ébauche de l'e-mail) : écrit seulement dans les cases vides,
  // jamais par-dessus ce que tu as saisi dans la feuille.
  const email = nettoyer(p.email).slice(0, 200);
  const emailValide = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
  const complements = [
    [COL.email, emailValide],
    [COL.prenom, nettoyer(p.prenom).slice(0, 60)],
    [COL.chaine, chaine],
    [COL.sujet, nettoyer(p.sujet).slice(0, 120)],
    [COL.passage, nettoyer(p.passage).slice(0, 300)],
    [COL.objet, nettoyer(p.objet).slice(0, 80)],
    [COL.invite, nettoyer(p.invite).slice(0, 80)],
  ];
  const vide = (ligne, col) => !String(ligne.v[col] == null ? '' : ligne.v[col]).trim();

  const verrou = LockService.getScriptLock();
  verrou.waitLock(10000);
  try {
    const { feuille, lignes } = lireProspects();
    // Écrit lien, nombre de clips et cases vides ; renvoie le détail pour le message affiché dans Clipper.
    const ecrire = (ligne) => {
      feuille.getRange(ligne.numero, COL.lien + 1).setValue(lien);
      if (nb) feuille.getRange(ligne.numero, COL.nb + 1).setValue(nb);
      const remplies = [];
      complements.forEach(([col, valeur]) => {
        if (valeur && vide(ligne, col)) {
          feuille.getRange(ligne.numero, col + 1).setValue(protegerFormule(valeur));
          remplies.push(COLONNES[col]);
        }
      });
      const manque = [COL.email, COL.prenom, COL.sujet, COL.passage]
        .filter((c) => vide(ligne, c) && !complements.some(([col, valeur]) => col === c && valeur))
        .map((c) => COLONNES[c]);
      return (remplies.length ? ' ; rempli : ' + remplies.join(', ') : '') + (manque.length ? ' ; à compléter : ' + manque.join(', ') : '');
    };
    const deja = lignes.find((l) => nomDuSite(l.v[COL.lien]) === page);
    if (deja) {
      return repondre(true, 'lien mis à jour' + ecrire(deja), { ligne: deja.numero, action: 'mise_a_jour' });
    }
    // Ligne préparée à la main pour ce créateur (même chaîne ou même e-mail), pas encore liée ni envoyée.
    const libre = lignes.find((l) => vide(l, COL.lien) && !l.v[COL.envoye] &&
      ((chaine && simple(l.v[COL.chaine]) === simple(chaine)) || (emailValide && simple(l.v[COL.email]) === simple(emailValide))));
    if (libre) {
      return repondre(true, 'lien inscrit' + ecrire(libre), { ligne: libre.numero, action: 'rempli' });
    }
    // Première ligne vraiment vide (les cases à cocher pré-remplies font descendre « la dernière ligne » de la feuille).
    const libreVide = lignes.find((l) => [COL.email, COL.chaine, COL.lien].every((c) => vide(l, c)) && !l.v[COL.envoye]);
    const ligne = libreVide || { numero: feuille.getLastRow() + 1, v: [] };
    const detail = ecrire(ligne);
    if (!libreVide) [COL.envoyer, COL.stop, COL.relance, COL.repondu].forEach((c) => feuille.getRange(ligne.numero, c + 1).insertCheckboxes());
    return repondre(true, 'ligne ajoutée' + detail, { ligne: ligne.numero, action: 'ajoutee' });
  } finally {
    verrou.releaseLock();
  }
}

function compterVisite(page) {
  const feuille = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ONGLET_PROSPECTS);
  if (!feuille || feuille.getLastRow() < 2) return;
  const verrou = LockService.getScriptLock();
  verrou.waitLock(10000);
  try {
    const maintenant = new Date();
    lireProspects().lignes.forEach((l) => {
      const envoi = l.v[COL.envoye];
      if (nomDuSite(l.v[COL.lien]) !== page || !(envoi instanceof Date) || envoi > maintenant) return;
      feuille.getRange(l.numero, COL.visites + 1).setValue((Number(l.v[COL.visites]) || 0) + 1);
      feuille.getRange(l.numero, COL.derniereVisite + 1).setValue(maintenant);
      if (!(l.v[COL.premiereVisite] instanceof Date)) feuille.getRange(l.numero, COL.premiereVisite + 1).setValue(maintenant);
    });
  } finally {
    verrou.releaseLock();
  }
}

// Nom de la page dans le lien envoyé :
//   « https://karim-rap-7k3q.netlify.app/ »                    → « karim-rap-7k3q » (Netlify, nom du site)
//   « https://pub-xxxx.r2.dev/karim-rap-7k3q/index.html »      → « karim-rap-7k3q » (Cloudflare R2, dossier)
function nomDuSite(lien) {
  const texte = String(lien || '').trim().toLowerCase();
  const r2 = texte.match(/^https:\/\/[a-z0-9-]+\.r2\.dev\/([a-z0-9-]+)\//);
  if (r2) return r2[1];
  const m = texte.match(/^https?:\/\/([a-z0-9-]+)\./);
  return m ? m[1] : '';
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
