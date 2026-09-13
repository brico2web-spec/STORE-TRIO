// SENTEL - Ultra Compress - الصور صغيرة بزاف 40KB
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

let db=null, storage=null;

async function init(){
  try{
    const app=initializeApp(FIREBASE_CONFIG);
    db=getFirestore(app);
    storage=getStorage(app);
    console.log("✅ Firebase Ready");
    startSync();
  }catch(e){console.error(e); loadLocal();}
}

function showStatus(id, msg, ok=true){
  const el=document.getElementById(id);
  if(!el) return;
  el.innerHTML=`<span style="background:${ok?'#dcfce7':'#fef2f2'};color:${ok?'#166534':'#dc2626'};padding:4px 10px;border-radius:999px;font-size:11px">${msg}</span>`;
}

// ضغط قوي بزاف - الصورة كتولي 30-50KB فقط
function ultraCompress(file, maxW=400, maxKB=80){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=e=>{
      const img=new Image();
      img.onload=()=>{
        const canvas=document.createElement('canvas');
        let w=img.width, h=img.height;
        // Resize
        if(w>maxW){ h = h*maxW/w; w=maxW; }
        canvas.width=w; canvas.height=h;
        const ctx=canvas.getContext('2d');
        ctx.drawImage(img,0,0,w,h);
        // Compress loop jusqu'à < maxKB
        let quality=0.6;
        let dataUrl=canvas.toDataURL('image/jpeg', quality);
        let attempts=0;
        while(dataUrl.length > maxKB*1024*1.37 && quality>0.2 && attempts<8){
          quality-=0.08;
          dataUrl=canvas.toDataURL('image/jpeg', quality);
          attempts++;
        }
        // Si toujours trop grand, réduire encore la taille
        if(dataUrl.length > maxKB*1024*1.37){
          canvas.width=w*0.7; canvas.height=h*0.7;
          ctx.drawImage(img,0,0,canvas.width,canvas.height);
          dataUrl=canvas.toDataURL('image/jpeg', 0.4);
        }
        console.log(`Compressed ${file.name}: ${(file.size/1024).toFixed(0)}KB → ${(dataUrl.length/1024).toFixed(0)}KB (q=${quality.toFixed(2)})`);
        resolve({dataUrl, sizeKB:(dataUrl.length/1024).toFixed(0), quality});
      };
      img.onerror=()=>reject("Erreur image");
      img.src=e.target.result;
    };
    reader.onerror=()=>reject("Lecture fichier");
    reader.readAsDataURL(file);
  });
}

async function uploadToStorage(dataUrl, path){
  const storageRef=ref(storage, path);
  await uploadString(storageRef, dataUrl, 'data_url');
  return await getDownloadURL(storageRef);
}

const DEFAULT_PRODUCTS=[
{name:"SENTEL N°5",price:"199",insp:"J'adore",img:"https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400"},
{name:"Oud Royal",price:"249",insp:"Oud Wood",img:"https://images.unsplash.com/photo-1541643600914-78b084683601?w=400"},
{name:"Fresh Aqua",price:"179",insp:"Bleu",img:"https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=400"},
{name:"Vanille",price:"219",insp:"Tobacco",img:"https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400"},
{name:"Musk Blanc",price:"189",insp:"Musk",img:"https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400"},
{name:"Nuit d'Amour",price:"229",insp:"La Nuit",img:"https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=400"},
];

function loadLocal(){
  const logo=localStorage.getItem('sentel_logo_url');
  if(logo) updateLogo(logo);
  const prods=JSON.parse(localStorage.getItem('sentel_products')||'null')||DEFAULT_PRODUCTS;
  updateProducts(prods);
}
function updateLogo(url){
  const hl=document.getElementById('header-logo');
  const fl=document.getElementById('footer-logo');
  if(hl){hl.src=url;hl.style.display='block';document.getElementById('logo-text').style.display='none';}
  if(fl){fl.src=url;fl.style.display='block';document.getElementById('footer-logo-text').style.display='none';}
  const ap=document.getElementById('logo-preview'); if(ap) ap.src=url;
  localStorage.setItem('sentel_logo_url', url);
}
function updateProducts(products){
  const grid=document.getElementById('products');
  if(!grid) return;
  grid.innerHTML=products.map(p=>`<div class="card"><div class="thumb"><img src="${p.img}"></div><div class="body"><div class="name">${p.name}</div><div class="insp">${p.insp}</div><div class="price">${p.price} MAD</div><div style="font-size:10px;color:#94a3b8">${p.size||''}</div></div></div>`).join('');
  localStorage.setItem('sentel_products', JSON.stringify(products));
}
function startSync(){
  if(!db) return;
  onSnapshot(doc(db,'settings','site'), snap=>{
    if(snap.exists()){
      const d=snap.data();
      if(d.logoUrl) updateLogo(d.logoUrl);
      if(d.products) updateProducts(d.products);
    }
  });
  onSnapshot(collection(db,'products'), snap=>{
    if(!snap.empty){
      const prods=[]; snap.forEach(doc=>prods.push(doc.data()));
      prods.sort((a,b)=>(a.id||'').localeCompare(b.id||''));
      if(prods.length) updateProducts(prods);
    }
  });
}

// SAVE LOGO - ضغط قوي 40KB
window.saveLogo=async function(){
  const input=document.getElementById('logo-file');
  const file=input?.files[0];
  if(!file){alert('اختار صورة اللوغو');return;}
  showStatus('logo-status','⏳ ضغط الصورة...',true);
  try{
    const {dataUrl, sizeKB} = await ultraCompress(file, 300, 50); // Logo 300px max, 50KB max
    console.log("Logo compressed", sizeKB+"KB");
    showStatus('logo-status',`⏳ تم الضغط ${sizeKB}KB - رفع...`,true);
    let finalUrl=dataUrl; // Fallback base64 small
    try{
      // Try Storage
      finalUrl=await uploadToStorage(dataUrl, `logos/logo_${Date.now()}.jpg`);
      console.log("Logo Storage URL", finalUrl);
    }catch(e){
      console.warn("Storage failed, using base64 fallback", e);
      // Fallback: use small base64 directly (50KB fits in Firestore)
    }
    updateLogo(finalUrl);
    localStorage.setItem('sentel_logo_url', finalUrl);
    await setDoc(doc(db,'settings','site'), {logoUrl:finalUrl, updatedAt:new Date()}, {merge:true});
    showStatus('logo-status',`✅ Logo ${sizeKB}KB - يبان فجميع الأجهزة 🌍`,true);
  }catch(e){
    console.error(e);
    showStatus('logo-status','❌ '+e.message,false);
    alert(e.message);
  }
}

// SAVE PRODUCTS - ضغط قوي 60KB لكل منتوج
window.saveProducts=async function(){
  const statusId='products-status';
  showStatus(statusId,'⏳ ضغط 6 صور...',true);
  try{
    const products=[];
    for(let i=0;i<6;i++){
      const fileInput=document.getElementById(`p${i}-file`);
      let imgUrl=document.getElementById(`p${i}-preview`)?.src||'';
      let sizeInfo='';
      if(fileInput && fileInput.files[0]){
        const file=fileInput.files[0];
        const {dataUrl, sizeKB} = await ultraCompress(file, 400, 70); // Products 400px, 70KB max
        sizeInfo=`${sizeKB}KB`;
        try{
          imgUrl=await uploadToStorage(dataUrl, `products/p${i+1}_${Date.now()}.jpg`);
        }catch(e){
          console.warn("Storage fail, using base64", e);
          imgUrl=dataUrl; // Fallback small base64
        }
        console.log(`Product ${i+1} ${sizeKB}KB`);
      }
      products.push({
        id:`p${i+1}`,
        name:document.getElementById(`p${i}-name`)?.value||'',
        price:document.getElementById(`p${i}-price`)?.value||'',
        insp:document.getElementById(`p${i}-insp`)?.value||'',
        img:imgUrl,
        size:sizeInfo
      });
    }
    updateProducts(products);
    await setDoc(doc(db,'settings','site'), {products, updatedAt:new Date()}, {merge:true});
    for(const p of products){
      await setDoc(doc(db,'products',p.id), p, {merge:true});
    }
    showStatus(statusId,'✅ 6 منتوجات (60KB لكل واحد) - يبانو فجميع الأجهزة 🌍',true);
  }catch(e){
    console.error(e);
    showStatus(statusId,'❌ '+e.message,false);
  }
}

window.previewFile=function(input,imgId){
  const f=input.files[0]; if(!f) return;
  ultraCompress(f, 400, 80).then(({dataUrl})=>{
    document.getElementById(imgId).src=dataUrl;
    input.dataset.compressed=dataUrl;
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  init();
  loadLocal();
  document.getElementById('logo-file')?.addEventListener('change', e=>window.previewFile(e.target,'logo-preview'));
  for(let i=0;i<6;i++){
    document.getElementById(`p${i}-file`)?.addEventListener('change', e=>window.previewFile(e.target,`p${i}-preview`));
  }
});
init();
loadLocal();
