# WarLike SEVEN — Avatars Meshy

Sept personnages ont maintenant une génération 3D **texturée** réussie dans l'espace Meshy de l'utilisateur. Leur correspondance officielle est tenue dans [assets/meshy-avatar-roster.json](../assets/meshy-avatar-roster.json).

| Artiste | Version Meshy (texture) | État |
| --- | --- | --- |
| AERYN | `01a1e163-1068-714a-901b-9bf4c62b0583` | Modèle texturé |
| SEO-YUN | `01a1e163-1f7d-701b-ae15-2fad6ce5eb19` | Modèle texturé |
| ZAHRA | `01a1e163-2dde-715d-9e6a-9aba4bdff462` | Modèle texturé |
| MEERA | `01a1e164-0365-72e4-9423-c6f61631cf57` | **Nouvelle version hispanique**, modèle texturé |
| NOA | `01a1e163-3e49-7401-936c-34a2f4e954a5` | Modèle texturé |
| JASLEEN | `01a1e163-4df8-757b-8c7c-1f72f3608241` | Modèle texturé |
| HIKARI | `01a1e163-5ca5-73dc-83e4-f0c8700d7db9` | Modèle texturé |

**Le succès de génération ne signifie pas qu'un modèle est déjà skinné, riggé ou doté de morph targets faciaux.** Le flux sûr est :

1. Ouvrir chaque modèle dans Meshy, vérifier sa morphologie et l'identité visuelle. Les liens CDN temporaires de prévisualisation expirent : ne pas les conserver dans le dépôt.
2. Télécharger le **GLB texturé** depuis Meshy. Vérifier les licences et la possibilité d'exploitation avant distribution commerciale.
3. Importer le GLB dans `studio.html` et contrôler les os, les maillages skinnés, les clips et les morph targets avec `idol-rig.js`.
4. Lorsque le rig est absent ou incomplet, passer par **WarLike Rig Studio** pour créer/corriger le squelette, le skinning, les poids et les expressions, puis valider les déformations.
5. Pour la scène finale : retargeting, séquences d'animation, chant, lèvres, caméra et rendu dans WarLike Engine. Les sept personnages nécessitent un contrôle artistique avant publication.

Le premier ancien modèle de MEERA (concept indien) est **obsolète** et n'est pas la référence de production, conformément à la direction artistique plus récente. Aucune nouvelle génération n'a été facturée pour les six autres géométries déjà existantes : seule leur texturisation a été effectuée.
