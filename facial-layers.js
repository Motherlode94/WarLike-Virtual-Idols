// Independent face layers preserve eye/blink and emotion during singing.
// Only recognized morphs are touched. No morph targets are fabricated.
import {findFaceTargets} from './idol-rig.js';
const EMOTIONS=['neutral','smile','blink','surprise'],MOUTHS=['neutral','aa','ee','oh'];
const clamp=v=>Math.min(1,Math.max(0,Number.isFinite(Number(v))?Number(v):0));
export function composeFacialWeights(dictionary,{emotion='neutral',mouth='neutral',emotionAmount=1,mouthAmount=1}={}){
 if(!EMOTIONS.includes(emotion)||!MOUTHS.includes(mouth))throw Error('Expression faciale ou visème invalide.');
 const known=new Set(),emotionIndices=new Set(),mouthIndices=new Set(),weights=new Map();
 for(const key of [...EMOTIONS,...MOUTHS]){
  for(const {index} of findFaceTargets(dictionary,key))if(index>=0)known.add(index);
 }
 if(emotion!=='neutral')for(const {index} of findFaceTargets(dictionary,emotion))emotionIndices.add(index);
 if(mouth!=='neutral')for(const {index} of findFaceTargets(dictionary,mouth))mouthIndices.add(index);
 const e=clamp(emotionAmount),m=clamp(mouthAmount);
 // The lips have priority on shared jaw/open morphs; the eyes and smile remain untouched.
 for(const index of known)weights.set(index,mouthIndices.has(index)?m:emotionIndices.has(index)?e:0);
 return weights;
}
export function applyFacialLayers(root,options={}){
 if(!root?.traverse)return 0;
 let affected=0;
 root.traverse(node=>{
  if(!node.morphTargetDictionary||!node.morphTargetInfluences)return;
  const weights=composeFacialWeights(node.morphTargetDictionary,options);
  for(const [index,amount] of weights){
   if(!Number.isInteger(index)||index>=node.morphTargetInfluences.length)continue;
   node.morphTargetInfluences[index]=amount;
   affected++;
  }
 });
 return affected;
}
export function selectEmotion(value){
 return ['smile','blink','surprise'].includes(value)?value:'neutral';
}
