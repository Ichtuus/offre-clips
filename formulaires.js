// Formulaires envoyés par FormSubmit, qui transmet chaque envoi par e-mail.
// L'envoi est un POST classique (pas d'AJAX) : c'est la seule façon d'avoir
// l'accusé de réception automatique (_autoresponse) de FormSubmit.

const CONTACT = 'devichtus.pro@gmail.com';
const DELAI_BLOCAGE_MS = 20000;

// Adresses complètes exigées par FormSubmit, calculées ici pour marcher
// en local comme sur GitHub Pages.
document.querySelectorAll('input[name="_next"]').forEach((champ) => {
  champ.value = new URL('merci.html', location.href).href;
});
document.querySelectorAll('input[name="_url"]').forEach((champ) => {
  champ.value = location.href.split('#')[0];
});

// Zone de message lue par les lecteurs d'écran, sous les boutons.
function zoneStatut(form) {
  let zone = form.querySelector('.statut');
  if (!zone) {
    zone = document.createElement('p');
    zone.className = 'statut';
    zone.setAttribute('role', 'status');
    zone.setAttribute('aria-live', 'polite');
    form.querySelector('.contenu').append(zone);
  }
  return zone;
}

function afficher(form, texte, erreur = false) {
  const zone = zoneStatut(form);
  zone.textContent = texte;
  zone.classList.toggle('erreur', erreur);
}

function boutonEnvoi(form) {
  return form.querySelector('button[type="submit"]');
}

function debloquer(form) {
  const bouton = boutonEnvoi(form);
  delete form.dataset.envoi;
  form.removeAttribute('aria-busy');
  bouton.disabled = false;
  if (bouton.dataset.libelle) bouton.textContent = bouton.dataset.libelle;
  clearTimeout(Number(form.dataset.minuteur));
}

document.querySelectorAll('form.formulaire').forEach((form) => {
  form.addEventListener('submit', (evenement) => {
    // Un seul envoi à la fois : les clics suivants sont ignorés.
    if (form.dataset.envoi) {
      evenement.preventDefault();
      return;
    }
    if (!navigator.onLine) {
      evenement.preventDefault();
      afficher(form, `Pas de connexion internet. Vérifiez votre connexion puis réessayez, ou écrivez à ${CONTACT}.`, true);
      return;
    }

    const bouton = boutonEnvoi(form);
    form.dataset.envoi = '1';
    form.setAttribute('aria-busy', 'true');
    bouton.dataset.libelle = bouton.textContent;
    bouton.textContent = 'Envoi en cours…';
    // Désactivé après le départ de l'envoi, sinon le navigateur l'annulerait.
    setTimeout(() => { bouton.disabled = true; }, 0);
    afficher(form, 'Envoi en cours… Une vérification anti-robot peut s\'afficher.');

    // Si la page n'a toujours pas changé, l'envoi a échoué ou bloque.
    form.dataset.minuteur = String(setTimeout(() => {
      debloquer(form);
      afficher(form, `L'envoi n'a pas abouti. Réessayez dans un instant, ou écrivez directement à ${CONTACT}.`, true);
    }, DELAI_BLOCAGE_MS));
  });
});

// Retour arrière depuis la page de FormSubmit : le navigateur peut restaurer
// la page telle quelle, bouton bloqué compris. On la remet en état.
window.addEventListener('pageshow', (evenement) => {
  if (!evenement.persisted) return;
  document.querySelectorAll('form.formulaire').forEach((form) => {
    if (!form.dataset.envoi) return;
    debloquer(form);
    afficher(form, 'Envoi interrompu. Vous pouvez renvoyer le formulaire.', true);
  });
});

// Résiliation : récapitulatif à vérifier avant la notification (art. D215-3 C. conso).
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
      valeur.textContent = champ.value || '—';  // textContent : aucune injection possible
      liste.append(intitule, valeur);
    });
    saisie.hidden = true;
    recap.hidden = false;
    recap.querySelector('button[type="submit"]').focus();
  });

  resiliation.querySelector('[data-modifier]').addEventListener('click', () => {
    recap.hidden = true;
    saisie.hidden = false;
    saisie.querySelector('input').focus();
  });
}
