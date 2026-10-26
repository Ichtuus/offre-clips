// Reçoit les formulaires du site : enregistre chaque demande dans la feuille,
// prévient Nicolas par e-mail, puis envoie l'accusé de réception au visiteur.
// La demande est enregistrée AVANT les e-mails : si un envoi échoue, rien n'est perdu.
// Déploiement : voir README.md, section « Formulaires ».

const DESTINATAIRE = 'devichtus.pro@gmail.com';
const SIGNATURE = 'Nicolas Diarra EI';
const SITE = 'https://ichtuus.github.io/offre-clips/';
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

// Version HTML aux couleurs du site. Les messageries ignorent feuilles de style et polices web :
// tableaux et styles en ligne, polices de repli proches (Helvetica/Arial pour Inter Tight, Menlo/Consolas pour le reste).
function accuseHtml(a) {
  const grotesk = "'Inter Tight','Helvetica Neue',Helvetica,Arial,sans-serif";
  const mono = "'JetBrains Mono',Menlo,Consolas,'Courier New',monospace";
  const encre = '#1e1e1e';
  const etapes = (a.etapes || []).map((e) =>
    '<tr><td style="padding:0 0 18px 0;">' +
      '<div style="border-left:1px solid ' + encre + ';padding-left:12px;">' +
        '<div style="font:700 12px/1.4 ' + mono + ';color:' + encre + ';margin-bottom:4px;">' + e[0] + '</div>' +
        '<div style="font:400 16px/1.4 ' + grotesk + ';color:#3d3d3d;">' + e[1] + '</div>' +
      '</div>' +
    '</td></tr>').join('');
  const encadre = a.encadre
    ? '<tr><td style="padding:6px 0 22px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f386a1;border:2px solid ' + encre + ';">' +
        '<tr><td style="padding:14px 16px;font:500 16px/1.4 ' + grotesk + ';color:' + encre + ';">' + a.encadre + '</td></tr></table></td></tr>'
    : '';
  return '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="color-scheme" content="light only"><title>' + a.objet + '</title></head>' +
    '<body style="margin:0;padding:0;background:#fefefe;">' +
    // Texte d'aperçu affiché par la messagerie à côté de l'objet, invisible dans l'e-mail.
    '<div style="display:none;max-height:0;overflow:hidden;">' + a.intro + '</div>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fefefe;"><tr><td align="center" style="padding:0;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">' +

    // En-tête : ciel du site, boîtes blanche et noire, fenêtre rétro.
    '<tr><td bgcolor="#9fbfe3" style="background:#9fbfe3;background-image:linear-gradient(135deg,#d45bb6 0%,#9a6cf0 30%,#7aa8d6 60%,#b3cde9 100%);padding:14px 16px 34px 16px;">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' +
        '<td align="left"><span style="background:#fefefe;color:' + encre + ';font:500 15px/28px ' + grotesk + ';padding:4px 7px;">Nicolas Diarra — Clips</span></td>' +
        '<td align="right"><span style="background:' + encre + ';color:#fefefe;font:500 15px/28px ' + grotesk + ';padding:4px 7px;">' + a.etiquette + '</span></td>' +
      '</tr></table>' +
      '<table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:34px auto 0 auto;width:280px;max-width:100%;border:2px solid ' + encre + ';background:#dedede;">' +
        '<tr><td style="background:' + encre + ';color:#dedede;font:400 13px/22px ' + mono + ';padding:0 8px;">' + a.fenetre + '</td></tr>' +
        '<tr><td style="padding:14px 12px;font:400 16px/1.3 ' + mono + ';color:' + encre + ';text-align:center;">' + a.statut + '</td></tr>' +
      '</table>' +
    '</td></tr>' +

    // Corps
    '<tr><td style="padding:34px 20px 8px 20px;">' +
      '<h1 style="margin:0 0 22px 0;font:500 36px/1 ' + grotesk + ';color:' + encre + ';letter-spacing:-0.5px;">' + a.titre + '</h1>' +
      '<p style="margin:0 0 24px 0;font:400 17px/1.45 ' + grotesk + ';color:#3d3d3d;">' + a.intro + '</p>' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + etapes + encadre + '</table>' +
      '<p style="margin:0 0 6px 0;font:400 17px/1.45 ' + grotesk + ';color:#3d3d3d;">' + a.question + '</p>' +
      '<p style="margin:18px 0 0 0;font:500 17px/1.45 ' + grotesk + ';color:' + encre + ';">' + a.salut + '</p>' +
    '</td></tr>' +

    // Pied
    '<tr><td style="padding:30px 20px 34px 20px;">' +
      '<div style="height:24px;border-top:2px solid #858585;"></div>' +
      '<p style="margin:0 0 8px 0;font:400 12px/1.5 ' + mono + ';color:' + encre + ';">' + SIGNATURE + ' · <a href="' + SITE + '" style="color:' + encre + ';">ichtuus.github.io/offre-clips</a></p>' +
      '<p style="margin:0;font:400 12px/1.5 ' + mono + ';color:#6b6b6b;">' + a.rappel + '</p>' +
    '</td></tr>' +

    '</table></td></tr></table></body></html>';
}

// Envoie les 3 accusés (essai, résiliation, rétractation) à ta propre adresse pour voir le rendu
// (à lancer depuis l'éditeur Apps Script).
function testerAccuse() {
  Object.keys(TYPES).forEach((cle) => {
    const a = TYPES[cle].accuse;
    MailApp.sendEmail({ to: DESTINATAIRE, name: SIGNATURE, subject: '[Test] ' + a.objet, body: accuseTexte(a), htmlBody: accuseHtml(a) });
  });
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
