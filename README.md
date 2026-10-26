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
- [ ] Section avant/après retirée faute d'exemples. La remettre (`git log -- index.html`, commit « Retrait de la section avant/après ») avec de vrais exemples, uniquement avec l'**accord écrit** du créateur.
- [ ] Vérifier que les clips et transcriptions sont bien supprimés 90 jours après livraison (engagement de la politique de confidentialité). Aujourd'hui, `clipper clean` ne supprime que la source et l'audio.
- [ ] Activité déclarée : code APE 62.01Z (programmation informatique). Ajouter le montage vidéo à l'activité déclarée (démarche gratuite sur formalites.entreprises.gouv.fr).

## Formulaires

Les trois formulaires (essai, résiliation, rétractation) sont dans les pages et envoyés par **FormSubmit** (gratuit, sans compte) vers devichtus.pro@gmail.com. Chaque envoi déclenche un accusé de réception automatique à l'expéditeur.

**Activation, une fois par formulaire :** envoyer soi-même chaque formulaire depuis le site en ligne, puis cliquer sur le lien d'activation reçu sur devichtus.pro@gmail.com. Les envois faits avant l'activation sont conservés 30 jours par FormSubmit.

**Sécurité et comportement :**
- bouton grisé et « Envoi en cours… » dès le premier clic ; les clics suivants sont ignorés ;
- message d'erreur si l'appareil est hors ligne ou si l'envoi n'aboutit pas en 20 s ; bouton remis en état au retour arrière ;
- côté FormSubmit : reCAPTCHA (laissé actif, il est aussi nécessaire à l'accusé de réception automatique) et champ piège `_honey` contre les robots ;
- longueur maximale sur chaque champ ;
- politique de sécurité du contenu (CSP) dans chaque page : scripts, styles et polices du site uniquement, formulaires envoyables seulement vers formsubmit.co ;
- le récapitulatif de résiliation insère les saisies en texte brut (`textContent`), jamais en HTML.

Limite : l'envoi est un POST classique, pas de l'AJAX (sinon FormSubmit n'envoie pas d'accusé de réception). Si FormSubmit renvoie une erreur, elle s'affiche sur sa propre page.

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

## Publier une modification

```bash
git commit -am "…"
git -c credential.helper= -c credential.helper='!gh auth git-credential' push
```

Ou, une fois pour toutes, `gh auth setup-git`, puis simplement `git push`. Le site se met à jour en environ une minute.
