// SENTEL FINAL - Logo TRIO fix - small base64 40KB - visible on all devices
const FIREBASE_CONFIG = {
  apiKey:"AIzaSyA2daZ7FWckKStgUvZyRbYDT6ZyRbYDT6ZAYDz_5A",
  authDomain:"trioparfum-7a2c3.firebaseapp.com",
  projectId:"trioparfum-7a2c3",
  storageBucket:"trioparfum-7a2c3.firebasestorage.app",
  messagingSenderId:"938937787112",
  appId:"1:938937787112:web:90ccff1fbb9d26a8df5d"
};

import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {getFirestore,doc,setDoc,onSnapshot} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const app=initializeApp(FIREBASE_CONFIG);
const db=getFirestore(app);

// Ultra compress - 40KB max
function ultraCompress(file, maxW=350, maxKB=60){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=e=>{
      const img=new Image();
      img.onload=()=>{
        const canvas=document.createElement('canvas');
        let w=img.width, h=img.height;
        if(w>maxW){ h=h*maxW/w; w=maxW; }
        canvas.width=w; canvas.height=h;
        canvas.getContext('2d').drawImage(img,0,0,w,h);
        let q=0.55;
        let dataUrl=canvas.toDataURL('image/jpeg', q);
        while(dataUrl.length > maxKB*1024*1.37 && q>0.15){
          q-=0.07;
          dataUrl=canvas.toDataURL('image/jpeg', q);
        }
        console.log(`Compress ${file.name}: ${(file.size/1024).toFixed(0)}KB -> ${(dataUrl.length/1024).toFixed(0)}KB q=${q.toFixed(2)}`);
        resolve(dataUrl);
      };
      img.src=e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function updateLogo(url){
  if(!url) return;
  const hl=document.getElementById('header-logo');
  const lt=document.getElementById('logo-text');
  const fl=document.getElementById('footer-logo');
  const ft=document.getElementById('footer-logo-text');
  const adminPrev=document.getElementById('logo-preview');
  if(hl){hl.src=url; hl.style.display='block';}
  if(lt) lt.style.display='none';
  if(fl){fl.src=url; fl.style.display='block';}
  if(ft) ft.style.display='none';
  if(adminPrev) adminPrev.src=url;
  localStorage.setItem('sentel_logo_url', url);
  console.log("✅ Logo updated on page", url.substring(0,50));
}

function startSync(){
  // Listen to logo from Firebase - visible on ALL devices
  onSnapshot(doc(db,'settings','site'), snap=>{
    if(snap.exists()){
      const data=snap.data();
      console.log("📥 Firebase site data", data);
      if(data.logoUrl){
        updateLogo(data.logoUrl);
        document.getElementById('firebase-status')&&(document.getElementById('firebase-status').innerHTML='✅ Logo depuis Firebase - Visible partout 🌍');
      }
    }else{
      console.log("No settings/site doc yet");
    }
  }, err=>{
    console.error("Firestore error", err);
    const local=localStorage.getItem('sentel_logo_url');
    if(local) updateLogo(local);
  });
}

window.saveLogo=async function(){
  const input=document.getElementById('logo-file');
  const file=input?.files[0];
  if(!file){alert('اختر صورة اللوغو');return;}
  const status=document.getElementById('logo-status');
  if(status) status.innerHTML='⏳ ضغط...';
  try{
    const dataUrl=await ultraCompress(file, 350, 60);
    if(status) status.innerHTML=`⏳ رفع ${(dataUrl.length/1024).toFixed(0)}KB...`;
    updateLogo(dataUrl);
    await setDoc(doc(db,'settings','site'), {logoUrl:dataUrl, updatedAt:new Date()}, {merge:true});
    if(status) status.innerHTML='✅ Logo 50KB - يبان فجميع الأجهزة 🌍 - Rechargez index.html فجهاز آخر';
    console.log("✅ Logo saved to Firebase");
  }catch(e){
    console.error(e);
    if(status) status.innerHTML='❌ '+e.message;
    alert(e.message);
  }
}

window.previewFile=function(input,imgId){
  const f=input.files[0]; if(!f) return;
  ultraCompress(f, 400, 80).then(dataUrl=>{
    document.getElementById(imgId).src=dataUrl;
  });
}

// Init
document.addEventListener('DOMContentLoaded', ()=>{
  startSync();
  const local=localStorage.getItem('sentel_logo_url');
  if(local) updateLogo(local);
  document.getElementById('logo-file')?.addEventListener('change', e=>window.previewFile(e.target,'logo-preview'));
});
startSync();
const local=localStorage.getItem('sentel_logo_url');
if(local) updateLogo(local);
