# Site de l'offre — clips pour créateurs

Site statique (HTML + CSS, aucune dépendance) hébergé sur GitHub Pages.

- `index.html` : l'offre (accroche, exemples, inclus, prix, essai gratuit)
- `cgv.html` : conditions générales de vente, clients particuliers et professionnels
- `mentions-legales.html`, `confidentialite.html`
- `resilier.html` : fonction « Résilier votre contrat » avec récapitulatif (obligatoire, art. L215-1-1 C. conso)
- `retractation.html` : fonction « Renoncer au contrat ici » (obligatoire depuis le 19 juin 2026, art. L221-21 C. conso)
- `formulaires.js` : envoi fiable des formulaires (voir « Formulaires »), récapitulatif de résiliation
- `apps-script/Code.gs` : script Google qui enregistre les demandes et envoie les e-mails
- `merci.html` : page affichée après l'envoi d'un formulaire
- `style.css` : direction artistique reprise de typesafe.ai (couleurs et tailles relevées dans leur code)
- `charte/` : identité unique (`theme.json`) et polices Inter Tight, JetBrains Mono, VT323, sous licence OFL, hébergées ici (aucune requête vers Google) ; `theme.css` en est généré

Aperçu local : `python3 -m http.server 8765` puis http://localhost:8765

## À compléter avant la mise en ligne

Tout ce qui manque est surligné en rouge sur le site : `grep -n "todo" *.html`

- [ ] **Téléphone** : retiré pendant la phase de test, alors qu'il est obligatoire (mentions légales : LCEN art. 1-1 ; CGV : art. L111-1 et R111-1 C. conso). À remettre avant d'ouvrir l'offre plus largement.
- [ ] **Médiateur de la consommation** : retiré pendant la phase de test, alors qu'il est obligatoire dès qu'on vend à des particuliers (art. L612-1 et L616-1 C. conso, amende jusqu'à 3 000 €). Adhérer à un médiateur agréé (https://www.economie.gouv.fr/mediation-conso), puis rétablir la phrase de l'article 18 des CGV.
- [ ] Assurance : le contrat RC Pro Orus/Hiscox ne couvre que le développement logiciel, pas le montage vidéo. Demander à Orus d'ajouter cette activité, puis la mentionner à l'article 15 des CGV (assureur, couverture géographique).
- [ ] Section avant/après retirée faute d'exemples. La remettre (`git log -- index.html`, commit « Retrait de la section avant/après ») avec de vrais exemples, uniquement avec l'**accord écrit** du créateur.
- [ ] Vérifier que les clips et transcriptions sont bien supprimés 90 jours après livraison (engagement de la politique de confidentialité). Aujourd'hui, `clipper clean` ne supprime que la source et l'audio.
- [ ] Activité déclarée : code APE 62.01Z (programmation informatique). Ajouter le montage vidéo à l'activité déclarée (démarche gratuite sur formalites.entreprises.gouv.fr).

## Charte graphique (source unique)

Couleurs, polices, signature, contact et tarifs sont définis **une seule fois** dans `charte/theme.json` (polices dans `charte/fonts/`, licences OFL). Tout le reste en est généré :

| Où | Fichier généré |
|---|---|
| Site | `theme.css` (variables et polices, chargé avant `style.css`, qui ne garde que la mise en page) |
| E-mails (accusés, prospection) | bloc `CHARTE` entre `// <charte>` et `// </charte>` dans `apps-script/Code.gs` |
| Page de livraison Clipper | `Clipper/clipper/presentation/charte.json` et `fonts/` |

Après une modification de la charte :

```bash
node charte/synchroniser.mjs              # régénère tout (Clipper : ../../Clipper, ou --clipper CHEMIN)
node charte/synchroniser.mjs --verifier   # signale ce qui n'est plus à jour, sans rien écrire
```

Puis recoller `Code.gs` dans Apps Script (nouvelle version) et commiter les deux dépôts. Les prix de `index.html` sont écrits à la main : le script vérifie qu'ils correspondent à la charte. Un test de Clipper échoue si sa copie n'est plus à jour.

## Formulaires

Objectif : ne jamais perdre une demande (`formulaires.js`).

1. Au clic, la demande est d'abord gardée dans le navigateur du visiteur.
2. Envoi au **script Google** (`apps-script/Code.gs`, adresse dans l'attribut `action` des formulaires). Il enregistre la demande dans la feuille « Leads » (un onglet par type), **puis** t'envoie un e-mail et envoie l'accusé de réception au visiteur depuis ton Gmail. La colonne « Accusé envoyé » indique quand un accusé est à envoyer à la main.
3. En cas de panne (réseau, délai de 15 s, erreur HTTP, réponse invalide) : **envoi de secours par FormSubmit** (`SECOURS` dans `formulaires.js`).
4. Si tout échoue : la demande reste dans le navigateur et repart automatiquement à la prochaine visite, sur n'importe quelle page, ou au retour du réseau. Le visiteur voit aussi les boutons « Réessayer », « Envoyer par e-mail » (message prérempli) et « Copier ma demande ».

Une référence unique par demande évite les doublons dans la feuille lors des renvois. Un refus (e-mail invalide, trop de demandes) s'affiche sans tenter le secours.

### Mise en place du script Google (une fois, environ 5 minutes)

1. Avec le compte devichtus.pro@gmail.com, créer une feuille Google Sheets nommée « Leads ».
2. Menu Extensions → Apps Script. Remplacer le contenu par celui de `apps-script/Code.gs`, puis enregistrer.
3. Déployer → Nouveau déploiement → type « Application Web ». Exécuter en tant que : **Moi**. Qui a accès : **Tout le monde**. Déployer.
4. Autoriser l'accès. Google affiche « application non validée » : Paramètres avancés → Accéder au projet. C'est ton propre script.
5. Copier l'URL qui finit par `/exec` et la mettre dans l'attribut `action` des 3 formulaires (`index.html`, `resilier.html`, `retractation.html`), à la place de `A_REMPLACER`.

Après une modification de `Code.gs` : Déployer → Gérer les déploiements → modifier → nouvelle version. L'URL ne change pas.

Accusés de réception : e-mails HTML aux couleurs du site (tableaux et styles en ligne, polices de repli), avec une version texte. Textes dans `TYPES` (`accuse`), sans rien reprendre de la saisie du visiteur. Pour voir le rendu : dans l'éditeur Apps Script, choisir la fonction `testerAccuse` puis Exécuter : les 3 accusés (essai, résiliation, rétractation) arrivent sur ton adresse.

### Prospection (onglet « Prospects », menu « Clips »)

À l'ouverture de la feuille, un menu **Clips** apparaît (recharger la feuille après avoir collé un nouveau `Code.gs`).

1. **Clips → Créer ou réparer l'onglet Prospects** (une fois) : colonnes Envoyer, E-mail, Prénom, Chaîne, Lien de la page, Phrase perso, Envoyé le, Ne plus contacter, Résultat.
2. Une ligne par créateur. « Lien de la page » : l'adresse Netlify de sa livraison (`clipper export ID --offre`) ; l'e-mail affiche `apercu.jpg` de ce dossier (miniature du meilleur clip), cliquable. Prénom, chaîne et phrase perso sont facultatifs.
3. **Clips → Aperçu : m'envoyer le premier prospect coché** pour voir l'e-mail chez toi, sans rien changer dans la feuille.
4. **Clips → Envoyer les prospects cochés** : confirmation, envoi depuis ton Gmail, puis « Envoyé le » rempli et la case décochée. Jamais deux fois la même adresse ; jamais une adresse marquée « Ne plus contacter » (sur n'importe quelle ligne). On garde 20 envois du quota Gmail du jour pour les accusés de réception.
5. Quelqu'un répond STOP : cocher « Ne plus contacter » sur sa ligne.

Ces fonctions ne sont accessibles que depuis la feuille ou l'éditeur, avec ton compte : le site n'y a pas accès. Tout texte de la feuille est échappé, et seuls les liens `https://` sont acceptés.

### FormSubmit (secours)

- Remplacer l'adresse e-mail de `SECOURS` par l'identifiant aléatoire reçu dans l'e-mail d'activation : ton adresse disparaît du code public.
- Le mode utilisé (AJAX) peut demander sa propre activation : faire un envoi de test en coupant le script Google, puis cliquer sur le lien reçu.

### Sécurité

- piège à robots `_honey` (ignoré par le script) ; limites : 5 demandes par adresse et par heure, 80 accusés par jour (quota Gmail : 100) ;
- l'accusé de réception a un texte fixe, écrit dans le script, sans aucune donnée saisie par le visiteur : impossible de s'en servir pour envoyer un texte ou un lien à quelqu'un d'autre ;
- saisies tronquées à 500 caractères ; protection contre l'injection de formules dans Sheets (`=`, `+`, `-`, `@`) ;
- CSP dans chaque page : ressources du site uniquement ; connexions vers Google et FormSubmit seulement ;
- affichages construits en `textContent`, jamais en HTML.

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
