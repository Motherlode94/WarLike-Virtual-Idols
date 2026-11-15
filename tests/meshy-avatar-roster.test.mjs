import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const roster=JSON.parse(readFileSync(new URL('../assets/meshy-avatar-roster.json',import.meta.url),'utf8'));
test('exactly seven unique active Meshy assets',()=>{
 assert.equal(roster.characters.length,7);
 assert.deepEqual(new Set(roster.characters.map(x=>x.id)).size,7);
 assert.equal(new Set(roster.characters.map(x=>x.texturedTaskId)).size,7);
 for(const character of roster.characters){
  assert.match(character.previewTaskId,/^[\da-f]{8}-[\da-f-]{27,}$/);
  assert.match(character.texturedTaskId,/^[\da-f]{8}-[\da-f-]{27,}$/);
  assert.equal(character.status,'textured');
  assert.equal(character.rig,'unverified');
  assert.equal(character.expressions,'unverified');
 }
});
test('corrected MEERA reference is used instead of the obsolete Indian concept',()=>{
 const meera=roster.characters.find(x=>x.id==='meera');
 assert.equal(meera.texturedTaskId,'01a1e164-0365-72e4-9423-c6f61631cf57');
 assert.notEqual(meera.previewTaskId,'01a1e125-e456-71a4-8278-cedff155fa0c');
});
test('Character Lab links the asset register',()=>{
 const html=readFileSync(new URL('../studio.html',import.meta.url),'utf8');
 assert.ok(html.includes('assets/meshy-avatar-roster.json'));
});
