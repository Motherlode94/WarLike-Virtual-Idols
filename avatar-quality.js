// Non-destructive runtime quality diagnostics for imported GLB game characters.
// No promises of automatic skinning, morph target generation or animation retargeting.
import {auditCharacter} from './idol-rig.js';
export const BUDGETS={previewTriangles:60000,previewMaterials:20,previewTextures:30};
const describeMaterial=material=>Array.isArray(material)?material.filter(Boolean):material?[material]:[];
const uniqueMaterials=root=>{
 const unique=new Set();
 root?.traverse?.(node=>{if(node.isMesh||node.isSkinnedMesh)for(const m of describeMaterial(node.material))unique.add(m)});
 return [...unique];
};
const textureKeys=['map','normalMap','roughnessMap','metalnessMap','emissiveMap','aoMap','alphaMap','bumpMap'];
export function analyzeAvatar(root,animations=[]){
 const base=auditCharacter(root,animations),materials=uniqueMaterials(root);
 const textures=new Set(),issues=[],flags=[];
 let triangles=0,vertices=0,meshes=0,missingNormals=0,missingUVs=0,skinnedMeshes=0,invalidWeights=0,skeletonJoints=0;
 root?.traverse?.(node=>{
  if(!(node.isMesh||node.isSkinnedMesh))return;
  meshes++;
  const geometry=node.geometry;
  const position=geometry?.attributes?.position;
  if(!position)return;
  vertices+=Number(position.count)||0;
  const triangleSource=geometry.index?.count??position.count;
  triangles+=Math.floor(triangleSource/3);
  if(!geometry.attributes.normal)missingNormals++;
  if(!geometry.attributes.uv)missingUVs++;
  if(node.isSkinnedMesh){
   skinnedMeshes++;
   skeletonJoints+=node.skeleton?.bones?.length||0;
   const weights=geometry.attributes.skinWeight;
   const indices=geometry.attributes.skinIndex;
   if(!weights||!indices||weights.count!==position.count||indices.count!==position.count){
    invalidWeights++;
   }else{
    // Sample up to 1024 vertices per mesh without mutating geometry.
    const stride=Math.max(1,Math.ceil(position.count/1024));
    for(let i=0;i<position.count;i+=stride){
     let total=0;
     for(let j=0;j<Math.min(4,weights.itemSize||4);j++)total+=weights.getComponent(i,j);
     if(!Number.isFinite(total)||Math.abs(total-1)>.15){invalidWeights++;break}
    }
   }
  }
 });
 for(const material of materials)for(const key of textureKeys){const texture=material[key];if(texture?.isTexture)textures.add(texture.uuid||texture)}
 if(!meshes)issues.push({level:'error',code:'mesh',detail:'Aucun maillage géométrique exploitable'});
 if(!base.rigged)issues.push({level:'error',code:'rig',detail:'Squelette et maillage skinné non détectés : rigging requis'});
 else if(!base.usableRig)issues.push({level:'warning',code:'bones',detail:'Noms d’os humanoïdes non reconnus : vérifier le mapping du rig'});
 if(invalidWeights)issues.push({level:'error',code:'weights',detail:'Poids de skinning manquants ou incohérents'});
 if(missingNormals)issues.push({level:'warning',code:'normals',detail:'Normales manquantes sur '+missingNormals+' maillage(s)'});
 if(missingUVs&&textures.size)issues.push({level:'warning',code:'uv',detail:'UV absents sur '+missingUVs+' maillage(s)'});
 if(!textures.size)issues.push({level:'warning',code:'textures',detail:'Aucune texture reconnue sur les matériaux'});
 if(triangles>BUDGETS.previewTriangles)issues.push({level:'warning',code:'triangles',detail:'Dépasse le budget indicatif de '+BUDGETS.previewTriangles.toLocaleString('fr-FR')+' triangles'});
 if(materials.length>BUDGETS.previewMaterials)issues.push({level:'warning',code:'materials',detail:'Nombre élevé de matériaux : '+materials.length});
 if(textures.size>BUDGETS.previewTextures)issues.push({level:'warning',code:'textureCount',detail:'Nombre élevé de textures : '+textures.size});
 if(base.animationCount===0)issues.push({level:'warning',code:'animation',detail:'Aucun clip d’animation embarqué'});
 const faceAvailable=Object.values(base.faceTargets).filter(Boolean).length;
 if(faceAvailable<6)issues.push({level:'warning',code:'face',detail:'Visèmes/expressions incomplets : '+faceAvailable+'/6 groupes reconnus'});
 // Caution: readiness indicates signals, never artistic or deformation QA.
 const geometryOK=meshes>0&&missingNormals===0;
 const previewReady=geometryOK&&textures.size>0;
 const animationReady=base.rigged&&invalidWeights===0&&base.animationCount>0;
 const singingReady=animationReady&&faceAvailable===6;
 if(previewReady)flags.push('Prévisualisation 3D à tester');
 if(animationReady)flags.push('Animation disponible à vérifier');
 if(singingReady)flags.push('Visèmes présents à vérifier');
 return {geometry:{meshes,vertices,triangles,missingNormals,missingUVs},appearance:{materials:materials.length,textures:textures.size},skeleton:{...base,skinnedMeshes,skeletonJoints,invalidWeights},signals:{previewReady,animationReady,singingReady},flags,issues};
}
export function serializeAvatarReport(report,artist,file){
 const safeArtist=String(artist||'inconnu').replace(/[^a-z0-9-]/gi,'').slice(0,48);
 return {schema:'warlike-idol-avatar-quality-v2',artist:safeArtist,filename:String(file||'').slice(0,180),evaluatedAt:new Date().toISOString(),...report,notice:'Diagnostic statique indicatif. Rigging, poids, morph targets, animations et fidélité visuelle doivent être testés avec le vrai GLB.'};
}
