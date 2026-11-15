import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../studio.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../studio.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../studio.css',import.meta.url),'utf8');
test('studio interface binds its controls',()=>{
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(new Set(ids).size,ids.length);
 for(const match of js.matchAll(/\$\('#([^']+)'\)/g))assert.ok(ids.includes(match[1]),'missing studio control: '+match[1]);
});
test('all seven configured artists and draft schema exist',()=>{
 for(const name of ['AERYN','SEO-YUN','ZAHRA','MEERA','NOA','JASLEEN','HIKARI'])assert.ok(js.includes(name));
 assert.match(js,/warlike-idol-editor-v1/);
 assert.match(js,/localStorage/);
 assert.match(js,/JSON\.stringify/);
});
test('real 3D viewer, import and animation controls are defined',()=>{
 assert.match(html,/three\/addons\//);
 assert.match(js,/GLTFLoader/);
 assert.match(js,/AnimationMixer/);
 assert.match(js,/requestAnimationFrame/);
 assert.match(js,/root\.rotation/);
 assert.match(js,/function changeExpression/);
});
test('prototype music, spoken voice and show control are distinct',()=>{
 assert.match(js,/SpeechSynthesisUtterance/);
 assert.match(js,/AudioContext/);
 assert.match(js,/createOscillator/);
 assert.match(js,/stopShow/);
 assert.match(js,/clearInterval/);
});
test('mobile responsive and no embedded secrets',()=>{
 assert.match(css,/@media\(max-width:620px\)/);
 assert.ok(!/api[_-]?key\s*[:=]/i.test(js));
});
