// Formulaires envoyés par FormSubmit, qui transmet chaque envoi par e-mail.

// Page affichée après l'envoi : FormSubmit exige une adresse complète,
// calculée ici pour marcher en local comme sur GitHub Pages.
document.querySelectorAll('input[name="_next"]').forEach((champ) => {
  champ.value = new URL('merci.html', location.href).href;
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
      valeur.textContent = champ.value || '—';
      liste.append(intitule, valeur);
    });
    saisie.hidden = true;
    recap.hidden = false;
  });

  resiliation.querySelector('[data-modifier]').addEventListener('click', () => {
    recap.hidden = true;
    saisie.hidden = false;
  });
}
