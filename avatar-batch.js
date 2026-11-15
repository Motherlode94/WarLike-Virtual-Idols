// Character asset intake: no uploads, no automatic artist assignment without exact match.
// Pure report aggregation keeps heavy GLB parsing out of the UI.
export const MAX_GLB_BYTES=40*1024*1024;
export const MAX_BATCH_BYTES=180*1024*1024;
export const MAX_BATCH_FILES=7;
export const REQUIRED_REPORT_FIELDS=['geometry','appearance','skeleton','signals','issues'];
export function normalizeArtist(value){return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'')}
export function identifyArtist(filename,roster){
 const base=String(filename||'').replace(/\.glb$/i,'');
 const token=normalizeArtist(base);
 const valid=Array.isArray(roster)?roster:[];
 const candidates=valid.filter(person=>{
  const target=normalizeArtist(person.id);
  const name=normalizeArtist(person.name);
  // Explicit name boundaries in the filename; avoid matching a random substring.
  const parts=base.toLowerCase().split(/[^a-z0-9]+/g).filter(Boolean);
  const exact=parts.includes(target)||parts.join('')===name;
  return exact;
 });
 return candidates.length===1?{id:candidates[0].id,name:candidates[0].name}:{id:null,name:'Artiste à identifier'};
}
export function validateBatch(files){
 const list=Array.from(files||[]);
 if(!list.length)throw Error('Sélectionne au moins un GLB.');
 if(list.length>MAX_BATCH_FILES)throw Error('Le lot est limité à sept fichiers.');
 let total=0;
 for(const file of list){
  if(!file||typeof file.name!=='string'||!file.name.toLowerCase().endsWith('.glb'))throw Error('Formats acceptés : GLB uniquement.');
  if(!Number.isSafeInteger(file.size)||file.size<=0||file.size>MAX_GLB_BYTES)throw Error('Chaque GLB doit peser entre 1 octet et 40 Mio.');
  total+=file.size;
 }
 if(total>MAX_BATCH_BYTES)throw Error('Le lot dépasse 180 Mio.');
 return list;
}
export function classifyReport(report){
 if(!report||REQUIRED_REPORT_FIELDS.some(key=>!report[key]))return {stage:'unverified',label:'Non analysé',blockers:['Rapport technique incomplet']};
 const blockers=[],warnings=[];
 if(!report.geometry.meshes)blockers.push('Géométrie absente');
 if(!report.appearance.textures)warnings.push('Textures absentes ou non reconnues');
 if(!report.skeleton.rigged)blockers.push('Rig/skinning absent');
 if(report.skeleton.invalidWeights>0)blockers.push('Poids de skinning incohérents');
 if(!report.skeleton.animationCount)blockers.push('Aucun clip d’animation');
 if(report.skeleton.missingBones?.length)warnings.push('Noms d’os humanoïdes à contrôler');
 if(!report.signals.previewReady)warnings.push('Prévisualisation 3D incomplète');
 if(!report.signals.singingReady)warnings.push('Expressions/visèmes ou animation à compléter');
 const stage=blockers.length?'needs-rig':warnings.length?'technical-review':'technical-checks-passed';
 return {stage,label:stage==='needs-rig'?'Rig/animation à corriger':stage==='technical-review'?'Contrôle technique requis':'Tests techniques indicatifs réussis',blockers,warnings,disclaimer:'Validation humaine des visages, déformations, tenues et performances toujours obligatoire.'};
}
export function summarizeBatch(records){
 const list=Array.isArray(records)?records:[];
 return {schema:'warlike-idol-avatar-batch-v3',generatedAt:new Date().toISOString(),total:list.length,passed:list.filter(x=>x.status==='analyzed').length,failed:list.filter(x=>x.status==='error').length,records:list.map(record=>({filename:String(record.filename||'').slice(0,180),artistId:record.artistId||null,artistName:record.artistName||'Artiste à identifier',status:record.status,summary:record.summary||null,report:record.report||null,error:record.error?String(record.error).slice(0,500):null})),notice:'Rapports locaux ; ne certifient pas le rig, le visage, les droits, les animations ni la qualité du mouvement.'};
}
