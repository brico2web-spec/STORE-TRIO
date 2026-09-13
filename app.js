// SENTEL - FIX: Images to Firebase Storage (not Firestore) - Visible on all devices
// Firebase trioparfum-7a2c3
const FIREBASE_CONFIG = {
  apiKey:"AIzaSyA2daZ7FWckKStgUvZyRbYDT6ZyRbYDT6ZAYDz_5A",
  authDomain:"trioparfum-7a2c3.firebaseapp.com",
  projectId:"trioparfum-7a2c3",
  storageBucket:"trioparfum-7a2c3.firebasestorage.app",
  messagingSenderId:"938937787112",
  appId:"1:938937787112:web:90ccff1fbb9d26a8df5d"
};

import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {getFirestore,doc,setDoc,collection,onSnapshot} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {getStorage,ref,uploadString,getDownloadURL} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

let db=null, storage=null, firebaseReady=false;

async function initFirebase(){
  try{
    const app=initializeApp(FIREBASE_CONFIG);
    db=getFirestore(app);
    storage=getStorage(app);
    firebaseReady=true;
    console.log("✅ Firebase + Storage connecté", FIREBASE_CONFIG.projectId);
    showStatus("✅ Connecté Firebase + Storage - Multi-appareils","success");
    startSync();
  }catch(e){
    console.error(e);
    showStatus("⚠️ Erreur Firebase: "+e.message,"error");
    loadFromLocal();
  }
}

function showStatus(msg,type){
  const el=document.getElementById('firebase-status')||document.getElementById('sync-status');
  if(el){el.innerHTML=msg;el.style.cssText=`background:${type==='success'?'#dcfce7':'#fef2f2'};color:${type==='success'?'#166534':'#dc2626'};padding:8px 12px;border-radius:999px;font-size:11px;display:inline-block;margin-top:8px`;}
}

// Compress to Blob for Storage
function compressToBlob(file, maxW=800, quality=0.7){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=e=>{
      const img=new Image();
      img.onload=()=>{
        const canvas=document.createElement('canvas');
        const scale=Math.min(1,maxW/img.width);
        canvas.width=img.width*scale;
        canvas.height=img.height*scale;
        canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
        canvas.toBlob(b=>{
          if(!b) reject("Compression failed");
          else resolve(b);
        },'image/jpeg',quality);
      };
      img.onerror=()=>reject("Erreur image");
      img.src=e.target.result;
    };
    reader.onerror=()=>reject("Lecture fichier");
    reader.readAsDataURL(file);
  });
}

// Upload Blob to Firebase Storage and get URL
async function uploadToStorage(blob, path){
  if(!storage) throw "Storage not ready";
  const storageRef=ref(storage, path);
  // Convert blob to base64 data_url for uploadString
  const dataUrl=await new Promise(res=>{
    const r=new FileReader();
    r.onload=()=>res(r.result);
    r.readAsDataURL(blob);
  });
  await uploadString(storageRef, dataUrl, 'data_url');
  const url=await getDownloadURL(storageRef);
  return url;
}

const DEFAULT_PRODUCTS=[
{name:"SENTEL N°5 - Rose Élite",price:"199",insp:"Inspiré de J'adore • Floral",img:"https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400"},
{name:"SENTEL Oud Royal",price:"249",insp:"Inspiré de Oud Wood • Boisé",img:"https://images.unsplash.com/photo-1541643600914-78b084683601?w=400"},
{name:"SENTEL Fresh Aqua",price:"179",insp:"Inspiré de Bleu de Chanel • Frais",img:"https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=400"},
{name:"SENTEL Vanille Intense",price:"219",insp:"Inspiré de Tobacco Vanille • Gourmand",img:"https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400"},
{name:"SENTEL Musk Blanc",price:"189",insp:"Inspiré de Musk • Doux",img:"https://images.unsplash.com/photo-1541643600914-78b084683601?w=400"},
{name:"SENTEL Nuit d'Amour",price:"229",insp:"Inspiré de La Nuit • Sensuel",img:"https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=400"},
];

function loadFromLocal(){
  const logo=localStorage.getItem('sentel_logo_url')||localStorage.getItem('sentel_logo');
  if(logo) updateLogo(logo);
  const prods=JSON.parse(localStorage.getItem('sentel_products')||'null')||DEFAULT_PRODUCTS;
  updateProducts(prods);
}

function updateLogo(url){
  if(!url) return;
  const hl=document.getElementById('header-logo');
  const lt=document.getElementById('logo-text');
  const fl=document.getElementById('footer-logo');
  const ft=document.getElementById('footer-logo-text');
  if(hl){hl.src=url;hl.style.display='block';}
  if(lt) lt.style.display='none';
  if(fl){fl.src=url;fl.style.display='block';}
  if(ft) ft.style.display='none';
  const adminPrev=document.getElementById('logo-preview');
  if(adminPrev) adminPrev.src=url;
  localStorage.setItem('sentel_logo_url', url);
}
function updateProducts(products){
  const grid=document.getElementById('products');
  if(!grid) return;
  grid.innerHTML=products.map(p=>`<div class="card"><div class="thumb"><img src="${p.img}" onerror="this.src='https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400'"></div><div class="body"><div class="name">${p.name}</div><div class="insp">${p.insp}</div><div class="price">${p.price} MAD</div></div></div>`).join('');
  localStorage.setItem('sentel_products', JSON.stringify(products));
}

function startSync(){
  if(!db) return;
  // Logo + products from settings/site
  onSnapshot(doc(db,'settings','site'), snap=>{
    if(snap.exists()){
      const data=snap.data();
      console.log("📥 Firestore settings/site", data);
      if(data.logoUrl) updateLogo(data.logoUrl);
      if(data.products && data.products.length) updateProducts(data.products);
      if(data.logoUrl) localStorage.setItem('sentel_logo_url', data.logoUrl);
    }
  });
  onSnapshot(collection(db,'products'), snap=>{
    if(!snap.empty){
      const prods=[];
      snap.forEach(d=>prods.push(d.data()));
      prods.sort((a,b)=>(a.id||'').localeCompare(b.id||''));
      if(prods.length) updateProducts(prods);
    }
  });
}

// ADMIN SAVE - Upload to Storage then save URL to Firestore
window.saveLogo=async function(){
  const fileInput=document.getElementById('logo-file');
  const file=fileInput?.files[0];
  if(!file){alert('اختر صورة اللوغو');return;}
  const status=document.getElementById('logo-status');
  if(status) status.innerHTML='⏳ Upload en cours...';
  try{
    const blob=await compressToBlob(file, 400, 0.7);
    const path=`logos/logo_${Date.now()}.jpg`;
    const url=await uploadToStorage(blob, path);
    console.log("✅ Logo uploaded", url);
    localStorage.setItem('sentel_logo_url', url);
    updateLogo(url);
    if(status) status.innerHTML='<span style="background:#dcfce7;color:#166534;padding:4px 8px;border-radius:999px">✅ Logo uploadé - Visible partout 🌍</span>';
    await setDoc(doc(db,'settings','site'), {logoUrl:url, updatedAt:new Date()}, {merge:true});
    showStatus("✅ Logo dans Storage - Visible sur tous les appareils","success");
  }catch(e){
    console.error(e);
    if(status) status.innerHTML='❌ Erreur: '+e.message;
    alert("Erreur upload: "+e.message+"\n\nVérifiez Storage rules: allow read,write: if true;");
  }
}

window.saveProducts=async function(){
  const status=document.getElementById('products-status');
  if(status) status.innerHTML='⏳ Upload 6 produits en cours... peut prendre 20s';
  try{
    const products=[];
    for(let i=0;i<6;i++){
      const fileInput=document.getElementById(`p${i}-file`);
      const existingImg=document.getElementById(`p${i}-preview`)?.src||'';
      let imgUrl=existingImg;
      // If new file selected, upload it
      if(fileInput && fileInput.files[0]){
        const blob=await compressToBlob(fileInput.files[0], 600, 0.7);
        const path=`products/p${i+1}_${Date.now()}.jpg`;
        imgUrl=await uploadToStorage(blob, path);
        console.log(`✅ Product ${i+1} uploaded`, imgUrl);
      }
      products.push({
        id:`p${i+1}`,
        name:document.getElementById(`p${i}-name`)?.value||'',
        price:document.getElementById(`p${i}-price`)?.value||'',
        insp:document.getElementById(`p${i}-insp`)?.value||'',
        img:imgUrl
      });
    }
    localStorage.setItem('sentel_products', JSON.stringify(products));
    updateProducts(products);
    if(status) status.innerHTML='<span style="background:#dcfce7;color:#166534;padding:4px 8px;border-radius:999px">✅ 6 produits uploadés - Visible partout 🌍</span>';
    // Save to Firestore
    await setDoc(doc(db,'settings','site'), {products:products, updatedAt:new Date()}, {merge:true});
    for(const p of products){
      await setDoc(doc(db,'products',p.id), p, {merge:true});
    }
    showStatus("✅ Produits dans Storage - Visible sur tous les appareils","success");
  }catch(e){
    console.error(e);
    if(status) status.innerHTML='❌ Erreur: '+e.message;
    alert("Erreur: "+e.message);
  }
}

window.clearAll=()=>{if(confirm('Effacer localStorage?')){localStorage.clear();location.reload();}}

// Preview
window.previewFile=function(input,imgId){
  const f=input.files[0];if(!f)return;
  const url=URL.createObjectURL(f);
  document.getElementById(imgId).src=url;
}

document.addEventListener('DOMContentLoaded', ()=>{
  initFirebase();
  loadFromLocal();
  // Bind previews
  const logoFile=document.getElementById('logo-file');
  if(logoFile) logoFile.addEventListener('change', e=>window.previewFile(e.target,'logo-preview'));
  for(let i=0;i<6;i++){
    const el=document.getElementById(`p${i}-file`);
    if(el) el.addEventListener('change', e=>window.previewFile(e.target,`p${i}-preview`));
  }
});

initFirebase();
loadFromLocal();
