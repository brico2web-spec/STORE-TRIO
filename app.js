// SENTEL - Firebase Sync Fix - Images visible on all devices
// Firebase KEEP EXACT trioparfum-7a2c3
const FIREBASE_CONFIG = {
  apiKey:"AIzaSyA2daZ7FWckKStgUvZyRbYDT6ZyRbYDT6ZAYDz_5A",
  authDomain:"trioparfum-7a2c3.firebaseapp.com",
  projectId:"trioparfum-7a2c3",
  storageBucket:"trioparfum-7a2c3.firebasestorage.app",
  messagingSenderId:"938937787112",
  appId:"1:938937787112:web:90ccff1fbb9d26a8df5d"
};

import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {getFirestore,doc,setDoc,getDoc,collection,onSnapshot,writeBatch} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let db=null;
let firebaseReady=false;

async function initFirebase(){
  try{
    const app=initializeApp(FIREBASE_CONFIG);
    db=getFirestore(app);
    firebaseReady=true;
    console.log("✅ Firebase connecté", FIREBASE_CONFIG.projectId);
    showStatus("✅ Connecté à Firebase - Sync multi-appareils activé", "success");
    // Start listening for changes from other devices
    startSync();
  }catch(e){
    console.error("Firebase error", e);
    showStatus("⚠️ Mode local seulement: "+e.message, "error");
    // Fallback to localStorage only
    loadFromLocal();
  }
}

function showStatus(msg, type){
  const el=document.getElementById('firebase-status')||document.getElementById('sync-status');
  if(el){
    el.innerHTML=msg;
    el.style.color=type==='success'?'#166534':'#dc2626';
    el.style.background=type==='success'?'#dcfce7':'#fef2f2';
    el.style.padding='8px 12px';
    el.style.borderRadius='999px';
    el.style.fontSize='11px';
    el.style.display='inline-block';
    el.style.marginTop='8px';
  }
}

// COMPRESS IMAGE to Base64 (max 500KB for Firestore limit)
function compressImage(file, maxW=600, quality=0.65){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=e=>{
      const img=new Image();
      img.onload=()=>{
        const canvas=document.createElement('canvas');
        const scale=Math.min(1, maxW/img.width);
        canvas.width=img.width*scale;
        canvas.height=img.height*scale;
        canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
        let dataUrl=canvas.toDataURL('image/jpeg', quality);
        // Ensure < 450KB for Firestore (1MB doc limit, we use 450KB safe)
        let q=quality;
        while(dataUrl.length > 450000 && q>0.3){
          q-=0.1;
          dataUrl=canvas.toDataURL('image/jpeg', q);
        }
        if(dataUrl.length > 500000){
          reject("Image trop grande même compressée - choisissez une plus petite");
        }else{
          resolve(dataUrl);
        }
      };
      img.onerror=()=>reject("Erreur image");
      img.src=e.target.result;
    };
    reader.onerror=()=>reject("Erreur lecture fichier");
    reader.readAsDataURL(file);
  });
}

// DEFAULTS
const DEFAULT_PRODUCTS=[
{name:"SENTEL N°5 - Rose Élite",price:"199",insp:"Inspiré de J'adore • Floral",img:"https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400"},
{name:"SENTEL Oud Royal",price:"249",insp:"Inspiré de Oud Wood • Boisé",img:"https://images.unsplash.com/photo-1541643600914-78b084683601?w=400"},
{name:"SENTEL Fresh Aqua",price:"179",insp:"Inspiré de Bleu de Chanel • Frais",img:"https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=400"},
{name:"SENTEL Vanille Intense",price:"219",insp:"Inspiré de Tobacco Vanille • Gourmand",img:"https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400"},
{name:"SENTEL Musk Blanc",price:"189",insp:"Inspiré de Musk • Doux",img:"https://images.unsplash.com/photo-1541643600914-78b084683601?w=400"},
{name:"SENTEL Nuit d'Amour",price:"229",insp:"Inspiré de La Nuit • Sensuel",img:"https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=400"},
];
const DEFAULT_SLIDES=[
{img:"https://images.unsplash.com/photo-1594035910387-fea47794261f?w=1200",title:"ESSENCES<br>RARES",sub:"Collection exclusive inspirée des plus grandes maisons"},
{img:"https://images.unsplash.com/photo-1541643600914-78b084683601?w=1200",title:"COLLECTION<br>POUR FEMME",sub:"Floral, rosé, musqué — les bestsellers"},
{img:"https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=1200",title:"COLLECTION<br>POUR HOMME",sub:"Boisé, frais, intense — puissance 12h+"},
];

// LOAD FROM LOCAL (fallback)
function loadFromLocal(){
  const logo=localStorage.getItem('sentel_logo');
  if(logo) updateLogo(logo);
  const slides=JSON.parse(localStorage.getItem('sentel_slides')||'null');
  if(slides) updateSlides(slides);
  const products=JSON.parse(localStorage.getItem('sentel_products')||'null');
  if(products) updateProducts(products);
  else updateProducts(DEFAULT_PRODUCTS);
  const texts=JSON.parse(localStorage.getItem('sentel_texts')||'null');
  if(texts) updateTexts(texts);
}

// UPDATE UI FUNCTIONS (called from Firebase and local)
function updateLogo(b64){
  const headerLogo=document.getElementById('header-logo');
  const logoText=document.getElementById('logo-text');
  const footerLogo=document.getElementById('footer-logo');
  const footerText=document.getElementById('footer-logo-text');
  if(b64 && b64.startsWith('data:')){
    if(headerLogo){headerLogo.src=b64;headerLogo.style.display='block';}
    if(logoText) logoText.style.display='none';
    if(footerLogo){footerLogo.src=b64;footerLogo.style.display='block';}
    if(footerText) footerText.style.display='none';
    // Also update admin preview if exists
    const adminPreview=document.getElementById('logo-preview');
    if(adminPreview) adminPreview.src=b64;
  }
}
function updateSlides(slides){
  if(!slides || !slides.length) return;
  // Update hero with first slide
  const bg=document.getElementById('hero-bg');
  const simg=document.getElementById('hero-simg');
  const title=document.getElementById('hero-title');
  const sub=document.getElementById('hero-sub');
  if(bg && slides[0].img) bg.src=slides[0].img;
  if(simg && slides[0].img) simg.src=slides[0].img;
  if(title && slides[0].title) title.innerHTML=slides[0].title;
  if(sub && slides[0].sub) sub.innerHTML=slides[0].sub;
  // Save to local cache
  localStorage.setItem('sentel_slides', JSON.stringify(slides));
}
function updateProducts(products){
  const grid=document.getElementById('products');
  if(!grid) return;
  grid.innerHTML=products.map(p=>`
    <div class="card"><div class="thumb"><img src="${p.img}" onerror="this.src='https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400'"></div>
    <div class="body"><div class="name">${p.name}</div><div class="insp">${p.insp}</div><div class="price">${p.price} MAD</div></div></div>
  `).join('');
  localStorage.setItem('sentel_products', JSON.stringify(products));
}
function updateTexts(texts){
  if(texts.topbar){
    const tb=document.getElementById('topbar');
    if(tb) tb.innerText=texts.topbar;
  }
  if(texts.offerTitle){
    const ot=document.getElementById('offer-title');
    if(ot) ot.innerText=texts.offerTitle;
  }
  if(texts.offerSub){
    const os=document.getElementById('offer-sub');
    if(os) os.innerText=texts.offerSub;
  }
  localStorage.setItem('sentel_texts', JSON.stringify(texts));
}

// FIREBASE SYNC - Listen for changes from all devices
function startSync(){
  if(!db) return;
  // 1. Logo + Texts from settings/site
  onSnapshot(doc(db,'settings','site'), (snap)=>{
    if(snap.exists()){
      const data=snap.data();
      console.log("📥 Firebase settings/site updated", data);
      if(data.logoUrl) updateLogo(data.logoUrl);
      if(data.texts) updateTexts(data.texts);
      if(data.slides) updateSlides(data.slides);
      if(data.products) updateProducts(data.products);
    }
  }, (err)=>{console.log("No settings/site yet", err); loadFromLocal();});

  // 2. Products collection (optional, if you save per product)
  onSnapshot(collection(db,'products'), (snap)=>{
    if(!snap.empty){
      const prods=[];
      snap.forEach(d=>prods.push(d.data()));
      if(prods.length){
        // Sort by id p1,p2...
        prods.sort((a,b)=>(a.id||'').localeCompare(b.id||''));
        updateProducts(prods);
        console.log("📥 Products from Firebase", prods.length);
      }
    }
  });

  // 3. Slider collection
  onSnapshot(collection(db,'slider'), (snap)=>{
    if(!snap.empty){
      const slides=[];
      snap.forEach(d=>slides.push(d.data()));
      slides.sort((a,b)=>(a.order||0)-(b.order||0));
      if(slides.length) updateSlides(slides);
    }
  });
}

// SAVE FUNCTIONS - Save to Firebase AND localStorage (visible on all devices)
window.saveLogo=async function(base64){
  // If called with no arg, get from file input
  if(!base64){
    const fileInput=document.getElementById('logo-file');
    const file=fileInput?.files[0];
    if(!file){alert('اختر صورة اللوغو أولا');return;}
    try{
      base64=await compressImage(file, 400, 0.7);
    }catch(e){alert(e);return;}
  }
  localStorage.setItem('sentel_logo', base64);
  updateLogo(base64);
  document.getElementById('logo-status')&&(document.getElementById('logo-status').innerHTML='<span style="background:#dcfce7;color:#166534;padding:4px 8px;border-radius:999px;font-size:11px">✅ Logo sauvegardé - Visible sur tous les appareils</span>');
  if(firebaseReady){
    try{
      await setDoc(doc(db,'settings','site'), {logoUrl: base64, updatedAt: new Date()}, {merge:true});
      console.log("✅ Logo saved to Firebase");
      showStatus("✅ Logo sauvegardé dans Firebase - Visible partout", "success");
    }catch(e){
      console.error("Firebase save logo failed", e);
      showStatus("⚠️ Sauvegardé local seulement: "+e.message, "error");
      alert("Erreur Firebase: "+e.message+" - Vérifiez les règles Firestore (allow read,write: true)");
    }
  }
}

window.saveSlides=async function(slides){
  if(!slides){
    // Collect from inputs
    slides=[1,2,3].map(i=>{
      const fileInput=document.getElementById(`slide${i}-file`);
      const b64=fileInput?.dataset?.base64||document.getElementById(`slide${i}-preview`)?.src;
      return {
        id:`slide${i}`,
        order:i,
        img:b64,
        title:document.getElementById(`slide${i}-title`)?.value||'',
        sub:document.getElementById(`slide${i}-sub`)?.value||''
      };
    });
  }
  localStorage.setItem('sentel_slides', JSON.stringify(slides));
  updateSlides(slides);
  document.getElementById('slides-status')&&(document.getElementById('slides-status').innerHTML='<span style="background:#dcfce7;color:#166534;padding:4px 8px;border-radius:999px">✅ Slider sauvegardé - Visible partout</span>');
  if(firebaseReady){
    try{
      // Save all slides in settings/site for simplicity (1 doc = visible everywhere)
      await setDoc(doc(db,'settings','site'), {slides: slides, updatedAt: new Date()}, {merge:true});
      // Also save individually
      for(const s of slides){
        await setDoc(doc(db,'slider', s.id), s, {merge:true});
      }
      console.log("✅ Slides saved to Firebase");
      showStatus("✅ Slider sauvegardé - Visible sur tous les appareils", "success");
    }catch(e){
      console.error(e);
      showStatus("Erreur Firebase: "+e.message, "error");
    }
  }
}

window.saveProducts=async function(products){
  if(!products){
    products=[];
    for(let i=0;i<6;i++){
      const fileInput=document.getElementById(`p${i}-file`);
      const b64=fileInput?.dataset?.base64||document.getElementById(`p${i}-preview`)?.src;
      products.push({
        id:`p${i+1}`,
        name:document.getElementById(`p${i}-name`)?.value||'',
        price:document.getElementById(`p${i}-price`)?.value||'',
        insp:document.getElementById(`p${i}-insp`)?.value||'',
        img:b64
      });
    }
  }
  localStorage.setItem('sentel_products', JSON.stringify(products));
  updateProducts(products);
  document.getElementById('products-status')&&(document.getElementById('products-status').innerHTML='<span style="background:#dcfce7;color:#166534;padding:4px 8px;border-radius:999px">✅ Produits sauvegardés - Visible partout</span>');
  if(firebaseReady){
    try{
      await setDoc(doc(db,'settings','site'), {products: products, updatedAt: new Date()}, {merge:true});
      for(const p of products){
        await setDoc(doc(db,'products', p.id), p, {merge:true});
      }
      console.log("✅ Products saved to Firebase");
      showStatus("✅ Produits sauvegardés - Visible sur tous les appareils", "success");
    }catch(e){
      console.error(e);
      showStatus("Erreur Firebase: "+e.message, "error");
    }
  }
}

window.saveTexts=async function(){
  const texts={
    topbar:document.getElementById('topbar-text')?.value||'',
    offerTitle:document.getElementById('offer-title')?.value||'',
    offerSub:document.getElementById('offer-sub')?.value||''
  };
  localStorage.setItem('sentel_texts', JSON.stringify(texts));
  updateTexts(texts);
  document.getElementById('texts-status')&&(document.getElementById('texts-status').innerHTML='<span style="background:#dcfce7;color:#166534;padding:4px 8px;border-radius:999px">✅ Textes sauvegardés</span>');
  if(firebaseReady){
    try{
      await setDoc(doc(db,'settings','site'), {texts: texts, updatedAt: new Date()}, {merge:true});
      showStatus("✅ Textes sauvegardés - Visible partout", "success");
    }catch(e){console.error(e);}
  }
}

// Init on load
initFirebase();
// Also load local immediately for instant display
loadFromLocal();

// Expose compress for admin.html
window.compressImage=compressImage;
window.previewFile=function(input,imgId){
  const f=input.files[0];if(!f)return;
  compressImage(f,800,0.65).then(d=>{document.getElementById(imgId).src=d;input.dataset.base64=d;}).catch(e=>alert(e));
}

// Auto-bind file inputs if admin page
document.addEventListener('DOMContentLoaded', ()=>{
  ['logo-file','slide1-file','slide2-file','slide3-file'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.addEventListener('change', e=>window.previewFile(e.target, id.replace('-file','-preview')));
  });
  for(let i=0;i<6;i++){
    const el=document.getElementById(`p${i}-file`);
    if(el) el.addEventListener('change', e=>{
      const f=e.target.files[0];if(!f)return;
      compressImage(f,600,0.65).then(d=>{document.getElementById(`p${i}-preview`).src=d;e.target.dataset.base64=d;}).catch(err=>alert(err));
    });
  }
});
