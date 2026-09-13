
// FIREBASE KEEP EXACT
const FIREBASE_CONFIG = {apiKey:"AIzaSyA2daZ7FWckKStgUvZyRbYDT6ZyRbYDT6ZAYDz_5A",authDomain:"trioparfum-7a2c3.firebaseapp.com",projectId:"trioparfum-7a2c3",storageBucket:"trioparfum-7a2c3.firebasestorage.app",messagingSenderId:"938937787112",appId:"1:938937787112:web:90ccff1fbb9d26a8df5d"};
import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {getFirestore,doc,setDoc,getDoc,collection,onSnapshot} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
let db=null;
try{
  const app=initializeApp(FIREBASE_CONFIG);
  db=getFirestore(app);
  console.log("✅ Firebase connected", FIREBASE_CONFIG.projectId);
  document.body.insertAdjacentHTML('afterbegin','<div style="position:fixed;top:10px;right:10px;z-index:9999;background:#dcfce7;border:1px solid #86efac;color:#166534;padding:8px 14px;border-radius:999px;font-size:12px;font-weight:700">✅ Connecté à Firebase</div>');
}catch(e){console.error("Firebase error",e);}

const PRODUCTS=[
{id:"p1",name:"SENTEL N°5 - Rose Élite",price:199,insp:"Inspiré de J'adore",img:"https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600"},
{id:"p2",name:"SENTEL Oud Royal",price:249,insp:"Inspiré de Oud Wood",img:"https://images.unsplash.com/photo-1541643600914-78b084683601?w=600"},
{id:"p3",name:"SENTEL Fresh Aqua",price:179,insp:"Inspiré de Bleu de Chanel",img:"https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600"},
{id:"p4",name:"SENTEL Vanille Intense",price:219,insp:"Inspiré de Tobacco Vanille",img:"https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600"},
];

function render(){
  const grid=document.getElementById('products');
  if(!grid) return;
  grid.innerHTML=PRODUCTS.map(p=>`
    <div class="glass glass-exciting pcard">
      <div class="thumb"><img src="${p.img}" alt="${p.name}"></div>
      <div class="body">
        <div class="name">${p.name}</div>
        <div class="insp">${p.insp}</div>
        <div class="price-row"><div class="price">${p.price} MAD</div><div class="rating">★ 4.9</div></div>
        <div style="display:flex;gap:8px;margin-top:12px"><button class="btn-add">Ajouter</button><button class="btn-pack">Pack</button></div>
      </div>
    </div>
  `).join('');
  // reveal
  const obs=new IntersectionObserver((entries)=>{entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')})},{threshold:.1});
  document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
}
render();
console.log("✅ Render done, products", PRODUCTS.length);
