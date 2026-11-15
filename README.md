# WarLike Virtual Idol

Site vitrine statique de l'univers **WarLike SEVEN** (7 membres prévus), par WarLike Corps.

## Fonctionnel
- Accueil responsive, navigation clavier/mobile.
- Section artistes générée à partir de `app.js`.
- Sections musique, performances et communauté.
- Aucune collecte de données, aucune API ou dépendance CDN.
- Design sombre utilisant la pile de typographies WarLike, avec repli système.

## Contenu à finaliser
Les six identités non annoncées sont des placeholders. **AERYN est indiqué comme provisoire** : ne pas annoncer le canon visuel, la discographie, les clips ou les dates de lancement sans validation.

## Prévisualisation
Ouvrir `index.html` ou servir le dossier avec `python -m http.server 8000`. Pour Cloudflare Pages, utiliser le dossier racine sans commande de build et publier la branche validée.

## Vérifications
`node --check app.js`, contrôles des ancres et de l'intégrité des ressources HTML/CSS/JS, test manuel à 360 px / 768 px / 1440 px, clavier, et liens.

## Étapes suivantes
Fiches d'artistes détaillées après validation du canon, catalogue audio original avec métadonnées et droits, clips réels, intégration facultative WarLike Keys / Server lorsque l'authentification aura été auditée.
