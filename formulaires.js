// Envoi des formulaires du site, sans jamais perdre une demande :
// 1. la demande est d'abord gardée dans le navigateur du visiteur ;
// 2. envoi au script Google (adresse = attribut action du formulaire), qui l'enregistre
//    dans la feuille puis envoie les e-mails (voir apps-script/Code.gs) ;
// 3. en cas de panne, envoi de secours par FormSubmit ;
// 4. si tout échoue, la demande reste gardée et repart automatiquement à la prochaine
//    visite ; le visiteur peut aussi réessayer ou l'envoyer depuis sa messagerie.

const CONTACT = 'devichtus.pro@gmail.com';
// Envoi de secours si le script Google ne répond pas.
const SECOURS = 'https://formsubmit.co/ajax/devichtus.pro@gmail.com';
const DELAI_MS = 15000;
const CLE_ATTENTE = 'envois-en-attente';
const CONSERVATION_MS = 30 * 24 * 3600 * 1000;
const LIBELLES = {
  essai: 'Essai : 3 clips gratuits',
  resiliation: 'Notification de résiliation',
  retractation: 'Rétractation',
};

// --- Demandes en attente, gardées dans le navigateur -----------------------

function lireAttente() {
  try {
    const liste = JSON.parse(localStorage.getItem(CLE_ATTENTE)) || [];
    return liste.filter((d) => Date.now() - d.date < CONSERVATION_MS);
  } catch {
    return [];
  }
}

function ecrireAttente(liste) {
  try {
    if (liste.length) localStorage.setItem(CLE_ATTENTE, JSON.stringify(liste));
    else localStorage.removeItem(CLE_ATTENTE);
  } catch {
    // Stockage indisponible (navigation privée stricte) : l'envoi continue quand même.
  }
}

function garder(demande) {
  ecrireAttente(lireAttente().filter((d) => d.id !== demande.id).concat(demande));
}

function oublier(id) {
  ecrireAttente(lireAttente().filter((d) => d.id !== id));
}

// --- Envoi -----------------------------------------------------------------

// POST avec délai maximal. Lève une erreur pour toute panne : réseau, délai,
// code HTTP d'erreur, réponse qui n'est pas du JSON.
async function poster(url, champs) {
  const controleur = new AbortController();
  const minuteur = setTimeout(() => controleur.abort(), DELAI_MS);
  try {
    const reponse = await fetch(url, {
      method: 'POST',
      body: new URLSearchParams(champs),
      headers: { Accept: 'application/json' },
      signal: controleur.signal,
    });
    if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`);
    return await reponse.json();
  } finally {
    clearTimeout(minuteur);
  }
}

// Renvoie { ok, canal, accuse } en cas de succès, { ok: false, refus } si la
// demande est refusée (saisie invalide), { ok: false } si tous les envois ont échoué.
async function envoyer(demande) {
  try {
    const r = await poster(demande.principal, { ...demande.champs, type: demande.type, id: demande.id, page: demande.page });
    if (r.ok) return { ok: true, canal: 'principal', accuse: r.accuse !== false };
    if (r.refus) return { ok: false, refus: r.message };
    console.warn('Envoi principal en erreur :', r.message);
  } catch (erreur) {
    console.warn('Envoi principal échoué :', erreur);
  }

  try {
    const r = await poster(SECOURS, {
      ...demande.champs,
      _subject: `[Secours] ${LIBELLES[demande.type]}`,
      _template: 'table',
      identifiant: demande.id,
      page: demande.page,
    });
    if (String(r.success) === 'true') return { ok: true, canal: 'secours', accuse: false };
    console.warn('Envoi de secours refusé :', r.message);
  } catch (erreur) {
    console.warn('Envoi de secours échoué :', erreur);
  }
  return { ok: false };
}

// Renvoie les demandes restées en attente (visite suivante, retour du réseau).
const enCours = new Set();
async function relancerAttente() {
  if (!navigator.onLine) return;
  for (const demande of lireAttente()) {
    if (enCours.has(demande.id)) continue;
    enCours.add(demande.id);
    try {
      const resultat = await envoyer(demande);
      if (resultat.ok || resultat.refus) oublier(demande.id);
    } finally {
      enCours.delete(demande.id);
    }
  }
}

// --- Affichage ---------------------------------------------------------------

function zoneStatut(form) {
  let zone = form.querySelector('.statut');
  if (!zone) {
    zone = document.createElement('div');
    zone.className = 'statut';
    zone.setAttribute('role', 'status');
    zone.setAttribute('aria-live', 'polite');
    form.querySelector('.contenu').append(zone);
  }
  return zone;
}

function afficher(form, texte, erreur = false) {
  const zone = zoneStatut(form);
  const p = document.createElement('p');
  p.textContent = texte;
  zone.replaceChildren(p);
  zone.classList.toggle('erreur', erreur);
  return zone;
}

function boutonEnvoi(form) {
  return form.querySelector('button[type="submit"]');
}

function bloquer(form) {
  const bouton = boutonEnvoi(form);
  form.dataset.envoi = '1';
  form.setAttribute('aria-busy', 'true');
  bouton.dataset.libelle ||= bouton.textContent;
  bouton.textContent = 'Envoi en cours…';
  bouton.disabled = true;
}

function debloquer(form) {
  const bouton = boutonEnvoi(form);
  delete form.dataset.envoi;
  form.removeAttribute('aria-busy');
  bouton.disabled = false;
  if (bouton.dataset.libelle) bouton.textContent = bouton.dataset.libelle;
}

// Texte lisible de la demande, avec les intitulés des champs.
function resume(form, demande) {
  const lignes = [...form.querySelectorAll('input[id]')].map((champ) => {
    const intitule = form.querySelector(`label[for="${champ.id}"]`)?.textContent ?? champ.name;
    return `${intitule} : ${champ.value || '—'}`;
  });
  return `${LIBELLES[demande.type]}\n\n${lignes.join('\n')}\n\nRéférence : ${demande.id}`;
}

function bouton(texte, action) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'bouton-terminal secondaire';
  b.textContent = texte;
  b.addEventListener('click', action);
  return b;
}

// Échec de tous les envois : la demande est gardée, et le visiteur a trois issues.
function afficherEchec(form, demande) {
  const zone = afficher(form, "L'envoi n'a pas abouti. Votre demande est gardée sur cet appareil et repartira automatiquement à votre prochaine visite. Vous pouvez aussi :", true);
  const texte = resume(form, demande);
  const actions = document.createElement('div');
  actions.className = 'actions-erreur';

  const courriel = document.createElement('a');
  courriel.className = 'bouton-terminal secondaire';
  courriel.href = `mailto:${CONTACT}?subject=${encodeURIComponent(LIBELLES[demande.type])}&body=${encodeURIComponent(texte)}`;
  courriel.textContent = 'Envoyer par e-mail';

  const copier = bouton('Copier ma demande', async () => {
    try {
      await navigator.clipboard.writeText(texte);
      copier.textContent = 'Copié ✓';
    } catch {
      copier.textContent = 'Copie impossible';
    }
  });

  actions.append(bouton('Réessayer', () => form.requestSubmit(boutonEnvoi(form))), courriel, copier);
  zone.append(actions);
}

// --- Formulaires ---------------------------------------------------------------

function nouvelIdentifiant() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

document.querySelectorAll('form.formulaire').forEach((form) => {
  // Saisie modifiée : c'est une nouvelle demande, avec une nouvelle référence.
  form.addEventListener('input', () => { delete form.dataset.reference; });

  form.addEventListener('submit', async (evenement) => {
    evenement.preventDefault();
    if (form.dataset.envoi) return; // un seul envoi à la fois

    // Une nouvelle tentative réutilise la même référence : pas de doublon côté feuille.
    form.dataset.reference ||= nouvelIdentifiant();
    const demande = {
      id: form.dataset.reference,
      type: form.dataset.type,
      principal: form.action,
      page: location.href.split('#')[0],
      date: Date.now(),
      champs: Object.fromEntries(new FormData(form)),
    };

    bloquer(form);
    afficher(form, 'Envoi en cours…');
    garder(demande);
    enCours.add(demande.id);

    let resultat = { ok: false };
    try {
      if (navigator.onLine) resultat = await envoyer(demande);
    } catch (erreur) {
      console.error(erreur); // erreur imprévue : traitée comme un échec, la demande reste gardée
    } finally {
      enCours.delete(demande.id);
    }

    if (resultat.ok) {
      oublier(demande.id);
      const merci = new URL('merci.html', location.href);
      merci.searchParams.set('accuse', resultat.accuse ? '1' : '0');
      location.assign(merci);
      return;
    }
    debloquer(form);
    if (resultat.refus) {
      oublier(demande.id);
      afficher(form, resultat.refus, true);
    } else if (!navigator.onLine) {
      afficherEchec(form, demande);
      zoneStatut(form).querySelector('p').textContent =
        "Pas de connexion internet. Votre demande est gardée sur cet appareil et partira dès que la connexion reviendra. Vous pouvez aussi :";
    } else {
      afficherEchec(form, demande);
    }
  });
});

// Retour arrière : le navigateur peut restaurer la page avec le bouton bloqué.
window.addEventListener('pageshow', (evenement) => {
  if (!evenement.persisted) return;
  document.querySelectorAll('form.formulaire[data-envoi]').forEach(debloquer);
});

window.addEventListener('online', relancerAttente);
relancerAttente();

// --- Page de remerciement : confirmation par e-mail envoyée ou non -----------

const detailMerci = document.querySelector('#merci-detail');
if (detailMerci && new URLSearchParams(location.search).get('accuse') === '0') {
  detailMerci.textContent = 'Votre demande est bien enregistrée. La confirmation par e-mail vous sera envoyée sous peu.';
}

// --- Résiliation : récapitulatif à vérifier avant la notification (art. D215-3 C. conso)

const resiliation = document.querySelector('#form-resiliation');
if (resiliation) {
  const saisie = resiliation.querySelector('.saisie');
  const recap = resiliation.querySelector('.recap');

  resiliation.querySelector('[data-verifier]').addEventListener('click', () => {
    if (!resiliation.reportValidity()) return;
    const liste = recap.querySelector('dl');
    liste.replaceChildren();
    saisie.querySelectorAll('input').forEach((champ) => {
      const intitule = document.createElement('dt');
      intitule.textContent = resiliation.querySelector(`label[for="${champ.id}"]`).textContent;
      const valeur = document.createElement('dd');
      valeur.textContent = champ.value || '—'; // textContent : aucune injection possible
      liste.append(intitule, valeur);
    });
    saisie.hidden = true;
    recap.hidden = false;
    boutonEnvoi(resiliation).focus();
  });

  resiliation.querySelector('[data-modifier]').addEventListener('click', () => {
    recap.hidden = true;
    saisie.hidden = false;
    saisie.querySelector('input').focus();
  });
}
