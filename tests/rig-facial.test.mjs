import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeName,findFaceTargets,auditCharacter,phonemesForText,applyFace} from '../idol-rig.js';
test('name normalization accepts common GLB rig prefixes',()=>{
 assert.equal(normalizeName('mixamorig:LeftArm'),'mixamorigleftarm');
 assert.equal(normalizeName('eyeBlinkLeft'),'eyeblinkleft');
});
test('audits valid skinned rig and detects missing joints',()=>{
 const children=[
  ...['Hips','Spine','Head','LeftUpperArm','RightUpperArm','LeftUpLeg','RightUpLeg'].map(name=>({name,isBone:true})),
  {name:'face',isMesh:true,isSkinnedMesh:true,morphTargetDictionary:{eyeBlinkLeft:0,mouthSmileLeft:1,viseme_aa:2}}
 ];
 const obj={traverse(fn){children.forEach(fn)}};
 const ok=auditCharacter(obj,[{name:'Dance'}]);
 assert.equal(ok.usableRig,true);assert.equal(ok.animationCount,1);
 assert.equal(ok.faceTargets.blink,true);assert.equal(ok.faceTargets.aa,true);
 const incomplete=auditCharacter({traverse(fn){fn(children[0])}},[]);
 assert.equal(incomplete.usableRig,false);assert.ok(incomplete.missingBones.includes('head'));
});
test('facial controls drive supported influences only',()=>{
 const mesh={morphTargetDictionary:{eyeBlinkLeft:0,eyeBlinkRight:1,mouthSmileLeft:2,viseme_aa:3},morphTargetInfluences:[0,0,0,0]};
 const root={traverse(fn){fn(mesh)}};
 assert.equal(applyFace('blink',root,.6),2);assert.deepEqual(mesh.morphTargetInfluences,[.6,.6,0,0]);
 assert.equal(applyFace('aa',root,1),1);assert.deepEqual(mesh.morphTargetInfluences,[0,0,0,1]);
 assert.equal(applyFace('neutral',root,1),0);assert.deepEqual(mesh.morphTargetInfluences,[0,0,0,0]);
});
test('viseme planner returns a bounded symbol list',()=>{
 assert.deepEqual(phonemesForText('A é O!'),['aa','ee','oh']);
 assert.deepEqual(phonemesForText(''),[]);
});
test('rig UI exists and is wired',()=>{
 const html=readFileSync(new URL('../studio.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../studio.js',import.meta.url),'utf8');
 for(const id of ['rigAudit','morphExpression','morphAmount','previewLipSync','resetCharacter','faceStatus'])assert.ok(html.includes('id="'+id+'"'));
 assert.match(js,/auditCharacter\(imported,clips\)/);
 assert.match(js,/applyFace\(/);
});
