# Site de l'offre — clips pour créateurs

Site statique (HTML + CSS, aucune dépendance) hébergé sur GitHub Pages.

- `index.html` : l'offre (accroche, exemples, inclus, prix, essai gratuit)
- `cgv.html` : conditions générales de vente, clients particuliers et professionnels
- `mentions-legales.html`, `confidentialite.html`
- `resilier.html` : fonction « Résilier votre contrat » avec récapitulatif (obligatoire, art. L215-1-1 C. conso)
- `retractation.html` : fonction « Renoncer au contrat ici » (obligatoire depuis le 19 juin 2026, art. L221-21 C. conso)
- `formulaires.js` : récapitulatif de résiliation, page de retour après envoi
- `merci.html` : page affichée après l'envoi d'un formulaire
- `style.css` : direction artistique reprise de typesafe.ai (couleurs et tailles relevées dans leur code)
- `fonts/` : Inter Tight, JetBrains Mono, VT323, sous licence OFL, hébergées ici (aucune requête vers Google)

Aperçu local : `python3 -m http.server 8765` puis http://localhost:8765

## À compléter avant la mise en ligne

Tout ce qui manque est surligné en rouge sur le site : `grep -n "todo" *.html`

- [ ] **Téléphone** : retiré pendant la phase de test, alors qu'il est obligatoire (mentions légales : LCEN art. 1-1 ; CGV : art. L111-1 et R111-1 C. conso). À remettre avant d'ouvrir l'offre plus largement.
- [ ] **Médiateur de la consommation** : retiré pendant la phase de test, alors qu'il est obligatoire dès qu'on vend à des particuliers (art. L612-1 et L616-1 C. conso, amende jusqu'à 3 000 €). Adhérer à un médiateur agréé (https://www.economie.gouv.fr/mediation-conso), puis rétablir la phrase de l'article 18 des CGV.
- [ ] Assurance : le contrat RC Pro Orus/Hiscox ne couvre que le développement logiciel, pas le montage vidéo. Demander à Orus d'ajouter cette activité, puis la mentionner à l'article 15 des CGV (assureur, couverture géographique).
- [ ] Les 3 exemples avant/après, uniquement avec l'**accord écrit** du créateur
- [ ] Vérifier que les clips et transcriptions sont bien supprimés 90 jours après livraison (engagement de la politique de confidentialité). Aujourd'hui, `clipper clean` ne supprime que la source et l'audio.
- [ ] Activité déclarée : code APE 62.01Z (programmation informatique). Ajouter le montage vidéo à l'activité déclarée (démarche gratuite sur formalites.entreprises.gouv.fr).

## Formulaires

Les trois formulaires (essai, résiliation, rétractation) sont dans les pages et envoyés par **FormSubmit** (gratuit, sans compte) vers devichtus.pro@gmail.com. Chaque envoi déclenche un accusé de réception automatique à l'expéditeur.

**Activation, une seule fois, après la mise en ligne :** envoyer soi-même le formulaire d'essai depuis le site en ligne. FormSubmit envoie alors un e-mail d'activation à devichtus.pro@gmail.com : cliquer sur le lien. Avant cette activation, les envois ne sont pas transmis.

Après une résiliation, il faut encore envoyer soi-même au client un e-mail qui confirme la date de fin de son contrat (obligation légale).

## Mise en ligne sur GitHub Pages

```bash
gh repo create offre-clips --public --source . --push
gh api -X POST repos/{owner}/offre-clips/pages -f "source[branch]=main" -f "source[path]=/"
```

Le site est alors en ligne sur `https://<compte>.github.io/offre-clips/`.

Pour un nom de domaine : créer un fichier `CNAME` qui contient le domaine (par exemple `clips-nicolas.fr`). Chez le registrar, ajouter les enregistrements A vers `185.199.108.153`, `185.199.109.153`, `185.199.110.153` et `185.199.111.153` (ou un CNAME `www` vers `<compte>.github.io`). Activer ensuite « Enforce HTTPS » dans Settings → Pages.

Attention : le dépôt sera public. Ne jamais y mettre de factures, de vidéos de clients ni de secrets.

## Sources juridiques

- CGV, mentions obligatoires selon le type de client : https://entreprendre.service-public.gouv.fr/vosdroits/F33527
- Mentions du site, RGPD, résiliation en ligne : https://entreprendre.service-public.gouv.fr/vosdroits/F37351
- Rétractation en ligne depuis le 19/06/2026 : https://www.francenum.gouv.fr/guides-et-conseils/developpement-commercial/gestion-de-la-relation-client/la-retractation-en-1-clic
- Code de la consommation, art. L221-18 à L221-28 (rétractation) et L224-25-12 et suivants (conformité des contenus numériques)

Modèle construit à partir de ces sources officielles. À faire relire par un juriste avant de signer de gros contrats (conseiller gratuit : https://conseillers-entreprises.service-public.gouv.fr).
