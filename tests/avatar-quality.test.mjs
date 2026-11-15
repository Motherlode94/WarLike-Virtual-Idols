import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeAvatar,serializeAvatarReport,BUDGETS} from '../avatar-quality.js';
const geometry=(count=3000,{normal=true,uv=true,skinned=false,badWeights=false}={})=>{
 const a={position:{count},...(normal?{normal:{count}}:{}),...(uv?{uv:{count}}:{})};
 if(skinned){
  a.skinWeight={count,itemSize:4,getComponent:(_,n)=>badWeights?0:(n===0?1:0)};
  a.skinIndex={count,itemSize:4};
 }
 return {attributes:a,index:null};
};
function rootOf(nodes){return {traverse:callback=>nodes.forEach(callback)}}
test('rig-less textured Meshy GLB is correctly NOT considered ready to animate',()=>{
 const mesh={name:'character',isMesh:true,geometry:geometry(),material:{map:{isTexture:true,uuid:'texture-1'}}};
 const report=analyzeAvatar(rootOf([mesh]));
 assert.equal(report.geometry.triangles,1000);
 assert.equal(report.appearance.textures,1);
 assert.equal(report.signals.previewReady,true);
 assert.equal(report.signals.animationReady,false);
 assert.equal(report.signals.singingReady,false);
 assert.ok(report.issues.some(i=>i.code==='rig'));
 assert.ok(report.issues.some(i=>i.code==='face'));
});
test('weighted skinned avatar with complete named joints and morphs may be previewable',()=>{
 const bones=['Hips','Spine','Head','LeftUpperArm','RightUpperArm','LeftUpLeg','RightUpLeg'].map(name=>({isBone:true,name}));
 const face={smile:0,eyeBlinkLeft:1,Surprise:2,viseme_aa:3,viseme_e:4,viseme_o:5};
 const mesh={name:'body',isMesh:true,isSkinnedMesh:true,geometry:geometry(300,{skinned:true}),material:{map:{isTexture:true,uuid:'A'}},skeleton:{bones},morphTargetDictionary:face};
 const report=analyzeAvatar(rootOf([...bones,mesh]),[{name:'Idle'}]);
 assert.equal(report.skeleton.usableRig,true);
 assert.equal(report.skeleton.invalidWeights,0);
 assert.equal(report.signals.animationReady,true);
 assert.equal(report.signals.singingReady,true);
 assert.equal(report.geometry.triangles,100);
});
test('missing or badly normalized skin weights are flagged',()=>{
 const nodes=['Hips','Spine','Head','LeftUpperArm','RightUpperArm','LeftUpLeg','RightUpLeg'].map(name=>({isBone:true,name}));
 nodes.push({isMesh:true,isSkinnedMesh:true,geometry:geometry(900,{skinned:true,badWeights:true}),material:{}});
 const report=analyzeAvatar(rootOf(nodes),[{name:'Dance'}]);
 assert.ok(report.issues.some(i=>i.code==='weights'));
 assert.equal(report.signals.animationReady,false);
});
test('large mesh emits advisory budget warning without destroying scene',()=>{
 const mesh={isMesh:true,geometry:geometry((BUDGETS.previewTriangles+1)*3),material:{}};
 const report=analyzeAvatar(rootOf([mesh]));
 assert.ok(report.issues.some(i=>i.code==='triangles'));
 const json=serializeAvatarReport(report,'AERYN','aeryn.glb');
 assert.equal(json.artist,'AERYN');
 assert.equal(json.schema,'warlike-idol-avatar-quality-v2');
 assert.equal(json.filename,'aeryn.glb');
});
test('Character Lab UI integrates audit and orbit controls',async()=>{
 const {readFileSync}=await import('node:fs');
 const html=readFileSync(new URL('../studio.html',import.meta.url),'utf8');
 const script=readFileSync(new URL('../studio.js',import.meta.url),'utf8');
 for(const id of ['avatarMetrics','avatarIssues','downloadAvatarAudit','resetCamera'])assert.ok(html.includes('id="'+id+'"'));
 assert.match(script,/OrbitControls/);
 assert.match(script,/analyzeAvatar\(imported,clips\)/);
 assert.match(script,/showAvatarAudit\(lastAudit\)/);
});
