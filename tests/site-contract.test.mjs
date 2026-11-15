import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const script=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
test('all interactive controls have matching element IDs',()=>{
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
 assert.equal(new Set(ids).size,ids.length,'duplicate HTML IDs');
 for(const match of script.matchAll(/\$\('#([^']+)'\)/g))assert.ok(ids.includes(match[1]),'missing #'+match[1]);
});
test('seven distinct artist identities retained',()=>{
 for(const name of ['AERYN','SEO-YUN','ZAHRA','MEERA','NOA','JASLEEN','HIKARI'])
 assert.ok(script.includes("name:'"+name+"'"),name+' missing');
 assert.match(script,/Origine hispanique/);
 assert.match(script,/RDC · Kinshasa/);
});
test('music and videos are not fabricated',()=>{
 assert.match(script,/const RELEASES=\[\]/);
 assert.match(script,/const VIDEOS=\[\]/);
 assert.match(html,/Aucune piste disponible/);
});
test('accessible and responsive entry points',()=>{
 for(const id of ['artistes','musique','performances','actualites','fans','artistSearch','artistFilter','artistProfile','favoriteSummary'])
 assert.ok(html.includes('id="'+id+'"'),id+' missing');
 assert.match(css,/@media\(max-width:620px\)/);
 assert.ok(!script.includes('innerHTML'),'unescaped content injection risk');
});
