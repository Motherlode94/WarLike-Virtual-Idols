import test from 'node:test';import assert from 'node:assert/strict';
import {validateCues,activeCue,audioLevel,mappedMouth,cuesToDocument} from '../audio-lipsync.js';
test('validates exact nonoverlapping lip timing',()=>{
 const cue=validateCues([{start:0,end:.2,viseme:'aa'},{start:.2,end:.47,viseme:'ee'}],2);
 assert.equal(activeCue(cue,.1).viseme,'aa');
 assert.equal(activeCue(cue,.3).viseme,'ee');
 assert.equal(activeCue(cue,.48),null);
 assert.throws(()=>validateCues([{start:0,end:.3,viseme:'aa'},{start:.2,end:.4,viseme:'ee'}]),/chevauchants/);
 assert.throws(()=>validateCues([{start:-1,end:.2,viseme:'aa'}]),/temporelle/);
 assert.throws(()=>validateCues([{start:0,end:2,viseme:'aa'}],1),/temporelle/);
});
test('audio envelope creates an adaptive mouth opening',()=>{
 assert.equal(audioLevel(new Float32Array(32)),0);
 const loud=audioLevel(new Float32Array(1024).fill(.35));assert.ok(loud>.9);
 const estimated=mappedMouth([],3,loud);assert.equal(estimated.viseme,'aa');
 const cues=validateCues([{start:1,end:1.5,viseme:'oh',strength:.75}]);
 assert.deepEqual(mappedMouth(cues,1.2,.95),{viseme:'oh',amount:.75,source:'timed-cue'});
});
test('cue document contains artist only, no audio',()=>{
 const doc=cuesToDocument([{start:0,end:.1,viseme:'aa'}],'aeryn');
 assert.equal(doc.schema,'warlike-idol-lipsync-v1');
 assert.ok(!JSON.stringify(doc).includes('audioData'));
});
test('song controls and playback driven morph targets are wired',async()=>{
 const {readFileSync}=await import('node:fs');
 const html=readFileSync(new URL('../studio.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../studio.js',import.meta.url),'utf8');
 for(const id of ['songAudio','songPlayer','cueFile','cueViseme','cueStart','cueEnd','cueAtPlayhead','addCue','clearCues','saveCues','lipStatus','cueSummary'])assert.ok(html.includes('id="'+id+'"'));
 assert.match(js,/createMediaElementSource/);
 assert.match(js,/getFloatTimeDomainData/);
 assert.match(js,/mappedMouth/);
 assert.match(js,/syncSongMouth\(\)/);
});
