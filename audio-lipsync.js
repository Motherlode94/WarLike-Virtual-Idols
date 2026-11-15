// Synchronize a real audio file with existing GLB facial morph targets.
// Audio envelope ≠ phoneme recognition; timed viseme cues are needed for exact articulation.
export const VISEMES=['neutral','aa','ee','oh','blink','smile','surprise'];
export const MAX_CUES=3000;
export function validateCues(input,duration=Infinity){
 const raw=Array.isArray(input)?input:input?.cues;
 if(!Array.isArray(raw)||raw.length>MAX_CUES)throw Error('La piste de visèmes doit contenir au maximum 3000 repères.');
 const list=raw.map((cue,i)=>{
  if(!cue||typeof cue!=='object')throw Error('Repère '+(i+1)+' invalide.');
  const start=Number(cue.start),end=Number(cue.end);
  if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end<=start||end>duration+0.05)throw Error('Plage temporelle invalide pour le repère '+(i+1)+'.');
  if(!VISEMES.includes(cue.viseme))throw Error('Visème inconnu : '+String(cue.viseme).slice(0,30));
  const strength=cue.strength===undefined?1:Number(cue.strength);
  if(!Number.isFinite(strength)||strength<0||strength>1)throw Error('Intensité invalide.');
  return {start,end,viseme:cue.viseme,strength};
 }).sort((a,b)=>a.start-b.start||a.end-b.end);
 for(let i=1;i<list.length;i++)if(list[i].start<list[i-1].end)throw Error('Repères temporels chevauchants.');
 return list;
}
export function activeCue(cues,time){
 if(!Array.isArray(cues)||!Number.isFinite(time)||time<0)return null;
 let lo=0,hi=cues.length-1;
 while(lo<=hi){const mid=(lo+hi)>>1,cue=cues[mid];if(time<cue.start)hi=mid-1;else if(time>=cue.end)lo=mid+1;else return cue}
 return null;
}
export function audioLevel(samples){
 if(!samples?.length)return 0;
 let sum=0;for(const value of samples)sum+=value*value;
 const rms=Math.sqrt(sum/samples.length);
 // Soft gate and compression; visual mouth opening has lower sensitivity at quiet levels.
 return Math.max(0,Math.min(1,(rms-.014)*4.5));
}
export function mappedMouth(cues,time,level){
 const cue=activeCue(cues,time);
 if(cue)return {viseme:cue.viseme,amount:cue.strength,source:'timed-cue'};
 return {viseme:level>.035?'aa':'neutral',amount:Math.max(0,Math.min(1,level)),source:'audio-envelope'};
}
export function cuesToDocument(cues,artist){
 return {schema:'warlike-idol-lipsync-v1',artist:String(artist||'').slice(0,50),cues:validateCues(cues),notice:'Repères visuels manuels, associés au temps audio. Ne contiennent ni chanson ni clonage vocal.'};
}
