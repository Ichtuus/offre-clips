# Site de l'offre — clips pour créateurs

Site statique (HTML + CSS, aucune dépendance) hébergé sur GitHub Pages.

- `index.html` : l'offre (accroche, exemples, inclus, prix, essai gratuit)
- `cgv.html` : conditions générales de vente, clients particuliers et professionnels
- `mentions-legales.html`, `confidentialite.html`
- `resilier.html` : fonction « Résilier votre contrat » (obligatoire, art. L215-1-1 C. conso)
- `retractation.html` : fonction « Renoncer au contrat ici » (obligatoire depuis le 19 juin 2026, art. L221-21 C. conso)
- `style.css` : direction artistique reprise de typesafe.ai (couleurs et tailles relevées dans leur code)
- `fonts/` : Inter Tight, JetBrains Mono, VT323, sous licence OFL, hébergées ici (aucune requête vers Google)

Aperçu local : `python3 -m http.server 8765` puis http://localhost:8765

## À compléter avant la mise en ligne

Tout ce qui manque est surligné en rouge sur le site (`<mark class="todo">`). Pour tout retrouver :
`grep -n "todo\|\[EMAIL\]" *.html`

- [ ] `[SIRET]` : sur toutes les pages (pied de page, CGV, mentions légales)
- [ ] `[EMAIL]` et `[TÉLÉPHONE]` : obligatoires dans les mentions légales et les CGV
- [ ] `[PRIX]` et `[N]` (nombre de vidéos par mois) : `index.html`
- [ ] `[MOYEN DE PAIEMENT]` : CGV, article 6
- [ ] **Médiateur de la consommation** : CGV, article 18. Obligatoire dès qu'on vend à des particuliers. Il faut adhérer à un médiateur agréé avant la mise en ligne (liste officielle : https://www.economie.gouv.fr/mediation-conso). Comptez environ 50 à 150 € par an selon l'organisme.
- [ ] Assurance RC Pro : CGV, article 15. Indiquer l'assureur, ou supprimer la ligne si vous n'en avez pas.
- [ ] `[FOURNISSEUR DE MESSAGERIE]` : confidentialité (par exemple Google pour Gmail)
- [ ] Durée de conservation des clips (`[90]` jours) : confidentialité. Elle doit correspondre à ce que fait réellement `clipper clean`.
- [ ] Les 3 exemples avant/après : uniquement avec l'**accord écrit** du créateur
- [ ] Les liens Tally (ci-dessous) à la place des liens `mailto:`

## Formulaires Tally (gratuit, hébergé en UE)

Remplacer le `href` des boutons marqués `<!-- Remplacer par le lien du formulaire Tally -->`.

1. **Essai** : lien de la vidéo, nom de la chaîne, e-mail. Ajouter une ligne qui renvoie vers la politique de confidentialité.
2. **Résiliation**, conforme à l'article D215-1 et suivants :
   - page 1 : nom et prénom (ou entreprise), e-mail, référence client, date souhaitée ;
   - page 2 : récapitulatif des réponses ;
   - bouton d'envoi intitulé exactement **« Notification de la résiliation »** ;
   - vous devez confirmer la réception à l'expéditeur, puis lui envoyer la date de fin par e-mail.
3. **Rétractation** : nom, e-mail, date de commande ; bouton d'envoi **« Confirmer la rétractation »** ; accusé de réception par e-mail sans délai.

L'e-mail de confirmation automatique au répondant n'est pas forcément compris dans l'offre gratuite de Tally. Sinon, répondez vous-même tout de suite à chaque demande.

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
