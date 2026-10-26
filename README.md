# Nicolas Diarra — Clips

Site de l'offre : https://ichtuus.github.io/offre-clips/

Site statique en HTML, CSS et JavaScript, sans dépendance ni étape de compilation, hébergé sur GitHub Pages.

## Structure

| Fichier | Rôle |
|---|---|
| `index.html` | Présentation de l'offre, tarifs, demande d'essai |
| `cgv.html`, `mentions-legales.html`, `confidentialite.html` | Pages légales |
| `resilier.html`, `retractation.html` | Résiliation et rétractation en ligne |
| `merci.html` | Confirmation après l'envoi d'un formulaire |
| `formulaires.js` | Envoi des formulaires |
| `apps-script/Code.gs` | Script Google Apps Script : enregistrement des demandes et e-mails |
| `charte/` | Charte graphique (`theme.json`) et polices |
| `theme.css` | Variables de la charte, généré depuis `charte/theme.json` |
| `style.css` | Mise en page |

## Développement

```bash
python3 -m http.server 8765    # puis http://localhost:8765
```

## Charte graphique

Couleurs, polices, coordonnées et tarifs sont définis une seule fois dans `charte/theme.json`. Le script `charte/synchroniser.mjs` (Node 18+, sans dépendance) en génère :

- `theme.css` pour le site ;
- le bloc `CHARTE` de `apps-script/Code.gs` pour les e-mails ;
- les fichiers de charte de l'outil de production.

```bash
node charte/synchroniser.mjs              # régénère les fichiers
node charte/synchroniser.mjs --verifier   # signale ce qui n'est plus à jour, sans rien écrire
```

Les polices (Inter Tight, JetBrains Mono, VT323) sont sous licence SIL Open Font License et servies par le site lui-même.

## Formulaires

Chaque demande est conservée jusqu'à ce que son envoi soit confirmé :

1. La demande est d'abord gardée dans le navigateur du visiteur.
2. Elle est envoyée au script Google (adresse dans l'attribut `action` du formulaire), qui l'enregistre dans une feuille de calcul, puis envoie la notification et l'accusé de réception.
3. En cas d'échec (réseau, délai dépassé, erreur HTTP, réponse invalide), un envoi de secours passe par FormSubmit.
4. Si les deux échouent, la demande est renvoyée automatiquement à la visite suivante ou au retour du réseau. Le visiteur peut aussi réessayer, l'envoyer depuis sa messagerie ou la copier.

Chaque demande porte une référence unique, ce qui évite les doublons lors des renvois.

### Déploiement du script

1. Dans une feuille Google Sheets : Extensions → Apps Script, coller le contenu de `apps-script/Code.gs`.
2. Déployer → Nouveau déploiement → Application Web, exécutée en tant que propriétaire, accessible à tout le monde.
3. Reporter l'URL `/exec` dans l'attribut `action` des formulaires de `index.html`, `resilier.html` et `retractation.html`.

Après une modification : Déployer → Gérer les déploiements → nouvelle version. L'URL ne change pas.

La feuille dispose aussi d'un menu « Clips » pour l'envoi des e-mails de prospection depuis l'onglet « Prospects ». Ces fonctions ne sont accessibles qu'au propriétaire de la feuille.

### Sécurité

- Politique de sécurité du contenu (CSP) sur chaque page : seules les ressources du site sont chargées, et les connexions sont limitées au script Google et à FormSubmit.
- Champ piège contre les robots ; limites de fréquence par adresse et par jour.
- Accusés de réception au texte fixe, qui ne reprend jamais la saisie du visiteur.
- Saisies limitées en longueur et protégées contre l'injection de formules dans la feuille.
- Contenus dynamiques insérés en texte, jamais en HTML.

## Mise en ligne

Le site est servi par GitHub Pages depuis la branche `main`. Chaque push est en ligne en une minute environ.
