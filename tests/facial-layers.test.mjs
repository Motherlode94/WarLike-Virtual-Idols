import test from 'node:test';import assert from 'node:assert/strict';import {composeFacialWeights,applyFacialLayers,selectEmotion} from '../facial-layers.js';
const dict={mouthSmileLeft:0,eyeBlinkLeft:1,viseme_aa:2,viseme_e:3,viseme_o:4,jawOpen:5,customCheek:6};
test('smile and singing remain independent',()=>{
 const map=composeFacialWeights(dict,{emotion:'smile',mouth:'aa',emotionAmount:.8,mouthAmount:.5});
 assert.equal(map.get(0),.8);assert.equal(map.get(2),.5);assert.equal(map.get(1),0);
});
test('blink persists while a viseme is active',()=>{
 const values=[0,0,0,0,0,0,.75],root={traverse(fn){fn({morphTargetDictionary:dict,morphTargetInfluences:values})}};
 applyFacialLayers(root,{emotion:'blink',mouth:'oh',mouthAmount:.9});
 assert.equal(values[1],1);assert.equal(values[4],.9);
 assert.equal(values[6],.75,'unrecognized custom face morph must not be erased');
 applyFacialLayers(root,{emotion:'smile',mouth:'neutral'});
 assert.equal(values[0],1);assert.equal(values[4],0);assert.equal(values[1],0);
});
test('mouth has priority on shared jaw morph targets',()=>{
 const weights=composeFacialWeights(dict,{emotion:'surprise',mouth:'aa',emotionAmount:1,mouthAmount:.3});
 assert.equal(weights.get(5),.3);
});
test('invalid input is rejected and strength is clamped',()=>{
 assert.throws(()=>composeFacialWeights(dict,{emotion:'unknown'}),/invalide/);
 assert.equal(composeFacialWeights(dict,{emotion:'smile',emotionAmount:6}).get(0),1);
 assert.equal(selectEmotion('aa'),'neutral');
});
test('studio wires facial layers and resets mouth on pause/end',async()=>{
 const {readFileSync}=await import('node:fs'),script=readFileSync(new URL('../studio.js',import.meta.url),'utf8');
 assert.match(script,/applyFacialLayers\(imported/);
 assert.match(script,/facialMouthAmount=state\.amount/);
 assert.match(script,/\['pause','ended'\]/);
 assert.ok(!script.includes('applyFace(state.viseme'));
});
