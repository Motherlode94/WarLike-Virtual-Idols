import test from 'node:test';
import assert from 'node:assert/strict';
import {validateBatch,identifyArtist,classifyReport,summarizeBatch,inspectGLBContainer} from '../avatar-batch.js';
function sampleGLB({uri,version='2.0'}={}){
 const spec={asset:{version},meshes:[{primitives:[]}],nodes:[{}]};
 if(uri)spec.images=[{uri}];
 const text=JSON.stringify(spec),encoded=new TextEncoder().encode(text);
 const padded=(encoded.length+3)&~3,buffer=new ArrayBuffer(20+padded),view=new DataView(buffer),bytes=new Uint8Array(buffer);
 view.setUint32(0,0x46546c67,true);view.setUint32(4,2,true);view.setUint32(8,buffer.byteLength,true);view.setUint32(12,padded,true);view.setUint32(16,0x4e4f534a,true);bytes.set(encoded,20);
 for(let i=encoded.length;i<padded;i++)bytes[20+i]=32;
 return buffer;
}
test('rejects external resources before passing GLB to Three.js',()=>{
 assert.deepEqual(inspectGLBContainer(sampleGLB()).externalResources,0);
 assert.throws(()=>inspectGLBContainer(sampleGLB({uri:'https://untrusted.example/image.png'})),/non autorisée/);
 assert.throws(()=>inspectGLBContainer(sampleGLB({uri:'../../private.png'})),/non autorisée/);
 assert.throws(()=>inspectGLBContainer(sampleGLB({uri:'data:image/svg+xml;base64,PHN2Zz4='})),/non autorisée/);
 assert.equal(inspectGLBContainer(sampleGLB({uri:'data:image/png;base64,iVBORw0KGgo='})).meshes,1);
});
test('rejects broken GLB headers and mismatched length',()=>{
 const buf=sampleGLB();new DataView(buf).setUint32(8,999,true);
 assert.throws(()=>inspectGLBContainer(buf),/en-tête/i);
 assert.throws(()=>inspectGLBContainer(new ArrayBuffer(6)),/incomplet/);
});
test('selects exactly one roster artist by filename without guessing',()=>{
 const roster=[{id:'aeryn',name:'AERYN'},{id:'seo-yun',name:'SEO-YUN'},{id:'meera',name:'MEERA'}];
 assert.equal(identifyArtist('aeryn-stage-v3.glb',roster).id,'aeryn');
 assert.equal(identifyArtist('SEO-YUN.glb',roster).id,'seo-yun');
 assert.equal(identifyArtist('unknown.glb',roster).id,null);
});
test('bounds batch to seven valid local files / 180 Mio',()=>{
 assert.equal(validateBatch([{name:'a.glb',size:100}]).length,1);
 assert.throws(()=>validateBatch([{name:'no.zip',size:100}]),/GLB uniquement/);
 assert.throws(()=>validateBatch(Array.from({length:8},(_,i)=>({name:i+'.glb',size:1}))),/sept/);
 assert.throws(()=>validateBatch([{name:'large.glb',size:41*1024*1024}]),/40 Mio/);
 assert.throws(()=>validateBatch(Array.from({length:5},(_,i)=>({name:i+'.glb',size:39*1024*1024}))),/180 Mio/);
});
test('technical readiness cannot be falsely marked completed without skinned animation',()=>{
 const fake={geometry:{meshes:1},appearance:{textures:2},skeleton:{rigged:false,invalidWeights:0,animationCount:0,missingBones:[]},signals:{previewReady:true,singingReady:false},issues:[]};
 const result=classifyReport(fake);
 assert.equal(result.stage,'needs-rig');assert.ok(result.blockers.some(s=>s.includes('Rig')));
 const summary=summarizeBatch([{filename:'aeryn.glb',artistId:'aeryn',artistName:'AERYN',status:'analyzed',summary:result,report:fake}]);
 assert.equal(summary.total,1);assert.equal(summary.passed,1);
 assert.equal(summary.records[0].summary.stage,'needs-rig');
});
test('batch interface and import guard exist',async()=>{
 const {readFileSync}=await import('node:fs');
 const html=readFileSync(new URL('../studio.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../studio.js',import.meta.url),'utf8');
 for(const id of ['batchGlb','runBatch','exportBatch','batchProgress','batchResults'])assert.ok(html.includes('id="'+id+'"'));
 assert.match(js,/inspectGLBContainer\(data\)/);
 assert.match(js,/inspectGLBContainer\(bytes\)/);
 assert.match(js,/analyzeGLBBatch/);
});
