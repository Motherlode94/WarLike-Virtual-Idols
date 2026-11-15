'use strict';
const members=[{name:'AERYN',status:'Membre provisoire',description:'Identité visuelle et profil musical à confirmer.'},...Array.from({length:6},(_,i)=>({name:'Identité à révéler',status:'Membre '+String(i+2).padStart(2,'0'),description:'Nom, voix et histoire à définir.'}))];
const list=document.querySelector('#members');
for(const [index,person] of members.entries()){
 const card=document.createElement('article');card.className='member';
 const portrait=document.createElement('div');portrait.className='portrait'+(index?' pending':'');portrait.textContent=index?'?':'A';portrait.setAttribute('aria-label',index?'Portrait non défini':'Portrait provisoire');
 const label=document.createElement('small');label.textContent=person.status.toUpperCase();
 const name=document.createElement('h3');name.textContent=person.name;
 const desc=document.createElement('p');desc.textContent=person.description;
 card.append(portrait,label,name,desc);list.append(card);
}
const toggle=document.querySelector('#menu');const nav=document.querySelector('#nav');
toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open))});
nav.addEventListener('click',e=>{if(e.target.closest('a')){nav.classList.remove('open');toggle.setAttribute('aria-expanded','false')}});
