# WarLike Virtual Idols — SEVEN

Site vitrine **statique**, en français, de WarLike Virtual Idol / WarLike Corps.

## Fonctionnalités
- Sept profils artistes : AERYN, SEO-YUN, ZAHRA, MEERA, NOA, JASLEEN, HIKARI ; toutes les fiches restent éditorialement provisoires.
- AERYN orientée vers une identité noire congolaise. MEERA est désormais décrite comme hispanique (pays et détails culturels non arrêtés).
- Recherche des artistes par nom, localisation et style ; filtre par spécialité ; fiches détaillées accessibles depuis chaque carte.
- Favoris enregistrés **uniquement dans le stockage local du navigateur**, avec bouton de remise à zéro. Aucune donnée n'est envoyée à un serveur.
- Catalogue audio et vidéo prêt pour des contenus **réels** : fichiers, crédits et autorisations doivent être ajoutés avant l'activation.
- Journal du projet, FAQ et navigation mobile.
- Aucun compte utilisateur, paiement, abonnement, diffusion audio fictive ou intégration WarLike Keys prétendument opérationnelle.

## Exécuter et tester
```sh
python3 -m http.server 8000
node --check app.js
node --test tests/site-contract.test.mjs
```

Utiliser ensuite http://localhost:8000. Tester le clavier, la recherche, les filtres et les favoris, notamment avec le stockage local désactivé. Le site fonctionne sans installation de dépendances npm et sans appel à un CDN.

## Ajouter une sortie officielle
Dans `app.js`, renseigner `RELEASES` avec `id,title,artist,audioUrl,coverUrl,date,credits,license` (ou `VIDEOS` pour les performances). Publier seulement des fichiers pour lesquels WarLike Corps dispose des droits, et privilégier une URL relative du même domaine ou un hébergement contrôlé. Revoir la CSP avant tout embed externe. La simple création de ces métadonnées n'est pas un back-office.

## Roadmap
1. Valider les sept fiches, leurs origines, leur langue, les biographies et l'apparence des avatars avec le créateur.
2. Ajouter une galerie de portraits et un média kit avec crédits, consentements et licences.
3. Produire de véritables chansons, chorégraphies et clips ; ajouter paroles, sous-titres et crédits.
4. Construire une administration authentifiée avec WarLike Keys, Server, R2/D1, validation éditoriale et audit de sécurité.
5. Intégrer la communauté, la billetterie, les notifications et une publication progressive.
