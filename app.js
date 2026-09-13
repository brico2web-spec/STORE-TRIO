
// TRIO PARFUM - Store App - Firebase linked same as old version
// Firebase collections: 'parfums' (products) and 'config/site' (slider, logo, phrases)
// Fields preserved: name, price, oldPrice, description, category, bestseller, imageBase64, image, img
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDwrJ2FR0NVggoXeKchu2YGqqam5ZFMZXU",
  authDomain: "parfum-e53ad.firebaseapp.com",
  projectId: "parfum-e53ad",
  storageBucket: "parfum-e53ad.firebasestorage.app",
  messagingSenderId: "791467480753",
  appId: "1:791467480753:web:4c370b7e3635a37686f490"
};

let db;
try { db = getFirestore(initializeApp(firebaseConfig)); } catch(e){ console.error('Firebase init', e); }

let products = [], cart = [], picks = [];
let cfg = {
  offerPrice: 200,
  offerDesc: "اضغط لاختيار 3 عطور من الأكثر مبيعاً",
  phrases: ["توصيل مجاني","الدفع عند الاستلام","خصم 93%","ثبات 24 ساعة"],
  slider: [
    {title:'عطرك.. بصمتك التي لا تُنسى ✨', sub:'ثبات يدوم 24 ساعة • تركيز عالي', img:'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1600&q=80'},
    {title:'لمسة واحدة.. وتسحر القلوب 💖', sub:'تشكيلة 2026 فاخرة', img:'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=1600&q=80'},
    {title:'فخامة لا تقاوم - الآن ب 149 درهم 🔥', sub:'شحن مجاني لكل المدن', img:'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=1600&q=80'}
  ],
  logoText: 'TRIÖ<span class="font-normal text-[#0B7A6E]"> PARFUM</span>',
  logoImage: ''
};

const $ = id => document.getElementById(id);

export function isValidProduct(p){
  if(!p) return false;
  const name = (p.name||'').toString().trim();
  if(!name || name==='undefined' || name.length<2) return false;
  const price = Number(p.price);
  if(!price || isNaN(price) || price<=0) return false;
  const img = p.imageBase64 || p.image || p.img || '';
  if(!img || img.length<10) return false;
  return true;
}
export function getImage(p){
  let img = p.imageBase64 || p.image || p.img || '';
  if(img.startsWith('http') || img.startsWith('data:')) return img;
  return 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80';
}

function productCard(p){
  const img = getImage(p);
  const disc = Math.round((1 - p.price/(p.oldPrice||p.old||899))*100);
  return `
  <div class="card p-6 group">
    <div class="relative bg-gradient-to-br from-[#F7FFFD] to-white rounded-[22px] aspect-square overflow-hidden grid place-items-center border border-white/70">
      <img src="${img}" class="w-full h-full object-contain p-7 group-hover:scale-[1.12] transition duration-700" loading="lazy">
      <div class="absolute top-4 left-4 flex flex-col gap-2">
        ${p.bestseller?'<div class="badge-hot text-white text-[12px] font-[800] px-4 py-2 rounded-full">🔥 BESTSELLER</div>':''}
        <div class="badge-off text-white text-[14px] font-[900] px-4 py-2 rounded-full">-${disc}%</div>
      </div>
    </div>
    <div class="mt-6">
      <h3 class="font-[800] text-[22px] leading-[1.1]">${p.name}</h3>
      <p class="text-[15px] text-zinc-600 mt-2.5 line-clamp-2 font-[500]">${p.description||'عطر فاخر بثبات 24 ساعة - تركيز عالي'}</p>
      <div class="flex items-end justify-between mt-6">
        <div><div class="flex items-baseline gap-2"><span class="font-[800] text-[28px]">${p.price}</span><span class="text-[14px] font-bold text-zinc-500">MAD</span></div><div class="text-[13px] text-zinc-400 line-through">${p.oldPrice||p.old||899} MAD</div></div>
        <button onclick="window.addToCart('${p.id}')" class="w-[56px] h-[56px] rounded-full bg-zinc-900 text-white grid place-items-center hover:scale-110 transition shadow-xl">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>
      <button onclick="window.pickForBundle('${p.id}')" class="w-full mt-6 py-4 bg-white border-2 border-zinc-900 rounded-full font-[800] text-[16px] hover:bg-zinc-900 hover:text-white transition flex items-center justify-center gap-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L13.09 8.26L22 9L13.5 15L14.5 22L12 18L9.5 22L10.5 15L2 9L10.91 8.26L12 2Z"/></svg>
        أضف للباقة ${cfg.offerPrice} درهم
      </button>
    </div>
  </div>`;
}

function renderProducts(){
  const grid = $('grid'), count=$('prodCount');
  if(!products.length){
    grid.innerHTML = `<div class="col-span-full py-24 text-center glass rounded-[32px]"><p class="font-bold text-[20px]">لا توجد منتجات بعد</p><p class="text-[15px] text-zinc-600 mt-3">اذهب للأدمن وأضف منتجاتك الأولى - الصور ستظهر في أي جهاز</p><a href="admin.html" class="mt-6 inline-block px-8 py-4 bg-zinc-900 text-white rounded-full font-bold">افتح الأدمن ☁️</a></div>`;
    count.textContent='0 منتجات';
    return;
  }
  count.textContent = products.length + ' منتجات • سحابة ☁️';
  grid.innerHTML = products.map(p=>productCard(p)).join('');
}

function renderSlider(){
  const el=$('slider'), dots=$('dots');
  if(!cfg.slider||!cfg.slider.length) cfg.slider=[{title:'عطرك.. بصمتك التي لا تُنسى ✨', sub:'ثبات 24 ساعة', img:'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1600&q=80'}];
  let valid = cfg.slider.filter(s=>s&&(s.img||s.image)&&s.title);
  if(!valid.length) valid=cfg.slider;
  el.innerHTML = valid.map((s,i)=>`
    <div class="slide absolute inset-0 transition-opacity duration-700 ${i===0?'opacity-100':'opacity-0'}">
      <img src="${s.img||s.image}" class="absolute inset-0 w-full h-full object-cover">
      <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"></div>
      <div class="absolute bottom-8 left-6 right-6 md:bottom-16 md:left-12">
        <div class="glass inline-flex px-5 py-2.5 rounded-full text-[13px] font-[800] mb-5 shadow-lg">+200 عطر • توصيل مجاني 🚚</div>
        <h2 class="text-white text-[34px] md:text-[60px] font-[800] leading-[0.9] max-w-[15ch]">${s.title}</h2>
        <p class="text-white/90 mt-5 text-[17px] md:text-[22px] font-[600]">${s.sub||''}</p>
      </div>
    </div>`).join('');
  dots.innerHTML = valid.map((_,i)=>`<button onclick="window.goSlide(${i})" class="h-3 rounded-full transition-all ${i===0?'w-12 bg-zinc-900':'w-3 bg-zinc-300'}"></button>`).join('');
  let cur=0;
  window.goSlide = n=>{
    document.querySelectorAll('.slide').forEach((e,i)=>e.style.opacity=i===n?'1':'0');
    document.querySelectorAll('#dots button').forEach((d,i)=>{d.className=`h-3 rounded-full transition-all ${i===n?'w-12 bg-zinc-900':'w-3 bg-zinc-300'}`});
    cur=n;
  };
  setInterval(()=>{cur=(cur+1)%valid.length; window.goSlide(cur);},5000);
}

function renderPicks(){
  $('offerSlots').innerHTML = [0,1,2].map(i=>{
    const p=picks[i];
    if(p) return `<div class="card p-5 aspect-[4/5] flex flex-col shadow-xl relative"><div class="w-7 h-7 rounded-full bg-[#0B7A6E] text-white grid place-items-center text-[12px] font-bold absolute top-3 left-3">${i+1}</div><img src="${getImage(p)}" class="flex-1 object-contain p-3"><p class="font-[800] text-[16px] text-center mt-3">${p.name}</p><button onclick="window.removePick(${i})" class="mt-3 w-8 h-8 rounded-full bg-red-50 text-red-500 grid place-items-center mx-auto"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>`;
    return `<button onclick="window.openPickModal(${i})" class="rounded-[28px] aspect-[4/5] border-[2.5px] border-dashed border-[#8ED4BE] bg-white/70 backdrop-blur-xl grid place-items-center hover:bg-white hover:scale-[1.03] transition"><div class="text-center"><div class="w-20 h-20 rounded-full glass-strong mx-auto grid place-items-center text-[#0B7A6E] shadow-lg"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg></div><div class="font-[800] mt-4 text-[18px] text-[#0B7A6E]">${i+1}</div></div></button>`;
  }).join('');
  $('offerCounter').textContent = `${picks.length}/3`;
  $('offerOrderBtn').disabled = picks.length!==3;
}

// Globals for HTML onclick
window.openPickModal = i=>{
  $('pickModal').classList.remove('hidden');
  $('pickGrid').innerHTML = products.map(p=>`
    <button onclick="window.pickForBundle('${p.id}')" class="flex gap-4 p-5 glass rounded-[20px] hover:bg-white w-full text-right transition">
      <img src="${getImage(p)}" class="w-20 h-20 rounded-xl object-contain bg-white border"><div class="flex-1 text-right"><div class="font-[800] text-[18px]">${p.name}</div><div class="text-[14px] text-zinc-600 mt-1">${p.price} MAD</div></div>
      <div class="w-10 h-10 rounded-full bg-zinc-900 text-white grid place-items-center"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg></div>
    </button>`).join('');
};
window.closePick = ()=> $('pickModal').classList.add('hidden');
window.clearPicks = ()=>{picks=[]; renderPicks();};
window.removePick = i=>{picks.splice(i,1); renderPicks();};
window.pickForBundle = id=>{
  const p=products.find(x=>x.id===id);
  if(picks.length>=3) return alert('الباقة مكتملة - 3 عطور فقط');
  if(picks.find(x=>x.id===id)) return alert('العطر موجود في الباقة');
  picks.push(p); renderPicks(); window.closePick();
};
window.addToCart = id=>{const p=products.find(x=>x.id===id); cart.push(p); updateCart();};
window.goSlide = ()=>{};
function updateCart(){
  $('cartCount').textContent=cart.length;
  $('cartCount').classList.toggle('hidden', cart.length===0);
  $('cartList').innerHTML = cart.map((x,i)=>`
    <div class="flex gap-4 py-4 border-b"><img src="${getImage(x)}" class="w-16 h-16 rounded-xl bg-white object-contain border"><div class="flex-1"><p class="font-bold text-[16px]">${x.name}</p><p class="text-[14px] text-[#0B7A6E] font-bold">${x.price} MAD</p></div><button onclick="cart.splice(${i},1);window.updateCart()" class="w-9 h-9 rounded-full glass grid place-items-center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>`).join('')||'<div class="py-20 text-center text-zinc-500">السلة فارغة</div>';
  const total = cart.reduce((a,b)=>a+Number(b.price||0),0)+(picks.length===3?cfg.offerPrice:0);
  $('cartTotal').textContent = total+' MAD';
}
window.updateCart = updateCart;
window.orderNow = ()=>{
  let txt = picks.length===3?`السلام بغيت عرض 3 عطور ب ${cfg.offerPrice} درهم: ${picks.map(p=>p.name).join(' + ')}`:`بغيت نطلب: ${cart.map(c=>c.name).join(', ')} - المجموع ${cart.reduce((a,b)=>a+Number(b.price||0),0)} MAD`;
  window.open(`https://wa.me/212612345678?text=${encodeURIComponent(txt)}`,'_blank');
};
window.closeDrawer = ()=> $('drawer').classList.add('hidden');
window.order = window.orderNow;

function applyConfig(){
  $('offerPrice').textContent = cfg.offerPrice||200;
  $('offerDesc').textContent = cfg.offerDesc||'اضغط لاختيار 3 عطور من الأكثر مبيعاً';
  if(cfg.logoImage){
    const img=$('logoImg'); img.src=cfg.logoImage; img.classList.remove('hidden'); $('logoText').classList.add('hidden');
  } else {
    $('logoText').innerHTML = cfg.logoText||'TRIÖ<span class="font-normal text-[#0B7A6E]"> PARFUM</span>';
  }
  $('mqTop').textContent = (cfg.phrases||['توصيل مجاني','الدفع عند الاستلام']).join(' ✦ ');
  renderSlider(); renderPicks();
}

// Firebase listeners - SAME AS OLD VERSION - don't break data
if(db){
  onSnapshot(collection(db,'parfums'), snap=>{
    const all = snap.docs.map(d=>({id:d.id, ...d.data()}));
    const valid = all.filter(isValidProduct);
    products = valid;
    renderProducts();
  });
  onSnapshot(doc(db,'config','site'), snap=>{
    if(snap.exists()){ cfg={...cfg, ...snap.data()}; }
    applyConfig();
  }, ()=>applyConfig());
} else {
  applyConfig(); renderProducts();
}

document.getElementById('cartBtn')?.addEventListener('click', ()=>$('drawer').classList.remove('hidden'));
document.getElementById('offerOrderBtn')?.addEventListener('click', ()=>{if(picks.length===3) window.orderNow();});
