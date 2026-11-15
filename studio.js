import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {analyzeAvatar,serializeAvatarReport} from './avatar-quality.js';
import {validateBatch,identifyArtist,classifyReport,summarizeBatch} from './avatar-batch.js';
import {auditCharacter,applyFace,phonemesForText} from './idol-rig.js';
const $=selector=>document.querySelector(selector);
const ARTISTS=[
 ['aeryn','AERYN','Leader · Chant principal · R&B','RDC · Kinshasa'],
 ['seoyun','SEO-YUN','Chant principal · Dream-pop','Corée du Sud'],
 ['zahra','ZAHRA','Rap · Hip-hop','Maroc · Amazigh'],
 ['meera','MEERA','Danse · Fusion','Origine hispanique · pays à préciser'],
 ['noa','NOA','Composition · Electro-pop','France'],
 ['jasleen','JASLEEN','Chant puissant · Pop-rock','Inde · Pendjab'],
 ['hikari','HIKARI','Danse · Synthwave','Japon']
];
const STORE='warlike-idol-editor-draft-v1',artists=new Map(ARTISTS.map(([id,name,role,region])=>[id,{id,name,role,region,bio:'Profil artistique en préparation.',status:'draft'}]));
function safeLoad(){try{const json=JSON.parse(localStorage.getItem(STORE)||'{}');if(json&&Array.isArray(json.artists))for(const obj of json.artists){if(!obj||!artists.has(obj.id))continue;const record=artists.get(obj.id);for(const field of ['name','role','region','bio'])if(typeof obj[field]==='string')record[field]=obj[field].slice(0,field==='bio'?1200:120);if(['draft','review','approved'].includes(obj.status))record.status=obj.status}}catch{$('#adminStatus').textContent='Brouillons non chargés : données locales invalides.'}}
safeLoad();
for(const [id,artist] of artists){const option=document.createElement('option');option.value=id;option.textContent=artist.name;$('#artist').append(option)}
function selection(){return artists.get($('#artist').value)}
function fillForm(){const m=selection();if(!m)return;const f=$('#editor').elements;for(const k of ['name','role','region','bio','status'])f.namedItem(k).value=m[k]||''}
function persist(){try{localStorage.setItem(STORE,JSON.stringify({version:1,artists:[...artists.values()]}));return true}catch{$('#adminStatus').textContent='Enregistrement local impossible (stockage désactivé ou plein).';return false}}
$('#editor').addEventListener('submit',event=>{event.preventDefault();const m=selection();if(!m)return;const f=$('#editor').elements;const name=f.namedItem('name').value.trim();if(!name){$('#adminStatus').textContent='Le nom de scène est obligatoire.';return}for(const k of ['name','role','region','bio'])m[k]=f.namedItem(k).value.trim();m.status=f.namedItem('status').value;const option=$('#artist').selectedOptions[0];option.textContent=m.name;if(persist())$('#adminStatus').textContent='Brouillon local enregistré. Aucun contenu publié sur le site public.'});
$('#exportJson').addEventListener('click',()=>{const data=JSON.stringify({schema:'warlike-idol-editor-v1',exportedAt:new Date().toISOString(),artists:[...artists.values()]},null,2);const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='warlike-idol-artists-draft.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);$('#adminStatus').textContent='Export JSON téléchargé : archive de brouillons, non publication.'});
$('#importJson').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>200000)throw Error('Fichier trop volumineux (200 Ko maximum).');const parsed=JSON.parse(await file.text());if(parsed.schema!=='warlike-idol-editor-v1'||!Array.isArray(parsed.artists))throw Error('Schéma JSON non reconnu.');for(const obj of parsed.artists){if(!obj||typeof obj.id!=='string'||!artists.has(obj.id))continue;const a=artists.get(obj.id);for(const key of ['name','role','region','bio'])if(typeof obj[key]==='string')a[key]=obj[key].slice(0,key==='bio'?1200:120);if(['draft','review','approved'].includes(obj.status))a.status=obj.status}persist();for(const o of $('#artist').options)o.textContent=artists.get(o.value).name;fillForm();$('#adminStatus').textContent='Catalogue importé dans ce navigateur uniquement.'}catch(error){$('#adminStatus').textContent='Import refusé : '+error.message}finally{e.target.value=''}});
$('#resetDraft').addEventListener('click',()=>{if(!confirm('Effacer tous les brouillons locaux des sept artistes ?'))return;try{localStorage.removeItem(STORE)}catch{}for(const [id,name,role,region] of ARTISTS)artists.set(id,{id,name,role,region,bio:'Profil artistique en préparation.',status:'draft'});for(const o of $('#artist').options)o.textContent=artists.get(o.value).name;fillForm();$('#adminStatus').textContent='Brouillons effacés.'});
let meshyByArtist=new Map();
function updateMeshyReference(){
 const artist=$('#artist').value,entry=meshyByArtist.get(artist),button=$('#copyMeshyTask');
 button.disabled=!entry;
 $('#meshyModelStatus').textContent=entry?'Modèle texturé Meshy de '+entry.name+' · tâche '+entry.texturedTaskId+' · rig et expressions non vérifiés.':'Aucune référence Meshy vérifiée pour cet artiste.';
}
async function loadMeshyRoster(){
 try{
  const response=await fetch('./assets/meshy-avatar-roster.json',{cache:'no-store'});
  if(!response.ok)throw Error('registre introuvable');
  const registry=await response.json();
  if(registry.schema!=='warlike-idol-meshy-assets-v1'||!Array.isArray(registry.characters))throw Error('registre invalide');
  meshyByArtist=new Map(registry.characters.filter(c=>/^[a-z0-9-]+$/.test(c.id)&&/^[0-9a-f-]{36}$/.test(c.texturedTaskId)).map(c=>[c.id,c]));
  updateMeshyReference();
 }catch(error){$('#meshyModelStatus').textContent='Registre Meshy indisponible : '+error.message}
}
const batchRecords=[];
let batchBusy=false;
function addBatchResult(record){
 const wrapper=$('#batchResults');
 const item=document.createElement('article');item.className='batch-row';
 const headline=document.createElement('strong');headline.textContent=record.artistName+' · '+record.filename;
 const detail=document.createElement('p');detail.textContent=record.status==='error'?'Erreur : '+record.error:record.summary.label+' · '+record.report.geometry.triangles.toLocaleString('fr-FR')+' triangles · '+record.report.skeleton.boneCount+' os · '+record.report.appearance.textures+' textures';
 const notes=document.createElement('p');notes.className='field-note';notes.textContent=record.summary?[...record.summary.blockers,...record.summary.warnings].join(' · ')||'Contrôles automatiques passés ; inspection manuelle requise.':'Aucun diagnostic exploitable';
 item.append(headline,detail,notes);wrapper.append(item);
}
async function analyzeGLBBatch(){
 if(batchBusy)return;
 let files;
 try{files=validateBatch($('#batchGlb').files)}catch(error){$('#batchProgress').textContent=error.message;return}
 batchBusy=true;$('#runBatch').disabled=true;$('#exportBatch').disabled=true;batchRecords.length=0;$('#batchResults').replaceChildren();
 try{
  for(const [index,file] of files.entries()){
   $('#batchProgress').textContent='Analyse '+(index+1)+'/'+files.length+' : '+file.name;
   const artist=identifyArtist(file.name,[...meshyByArtist.values()]);
   try{
    const header=new Uint8Array(await file.slice(0,4).arrayBuffer());
    if(header[0]!==0x67||header[1]!==0x6c||header[2]!==0x54||header[3]!==0x46)throw Error('Signature GLB invalide');
    const data=await file.arrayBuffer();
    const gltf=await loader.parseAsync(data,'');
    const report=analyzeAvatar(gltf.scene,gltf.animations||[]);
    const summary=classifyReport(report);
    const record={filename:file.name,artistId:artist.id,artistName:artist.name,status:'analyzed',summary,report};
    batchRecords.push(record);addBatchResult(record);
    // Parsing only for diagnostics: dispose GPU-friendly resources and avoid keeping seven scenes in memory.
    const geometries=new Set(),materials=new Set(),textures=new Set();
    gltf.scene.traverse(node=>{
     if(node.geometry)geometries.add(node.geometry);
     const nodeMaterials=Array.isArray(node.material)?node.material:node.material?[node.material]:[];
     for(const mat of nodeMaterials){materials.add(mat);for(const value of Object.values(mat))if(value?.isTexture)textures.add(value)}
    });
    for(const geom of geometries)geom.dispose?.();
    for(const tex of textures)tex.dispose?.();
    for(const mat of materials)mat.dispose?.();
   }catch(error){
    const record={filename:file.name,artistId:artist.id,artistName:artist.name,status:'error',error:error.message};
    batchRecords.push(record);addBatchResult(record);
   }
   await new Promise(resolve=>setTimeout(resolve,0));
  }
  const ok=batchRecords.filter(r=>r.status==='analyzed').length;
  $('#batchProgress').textContent=ok+'/'+files.length+' GLB analysés · '+(files.length-ok)+' erreurs. Rapports non publiés.';
  $('#exportBatch').disabled=!batchRecords.length;
 }finally{batchBusy=false;$('#runBatch').disabled=false}
}
$('#runBatch').addEventListener('click',analyzeGLBBatch);
$('#exportBatch').addEventListener('click',()=>{
 if(!batchRecords.length)return;
 const payload=summarizeBatch(batchRecords);
 const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
 const link=document.createElement('a');link.href=url;link.download='warlike-seven-avatar-audit.json';link.click();
 setTimeout(()=>URL.revokeObjectURL(url),3000);
});
$('#copyMeshyTask').addEventListener('click',async()=>{
 const entry=meshyByArtist.get($('#artist').value);if(!entry)return;
 try{await navigator.clipboard.writeText(entry.texturedTaskId);$('#meshyModelStatus').textContent='Identifiant Meshy copié pour '+entry.name+'.'}
 catch{$('#meshyModelStatus').textContent='Copie non autorisée. Identifiant : '+entry.texturedTaskId}
});
$('#artist').addEventListener('change',()=>{fillForm();setTint();updateVoiceChoice();updateMeshyReference()});fillForm();loadMeshyRoster();
// Local speech synthesis prototype, not trained or cloned voices.
const synth=window.speechSynthesis,voiceSelect=$('#voice');
function refreshVoices(){if(!synth)return;const before=voiceSelect.value;voiceSelect.replaceChildren(new Option('Voix du système',''));for(const v of synth.getVoices()){const opt=new Option(v.name+' · '+v.lang,v.voiceURI);voiceSelect.add(opt)}if([...voiceSelect.options].some(o=>o.value===before))voiceSelect.value=before}
if(synth){refreshVoices();synth.addEventListener?.('voiceschanged',refreshVoices)}
function updateVoiceChoice(){if(!synth)return;const languages={aeryn:'fr',seoyun:'ko',zahra:'ar',meera:'es',noa:'fr',jasleen:'hi',hikari:'ja'};const lang=languages[$('#artist').value];const found=synth.getVoices().find(v=>v.lang.toLowerCase().startsWith(lang));if(found)voiceSelect.value=found.voiceURI;else voiceSelect.value=''}
$('#speak').addEventListener('click',()=>{if(!synth){$('#audioStatus').textContent='Synthèse vocale non prise en charge.';return}const text=$('#speechText').value.trim();if(!text)return;synth.cancel();const utterance=new SpeechSynthesisUtterance(text);const selected=synth.getVoices().find(v=>v.voiceURI===voiceSelect.value);if(selected)utterance.voice=selected;const tone={aeryn:[.98,1],seoyun:[1.12,1],zahra:[.91,1.07],meera:[1.05,1.06],noa:[.99,.96],jasleen:[.91,1.04],hikari:[1.14,1]}[$('#artist').value]||[1,1];utterance.pitch=tone[0];utterance.rate=tone[1];utterance.onend=()=>{$('#audioStatus').textContent='Réplique terminée.'};synth.speak(utterance);$('#audioStatus').textContent='Lecture par synthèse vocale de l’appareil (pas une voix chantée originale).'});
$('#stopSpeech').addEventListener('click',()=>{synth?.cancel();$('#audioStatus').textContent='Voix arrêtée.'});
// Original generative melodic sketch, synthesized in this browser, not a released song.
let audioContext=null,demoTimer=null,playingNodes=[];
const patterns={aeryn:[0,3,7,10,7,3,5,7],seoyun:[0,2,7,9,7,4,2,0],zahra:[0,0,3,5,7,5,3,-2],meera:[0,4,7,9,7,4,2,4],noa:[0,7,12,9,7,4,2,0],jasleen:[0,5,7,12,10,7,5,3],hikari:[0,7,9,12,9,7,4,2]};
const roots={aeryn:220,seoyun:261.63,zahra:196,meera:246.94,noa:174.61,jasleen:164.81,hikari:293.66};
function note(freq,when,length,shape='sine',gain=.045){const osc=audioContext.createOscillator(),env=audioContext.createGain();osc.type=shape;osc.frequency.setValueAtTime(freq,when);env.gain.setValueAtTime(.0001,when);env.gain.exponentialRampToValueAtTime(gain,when+.015);env.gain.exponentialRampToValueAtTime(.0001,when+length);osc.connect(env).connect(audioContext.destination);osc.start(when);osc.stop(when+length+.02);playingNodes.push(osc)}
function stopMusic(){if(demoTimer){clearInterval(demoTimer);demoTimer=null}for(const osc of playingNodes)try{osc.stop()}catch{}playingNodes=[];$('#audioStatus').textContent='Motif arrêté.'}
$('#playDemo').addEventListener('click',async()=>{try{stopMusic();audioContext ||=new (window.AudioContext||window.webkitAudioContext)();await audioContext.resume();const id=$('#artist').value,melody=patterns[id]||patterns.aeryn,root=roots[id]||220;let step=0;const tick=()=>{const at=audioContext.currentTime+.03;const semitone=melody[step%melody.length];note(root*Math.pow(2,semitone/12),at,.22,step%4===0?'triangle':'sine',.055);if(step%4===0)note(root/2,at,.45,'triangle',.027);step++};tick();demoTimer=setInterval(tick,310);$('#audioStatus').textContent='Motif inédit synthétisé pour '+selection().name+'. Maquette instrumentale, sans voix.'}catch(e){$('#audioStatus').textContent='Audio indisponible : '+e.message}});
$('#stopDemo').addEventListener('click',stopMusic);
// Three.js procedural articulated mannequin and imported GLB clip playback.
const viewport=$('#viewport'),scene=new THREE.Scene();scene.background=new THREE.Color('#141426');const camera=new THREE.PerspectiveCamera(42,1,.1,100);camera.position.set(0,2.5,7.3);camera.lookAt(0,1.8,0);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));renderer.shadowMap.enabled=true;viewport.append(renderer.domElement);
const orbit=new OrbitControls(camera,renderer.domElement);orbit.target.set(0,1.5,0);orbit.enableDamping=true;orbit.enablePan=true;orbit.minDistance=2.2;orbit.maxDistance=18;orbit.maxPolarAngle=Math.PI*.9;orbit.update();
const ambient=new THREE.HemisphereLight(0xf9dcff,0x1c1841,1.8);scene.add(ambient);const keyLight=new THREE.SpotLight(0xdb81ff,55,14,Math.PI/5,.7);keyLight.position.set(3,6,4);scene.add(keyLight);const rimLight=new THREE.PointLight(0x829bff,30,10);rimLight.position.set(-3,3,-2);scene.add(rimLight);
const floor=new THREE.Mesh(new THREE.CylinderGeometry(2.9,3.05,.24,70),new THREE.MeshStandardMaterial({color:0x20213b,metalness:.65,roughness:.32}));floor.position.y=-.12;scene.add(floor);
const ring=new THREE.Mesh(new THREE.TorusGeometry(2.85,.045,12,96),new THREE.MeshBasicMaterial({color:0xe2a2f5}));ring.rotation.x=-Math.PI/2;ring.position.y=.025;scene.add(ring);
const mat=(color,metalness=.1)=>new THREE.MeshStandardMaterial({color,roughness:.55,metalness});
const bodyColor=mat(0x8a5584),faceColor=mat(0xb98272),darkColor=mat(0x221a32),white=mat(0xf5e6f1);
function mesh(geometry,material,parent,x=0,y=0,z=0){const object=new THREE.Mesh(geometry,material);object.position.set(x,y,z);parent.add(object);return object}
const root=new THREE.Group();scene.add(root);
mesh(new THREE.CylinderGeometry(.34,.26,.95,14),bodyColor,root,0,1.85);
mesh(new THREE.SphereGeometry(.29,16,12),faceColor,root,0,2.68);
mesh(new THREE.SphereGeometry(.32,16,12),darkColor,root,0,2.86,-.08).scale.set(1,.37,1);
mesh(new THREE.CylinderGeometry(.14,.18,.62,12),darkColor,root,-.16,.75);mesh(new THREE.CylinderGeometry(.14,.18,.62,12),darkColor,root,.16,.75);
const leftArm=new THREE.Group(),rightArm=new THREE.Group();leftArm.position.set(-.39,2.24,0);rightArm.position.set(.39,2.24,0);root.add(leftArm,rightArm);mesh(new THREE.CylinderGeometry(.12,.10,.8,12),faceColor,leftArm,-.11,-.43);mesh(new THREE.CylinderGeometry(.12,.10,.8,12),faceColor,rightArm,.11,-.43);
const leftLeg=new THREE.Group(),rightLeg=new THREE.Group();leftLeg.position.set(-.17,1.41,0);rightLeg.position.set(.17,1.41,0);root.add(leftLeg,rightLeg);mesh(new THREE.CylinderGeometry(.13,.14,.76,12),darkColor,leftLeg,0,-.45);mesh(new THREE.CylinderGeometry(.13,.14,.76,12),darkColor,rightLeg,0,-.45);
const leftEye=mesh(new THREE.SphereGeometry(.034,12,10),darkColor,root,-.105,2.73,.265),rightEye=mesh(new THREE.SphereGeometry(.034,12,10),darkColor,root,.105,2.73,.265);const mouth=mesh(new THREE.TorusGeometry(.09,.013,8,24,Math.PI),mat(0x552433),root,0,2.6,.262);mouth.rotation.z=Math.PI;
const expression=$('#expression'),motion=$('#motion');function changeExpression(){mouth.scale.set(1,expression.value==='surprise'?1.9:expression.value==='smile'?1.2:.5,1);mouth.rotation.z=expression.value==='surprise'?Math.PI/2:Math.PI;const blink=expression.value==='blink';leftEye.scale.y=rightEye.scale.y=blink?.13:1}expression.addEventListener('change',changeExpression);
const palette={aeryn:0xc27ebc,seoyun:0x7fa6db,zahra:0xc58b55,meera:0xde8793,noa:0x8cbed2,jasleen:0xd39061,hikari:0x9d8fdf};function setTint(){bodyColor.color.setHex(palette[$('#artist').value]||0xc27ebc)}setTint();
const resize=()=>{const bounds=viewport.getBoundingClientRect();if(bounds.width<1)return;renderer.setSize(bounds.width,bounds.height,false);camera.aspect=bounds.width/bounds.height;camera.updateProjectionMatrix()};new ResizeObserver(resize).observe(viewport);resize();
let imported=null,mixer=null,clips=[],last=performance.now(),showTimer=null,showStep=0,lipPreviewTimer=null,lastAudit=null,lastFilename='';
function frameAvatar(){const target=imported?new THREE.Box3().setFromObject(imported):new THREE.Box3().setFromObject(root);if(target.isEmpty())return;const center=target.getCenter(new THREE.Vector3());const size=target.getSize(new THREE.Vector3());const height=Math.max(1,size.y);orbit.target.copy(center);const distance=Math.max(4,height/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)))*1.5);camera.position.set(center.x+distance*.24,center.y+height*.20,center.z+distance);camera.lookAt(center);orbit.update()}
$('#resetCamera').addEventListener('click',frameAvatar);
function showAvatarAudit(report){const grid=$('#avatarMetrics'),list=$('#avatarIssues');grid.replaceChildren();list.replaceChildren();if(!report){grid.textContent='Importe un fichier GLB pour mesurer sa qualité.';$('#downloadAvatarAudit').disabled=true;return}const metric=[['Triangles',report.geometry.triangles.toLocaleString('fr-FR')],['Sommets',report.geometry.vertices.toLocaleString('fr-FR')],['Matériaux',report.appearance.materials],['Textures',report.appearance.textures],['Os',report.skeleton.boneCount],['Maillages skinnés',report.skeleton.skinnedMeshCount],['Animations',report.skeleton.animationCount],['Visèmes / expressions',Object.values(report.skeleton.faceTargets).filter(Boolean).length+'/6']];for(const [label,value] of metric){const box=document.createElement('div');box.className='avatar-metric';const strong=document.createElement('strong');strong.textContent=String(value);const text=document.createElement('span');text.textContent=label;box.append(strong,text);grid.append(box)}for(const issue of report.issues){const li=document.createElement('li');li.className=issue.level==='error'?'avatar-error':'avatar-warning';li.textContent=(issue.level==='error'?'À corriger : ':'À vérifier : ')+issue.detail;list.append(li)}if(!report.issues.length){const li=document.createElement('li');li.textContent='Aucune anomalie détectée automatiquement ; validation réelle toujours requise.';list.append(li)}$('#downloadAvatarAudit').disabled=false}
showAvatarAudit(null);
$('#downloadAvatarAudit').addEventListener('click',()=>{if(!lastAudit)return;const report=serializeAvatarReport(lastAudit,$('#artist').value,lastFilename);const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='warlike-avatar-'+$('#artist').value+'-audit.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),2000)});
function tick(now){const t=now/1000,delta=Math.min(.06,(now-last)/1000);last=now;const type=motion.value;leftArm.rotation.z=type==='wave'?-.4-.65*Math.sin(t*7):type==='dance'?.4*Math.sin(t*5):type==='bow'?.05:.06;rightArm.rotation.z=type==='wave'?-1.4+.2*Math.cos(t*7):type==='dance'?-.4*Math.sin(t*5):type==='bow'?-.05:-.06;leftLeg.rotation.x=type==='dance'?.25*Math.sin(t*5):0;rightLeg.rotation.x=type==='dance'?-.25*Math.sin(t*5):0;root.rotation.z=type==='dance'?.045*Math.sin(t*5):0;root.rotation.x=type==='bow'?.45:0;root.position.y=type==='dance'?.05+.07*Math.abs(Math.sin(t*5)):.015*Math.sin(t*2);root.rotation.y=type==='dance'?.3*Math.sin(t*.65):0;
 if(mixer)mixer.update(delta);orbit.update();renderer.render(scene,camera);requestAnimationFrame(tick)}requestAnimationFrame(tick);
const loader=new GLTFLoader();$('#glb').addEventListener('change',async event=>{const file=event.target.files?.[0];if(!file)return;const url=URL.createObjectURL(file);try{if(file.size>40*1024*1024)throw Error('Limite de prévisualisation : 40 Mio.');const gltf=await loader.loadAsync(url);stopLipPreview();if(mixer)mixer.stopAllAction();mixer=null;if(imported)scene.remove(imported);imported=gltf.scene;const box=new THREE.Box3().setFromObject(imported);const size=box.getSize(new THREE.Vector3());if(Math.max(size.x,size.y,size.z)>0){const scale=2.75/Math.max(size.x,size.y,size.z);imported.scale.multiplyScalar(scale);const center=new THREE.Box3().setFromObject(imported).getCenter(new THREE.Vector3());imported.position.sub(center);imported.position.y+=1.6}scene.add(imported);root.visible=false;clips=gltf.animations||[];const audit=auditCharacter(imported,clips);lastAudit=analyzeAvatar(imported,clips);lastFilename=file.name;showAvatarAudit(lastAudit);frameAvatar();$('#rigAudit').textContent='Squelette : '+audit.boneCount+' os · Maillages skinnés : '+audit.skinnedMeshCount+' · Morph targets : '+audit.morphCount+' · Animations : '+audit.animationCount+' · Os standards absents : '+(audit.missingBones.join(', ')||'aucun')+' · Rig utilisable : '+(audit.usableRig?'oui':'à compléter');$('#faceStatus').textContent=audit.morphCount?'Morph targets détectés. Teste une expression ci-dessous.':'Aucun morph target facial : expression importée indisponible.';mixer=clips.length?new THREE.AnimationMixer(imported):null;$('#clip').replaceChildren(new Option('Aucune animation importée',''));clips.forEach((clip,i)=>$('#clip').add(new Option(clip.name||'Animation '+(i+1),String(i))));if(clips.length){mixer.clipAction(clips[0]).play();$('#clip').value='0'}$('#threeState').textContent='GLB chargé · '+clips.length+' animation(s) intégrée(s).';$('#morphExpression').value='neutral';}catch(error){$('#threeState').textContent='Import impossible : '+error.message}finally{URL.revokeObjectURL(url);event.target.value=''}});
function playImportedMotion(kind){
 if(!imported)return true;
 if(!mixer||!clips.length){$('#showStatus').textContent='GLB sans animation : seule la prévisualisation statique est possible. Ajoute un rig et des clips compatibles.';return false}
 const keywords={idle:['idle','rest','breath'],wave:['wave','hello','greet'],dance:['dance','dancing','choreo'],bow:['bow','salute']};
 const wanted=keywords[kind]||[kind];
 const index=clips.findIndex(clip=>wanted.some(word=>clip.name.toLowerCase().includes(word)));
 if(index<0){$('#showStatus').textContent='Aucun clip « '+kind+' » compatible trouvé. Choisis une animation disponible dans la liste GLB.';return false}
 mixer.stopAllAction();mixer.clipAction(clips[index]).reset().play();$('#clip').value=String(index);
 return true;
}
motion.addEventListener('change',()=>{if(imported)playImportedMotion(motion.value)});
$('#clip').addEventListener('change',()=>{if(!mixer)return;mixer.stopAllAction();const i=Number($('#clip').value);if($('#clip').value!==''&&clips[i])mixer.clipAction(clips[i]).reset().play()});
const updateImportedFace=()=>{if(!imported){$('#faceStatus').textContent='Charge un GLB avec morph targets pour piloter les expressions.';return}const count=applyFace($('#morphExpression').value,imported,Number($('#morphAmount').value)/100);$('#faceStatus').textContent=count+' morph target(s) piloté(s) pour '+$('#morphExpression').value+(count?'':' — cible absente du modèle.');};
$('#morphExpression').addEventListener('change',updateImportedFace);$('#morphAmount').addEventListener('input',updateImportedFace);
function stopLipPreview(){if(lipPreviewTimer!==null){clearInterval(lipPreviewTimer);lipPreviewTimer=null}}
$('#previewLipSync').addEventListener('click',()=>{stopLipPreview();if(!imported){$('#faceStatus').textContent='Importe un GLB pour tester ses visèmes.';return}const phonemes=phonemesForText($('#speechText').value).slice(0,45);if(!phonemes.length){$('#faceStatus').textContent='Saisis une phrase avant la prévisualisation.';return}let i=0;const step=()=>{const viseme=phonemes[i];const n=applyFace(viseme,imported,Number($('#morphAmount').value)/100);$('#faceStatus').textContent='Visème '+(i+1)+'/'+phonemes.length+' : '+viseme+' ('+n+' cible(s))';i++;if(i>=phonemes.length){stopLipPreview();applyFace('neutral',imported)}};step();if(phonemes.length>1)lipPreviewTimer=setInterval(step,130)});
$('#resetCharacter').addEventListener('click',()=>{stopLipPreview();mixer?.stopAllAction();if(imported){scene.remove(imported);imported=null}mixer=null;clips=[];lastAudit=null;lastFilename='';showAvatarAudit(null);root.visible=true;frameAvatar();$('#clip').replaceChildren(new Option('Aucune animation importée',''));$('#rigAudit').textContent='Aucun modèle chargé. Mannequin de démonstration actif.';$('#threeState').textContent='Mannequin articulé de démonstration.';$('#faceStatus').textContent='Charge un GLB compatible pour tester ses morph targets.'});
$('#threeState').textContent='Mannequin 3D interactif chargé · GLB expérimental';
$('#lighting').addEventListener('change',()=>{const colors={violet:[0xdb81ff,0x829bff],gold:[0xffc579,0xe68f57],cyan:[0x76e9e9,0x587cff]},c=colors[$('#lighting').value]||colors.violet;keyLight.color.setHex(c[0]);rimLight.color.setHex(c[1]);ring.material.color.setHex(c[0])});
function stopShow(){if(showTimer!==null){clearInterval(showTimer);showTimer=null}motion.value='idle';$('#showStatus').textContent='Scène arrêtée.'}
$('#startShow').addEventListener('click',()=>{stopShow();const sequence=$('#choreo').value.split(',');showStep=0;let allowed=true;const step=()=>{motion.value=sequence[showStep];if(!playImportedMotion(motion.value)){allowed=false;stopShow();$('#showStatus').textContent='Ce GLB ne dispose pas de clip correspondant à « '+sequence[showStep]+' » ; chorégraphie non lancée.';return}$('#showStatus').textContent='Séquence '+(showStep+1)+'/'+sequence.length+' — '+motion.selectedOptions[0].textContent;if(showStep===sequence.length-1){clearInterval(showTimer);showTimer=null}else showStep++};step();if(allowed&&sequence.length>1)showTimer=setInterval(step,2200)});
$('#stopShow').addEventListener('click',stopShow);
window.addEventListener('pagehide',()=>{stopShow();stopLipPreview();stopMusic();synth?.cancel();orbit.dispose();renderer.dispose()});
