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


## Idol Production Suite (prototype)

Ouvrir `studio.html` pour accéder aux quatre modules :

1. **Character Lab** — personnage 3D articulé construit avec Three.js, expressions simples, mouvements de démonstration, import GLB local avec lecture des animations embarquées. Ce mannequin n'est pas un avatar final skinné.
2. **Vocal & Song Lab** — synthèse vocale fournie par le navigateur, avec tentative de choix d'une voix adaptée à la langue de chaque artiste ; mélodies originales synthétisées avec Web Audio. Les voix peuvent être absentes selon le système, et les motifs ne sont pas des chansons publiées.
3. **Live Stage** — éclairages sélectionnables et séquences de quatre mouvements sur le mannequin, pas de streaming, billetterie ni performances multicaméras.
4. **Editorial Desk** — brouillons des sept artistes conservés en localStorage, import/export JSON, états `draft`, `review`, `approved`. Le statut `approved` ne publie rien et ne constitue pas une authentification. Pas de secrets ou données privées dans cet outil.

### Contraintes et prochaines étapes
- L'interface charge la bibliothèque Three.js depuis un CDN versionné ; une connexion réseau est requise pour cette première version. Pour un déploiement autonome, la vendorer localement et contrôler la CSP.
- L'import GLB ne convertit pas automatiquement un modèle non riggé en personnage animé ; les animations internes sont lues seulement lorsqu'elles existent.
- Pour des avatars prêts à produire : morph targets faciaux (visèmes/expressions), skinning, retargeting, IK, import/export via WarLike Rig Studio/Engine.
- Pour de vraies productions : sessions de WarLike Studio, prise de voix, vérification des droits, mastering, clips montés et chorégraphies validées.
- Avant toute administration publique : branchement WarLike Keys, contrôle RBAC côté serveur, journal d'audit, permissions médias R2/D1, sauvegardes, modération et validation des publications.

Tests : `node --check studio.js` puis `node --test tests/*.test.mjs`. Valider aussi les parcours WebGL, audio et GLB dans un navigateur réel avant fusion.


## Character Lab — Rig & Facial Preview v1

Le studio ajoute un panneau d'audit des modèles GLB importés : comptage des os, maillages skinnés, animations et morph targets, détection des os attendus (hips/spine/head/bras/jambes), lecture des clips embarqués, contrôle des expressions et aperçu des visèmes `A/E/O`. Les contrôles n'ajoutent pas de rig aux modèles non riggés. Le prévisualiseur des visèmes utilise une approximation textuelle à cadence fixe, **pas** un alignement phonétique ou une synchronisation de voix chantée.

**Important :** les véritables avatars identitaires des sept artistes ne sont pas encore disponibles dans ce dépôt. Leur création réclame des fichiers source autorisés, une topologie/skinning corrects, les morph targets faciaux et des animations testées. Ne pas déclarer les profils et mannequins de démonstration comme des modèles finaux.

Tests : `node --test tests/rig-facial.test.mjs` et `node --test tests/*.test.mjs`.


## Avatar Quality Lab V2 (Meshy → WarLike)

Une fois les modèles [Meshy référencés](assets/meshy-avatar-roster.json) téléchargés en GLB depuis le compte Meshy :

1. Ouvrir `studio.html` et sélectionner le membre de WarLike SEVEN. Le studio affiche son identifiant Meshy permanent, sans URL CDN expirant.
2. Importer le **GLB texturé localement**. Le Character Lab permet de tourner, déplacer et rapprocher la caméra, puis de recadrer le personnage.
3. Consulter le rapport : nombre de triangles, sommets, matériaux, textures, os, maillages skinnés, clips d'animation, visèmes et morph targets. Des avertissements signalent les UV/normales manquants, les poids de skinning invalides et les budgets indicatifs dépassés.
4. Exporter un **rapport JSON** pour les corrections de WarLike Rig Studio et pour une revue technique.
5. Pour les clips et concerts, le studio essaie de trouver un clip nommé Idle, Wave, Dance ou Bow. Si le GLB n'a pas de clip correspondant, la chorégraphie est refusée avec un message explicite : **aucune animation n'est inventée**.

**Critères de production à vérifier réellement** : fidélité du visage sur plusieurs angles, proportions, coiffure, costumes, expression, jointures, qualité du skinning pendant le mouvement, IK des pieds, morph targets et visèmes. Les valeurs de l'audit sont des signaux techniques, pas une certification de production. Il n'y a pas encore de retargeting automatique, de génération de rig ni de correcteur de poids dans ce module.

La génération Meshy réussie n'atteste pas du rigging. Ne pas classer les sept avatars comme prêts à animer avant tests de leurs fichiers GLB réels.


## V3 — contrôle qualité du roster complet (Meshy / GLB)

Le Character Lab contient désormais un **audit de lot jusqu'à 7 fichiers GLB**, pris depuis le navigateur, traités séquentiellement et limités à **40 Mio par fichier / 180 Mio par lot**.

- Analyse indépendante : géométrie, matériaux, textures, os, skinning, animations et visèmes.
- Statuts techniques distincts : `needs-rig`, `technical-review`, `technical-checks-passed`. Un statut favorable **ne signifie jamais « prêt à publier »**.
- Identification de l'artiste à partir du nom du fichier lorsqu'il correspond sans ambiguïté au registre Meshy ; sinon, `Artiste à identifier`. Aucune affectation hasardeuse.
- Export JSON global des résultats pour les transmettre au travail de correction dans Rig Studio.
- Import individuel et par lot : contrôle du conteneur GLB (format glTF 2.0, longueur, chunk JSON) et blocage des **URI de buffers et d'images externes**. Les images intégrées admissibles doivent être des formats de données prévus ; les sources SVG et les liens externes sont rejetés.
- Les GLB importés restent dans le navigateur. **Les fichiers ne sont pas envoyés à un serveur** par la fonctionnalité d'analyse ; l'application web doit malgré tout être soumise à un audit complet CSP, des extensions et des dépendances avant distribution publique.
- Ne pas traiter ce diagnostic comme une validation de déformations réelles, de droit d'utilisation, de fidélité du visage ou de retargeting. Tester chaque modèle en animation et comparer les visuels sous plusieurs angles.

Tests : `node --test tests/avatar-batch.test.mjs`. Tester également en navigateur avec les GLB réels du roster.
