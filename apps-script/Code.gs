// Reçoit les formulaires du site : enregistre chaque demande dans la feuille,
// prévient Nicolas par e-mail, puis envoie l'accusé de réception au visiteur.
// La demande est enregistrée AVANT les e-mails : si un envoi échoue, rien n'est perdu.
// Déploiement : voir README.md, section « Formulaires ».

const DESTINATAIRE = 'devichtus.pro@gmail.com';
const SIGNATURE = 'Nicolas Diarra EI';
const LONGUEUR_MAX = 500;
const MAX_PAR_EMAIL_PAR_HEURE = 5;
const MAX_ACCUSES_PAR_JOUR = 80; // quota Gmail gratuit : 100 e-mails par jour

const TYPES = {
  essai: {
    feuille: 'Essais',
    sujet: 'Essai : 3 clips gratuits',
    champs: ['video', 'chaine', 'email'],
    accuse: "Bien reçu ! Je regarde ta vidéo et je t'envoie tes 3 clips sous 48 h ouvrées.\n\n— Nicolas",
  },
  resiliation: {
    feuille: 'Résiliations',
    sujet: 'Notification de résiliation',
    champs: ['nom', 'email', 'reference', 'date_souhaitee'],
    accuse: 'Accusé de réception : votre notification de résiliation a bien été reçue. ' +
      'Vous recevrez sous peu un e-mail confirmant la date de fin de votre contrat.\n\n— ' + SIGNATURE,
  },
  retractation: {
    feuille: 'Rétractations',
    sujet: 'Rétractation',
    champs: ['nom', 'email', 'date_commande', 'reference', 'declaration'],
    accuse: 'Accusé de réception : votre rétractation a bien été reçue. ' +
      'Le remboursement des sommes dues interviendra au plus tard dans les 14 jours.\n\n— ' + SIGNATURE,
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
    MailApp.sendEmail({ to: email, replyTo: DESTINATAIRE, name: SIGNATURE, subject: 'Accusé de réception — ' + type.sujet, body: type.accuse });
    return true;
  } catch (erreur) {
    console.error('Accusé non envoyé', erreur);
    return false;
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
