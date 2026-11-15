// Portable, dependency-free diagnostics and facial target mapping for artist GLB files.
// Does not invent rigging or change any uploaded asset.
export const REQUIRED_BONES=['hips','spine','head','leftupperarm','rightupperarm','leftupperleg','rightupperleg'];
const BONE_ALIASES={
 hips:['hips','pelvis','mixamorig:hips','root'],
 spine:['spine','spine1','chest','mixamorig:spine'],
 head:['head','mixamorig:head','head_end'],
 leftupperarm:['leftupperarm','left_arm','leftarm','upperarml','mixamorig:leftarm'],
 rightupperarm:['rightupperarm','right_arm','rightarm','upperarmr','mixamorig:rightarm'],
 leftupperleg:['leftupperleg','leftupleg','leftleg','thigh_l','mixamorig:leftupleg'],
 rightupperleg:['rightupperleg','rightupleg','rightleg','thigh_r','mixamorig:rightupleg']
};
export const FACE_GROUPS={
 smile:['mouthsmileleft','mouthsmileright','smile','happiness','happy','mouthsmile'],
 blink:['eyeblinkleft','eyeblinkright','blink','eyesclosed'],
 surprise:['jawopen','mouthopen','mouthfunnel','surprised','surprise'],
 aa:['jawopen','viseme_aa','viseme_ah','mouthopen','aa'],
 ee:['viseme_e','viseme_ee','mouthstretchleft','mouthstretchright','ee'],
 oh:['viseme_o','viseme_oh','mouthfunnel','mouthpucker','oh'],
 neutral:[]
};
export const normalizeName=name=>String(name||'').toLowerCase().replace(/[^a-z0-9]/g,'');
export function findFaceTargets(dictionary,group){
 const keys=Object.entries(dictionary||{}).map(([name,index])=>({name,index,normalized:normalizeName(name)})).filter(x=>Number.isInteger(x.index));
 const aliases=(FACE_GROUPS[group]||[]).map(normalizeName);
 const exact=keys.filter(x=>aliases.includes(x.normalized));
 if(exact.length)return exact;
 return keys.filter(x=>aliases.some(a=>x.normalized.endsWith(a)||x.normalized.startsWith(a)));
}
export function auditCharacter(root,animations=[]){
 const bones=[],meshes=[],morphs=[],skinned=[];
 root?.traverse?.(node=>{
  if(node.isBone)bones.push(node.name||'');
  if(node.isMesh||node.isSkinnedMesh){
   meshes.push(node.name||'(unnamed)');
   if(node.isSkinnedMesh)skinned.push(node.name||'(unnamed)');
   const dict=node.morphTargetDictionary||{};
   for(const name of Object.keys(dict))morphs.push(name);
  }
 });
 const normalized=bones.map(normalizeName);
 const matches=Object.fromEntries(REQUIRED_BONES.map(type=>[type,BONE_ALIASES[type].some(alias=>normalized.includes(normalizeName(alias)))]));
 const missing=REQUIRED_BONES.filter(type=>!matches[type]);
 const face=Object.fromEntries(['smile','blink','surprise','aa','ee','oh'].map(type=>[type,morphs.some(m=>FACE_GROUPS[type].some(a=>{const n=normalizeName(m),candidate=normalizeName(a);return n===candidate||n.endsWith(candidate)}))]));
 return {boneCount:bones.length,skinnedMeshCount:skinned.length,meshCount:meshes.length,morphCount:morphs.length,animationCount:animations.length,missingBones:missing,faceTargets:face,rigged:bones.length>0&&skinned.length>0,usableRig:skinned.length>0&&missing.length===0};
}
export function phonemesForText(input){
 // This is a visible timing preview, not forced phoneme alignment of recorded singing.
 return [...String(input||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()]
 .filter(char=>/[a-z]/.test(char))
 .map(char=>/[a]/.test(char)?'aa':/[eiy]/.test(char)?'ee':/[ou]/.test(char)?'oh':'neutral');
}
export function applyFace(group,root,amount=1){
 if(!root?.traverse)return 0;
 const value=Math.min(1,Math.max(0,Number(amount)||0));let modified=0;
 root.traverse(node=>{
  if(!node.morphTargetInfluences||!node.morphTargetDictionary)return;
  const dict=node.morphTargetDictionary,influences=node.morphTargetInfluences;
  const allIndices=new Set();
  for(const key of ['smile','blink','surprise','aa','ee','oh'])for(const target of findFaceTargets(dict,key))allIndices.add(target.index);
  for(const index of allIndices)if(index>=0&&index<influences.length)influences[index]=0;
  if(group!=='neutral')for(const target of findFaceTargets(dict,group))if(target.index>=0&&target.index<influences.length){influences[target.index]=value;modified++}
 });
 return modified;
}
