
// Admin - Firebase same as old version - parfums collection + config/site doc
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, deleteDoc, doc, setDoc, onSnapshot, getDoc, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDwrJ2FR0NVggoXeKchu2YGqqam5ZFMZXU",
  authDomain: "parfum-e53ad.firebaseapp.com",
  projectId: "parfum-e53ad",
  storageBucket: "parfum-e53ad.firebasestorage.app",
  messagingSenderId: "791467480753",
  appId: "1:791467480753:web:4c370b7e3635a37686f490"
};

const db = getFirestore(initializeApp(firebaseConfig));
let siteConfig = {}, curImg = '', logoImg = '';
const $ = id => document.getElementById(id);

const toBase64 = (file, maxW=600) => new Promise(res=>{
  const fr=new FileReader();
  fr.onload=e=>{
    const im=new Image();
    im.onload=()=>{
      const c=document.createElement('canvas');
      let w=im.width, h=im.height;
      if(w>maxW){h=h*maxW/w; w=maxW;}
      c.width=w; c.height=h;
      c.getContext('2d').drawImage(im,0,0,w,h);
      res(c.toDataURL('image/jpeg',0.8));
    };
    im.src=e.target.result;
  };
  fr.readAsDataURL(file);
});

const toBase64PNG = (file, maxW=800) => new Promise(res=>{
  const fr=new FileReader();
  fr.onload=e=>{
    const im=new Image();
    im.onload=()=>{
      const c=document.createElement('canvas');
      let w=im.width, h=im.height;
      if(w>maxW){h=h*maxW/w; w=maxW;}
      c.width=w; c.height=h;
      c.getContext('2d').drawImage(im,0,0,w,h);
      // Keep PNG for logo if needed - use jpeg for smaller size but clear
      res(c.toDataURL('image/png'));
    };
    im.src=e.target.result;
  };
  fr.readAsDataURL(file);
});

$('p-image')?.addEventListener('change', async e=>{
  const f=e.target.files[0]; if(!f) return;
  curImg = await toBase64(f, 600);
  $('p-preview').src = curImg;
  $('p-preview').classList.remove('hidden');
});

$('logoImageInput')?.addEventListener('change', async e=>{
  const f=e.target.files[0]; if(!f) return;
  logoImg = await toBase64PNG(f, 800); // PNG for big clear logo
  $('logoPreview').src = logoImg;
  $('logoPreview').classList.remove('hidden');
});

window.afterLogin = ()=>{
  onSnapshot(collection(db,'parfums'), snap=>{
    const all = snap.docs;
    const valid = all.filter(d=>{const p=d.data(); return p.name && p.name!=='undefined' && p.name.trim().length>1 && p.price;});
    const invalid = all.filter(d=>{const p=d.data(); return !p.name || p.name==='undefined' || !p.price;});
    $('st-count').textContent = all.length;
    $('st-valid').textContent = valid.length;
    $('st-invalid').textContent = invalid.length;
    if(invalid.length>0){$('invalidBox').classList.remove('hidden'); $('invalidCount').textContent=invalid.length;} else {$('invalidBox').classList.add('hidden');}
    $('productsList').innerHTML = valid.map(d=>{
      const p=d.data();
      return `<div class="admin-card p-3 flex gap-3"><img src="${p.imageBase64||p.image||''}" class="w-14 h-14 object-contain bg-zinc-50 rounded-lg border"><div class="flex-1"><p class="font-bold text-[13px]">${p.name}</p><p class="text-[12px] text-[#0B7A6E]">${p.price} MAD ${p.bestseller?'🔥':''}</p><button onclick="window.delProduct('${d.id}')" class="text-[11px] text-red-500 mt-1">حذف</button></div></div>`;
    }).join('') || '<div class="py-10 text-center text-zinc-400">لا يوجد منتجات صالحة</div>';
  });
  getDoc(doc(db,'config','site')).then(s=>{
    if(s.exists()){
      siteConfig=s.data();
      $('logoTextInput').value = siteConfig.logoText||'';
      renderSlider();
    }
  });
};

window.delProduct = async id=>{ if(confirm('حذف المنتج من السحابة؟ سيختفي من كل الأجهزة')) await deleteDoc(doc(db,'parfums',id)); };

window.cleanInvalid = async()=>{
  if(!confirm(`حذف ${$('st-invalid').textContent} منتجات خاوية؟`)) return;
  const snap = await getDocs(collection(db,'parfums'));
  let c=0;
  for(const d of snap.docs){
    const p=d.data();
    if(!p.name || p.name==='undefined' || !p.price){ await deleteDoc(doc(db,'parfums',d.id)); c++; }
  }
  alert(`تم حذف ${c} منتجات خاوية - الآن المتجر سيظهر المنتجات الصحيحة`);
};

$('btnAdd').onclick = async()=>{
  const name=$('p-name').value.trim(), price=Number($('p-price').value), cat=$('p-cat').value, desc=$('p-desc').value, best=$('p-best').checked;
  if(!name){alert('❌ الاسم مطلوب'); return;}
  if(!price){alert('❌ الثمن مطلوب'); return;}
  if(!curImg){alert('❌ الصورة مطلوبة'); return;}
  $('btnAdd').textContent='⏳ جاري الرفع...'; $('btnAdd').disabled=true;
  try{
    // SAME FIELD NAMES AS OLD VERSION - so style changes don't break data
    await addDoc(collection(db,'parfums'),{
      name, price, category:cat, description:desc, bestseller:best,
      imageBase64: curImg, image: curImg, // keep both for compatibility
      created: Date.now()
    });
    alert('✅ تم - المنتج الآن يظهر في المتجر في أي جهاز');
    $('p-name').value=''; $('p-price').value=''; curImg=''; $('p-preview').classList.add('hidden'); $('p-image').value='';
  }catch(e){alert('خطأ: '+e.message);}
  $('btnAdd').textContent='☁️ رفع للسحابة - يظهر في أي جهاز'; $('btnAdd').disabled=false;
};

function renderSlider(){
  const slider = siteConfig.slider||[];
  $('sliderEdits').innerHTML = slider.map((sl,i)=>`
    <div class="border rounded-xl p-3 mb-3 bg-white">
      <input data-i="${i}" data-k="title" value="${sl.title||''}" class="w-full border rounded px-3 py-2 mb-2 text-[13px]" placeholder="العنوان">
      <input data-i="${i}" data-k="sub" value="${sl.sub||''}" class="w-full border rounded px-3 py-2 mb-2 text-[12px]" placeholder="الوصف">
      <div class="flex gap-2"><input type="file" data-i="${i}" class="slFile flex-1 text-[11px] border-2 border-dashed rounded p-2"><img src="${sl.img||''}" class="h-10 w-16 object-cover rounded border"></div>
    </div>`).join('');
  document.querySelectorAll('.slFile').forEach(inp=>{
    inp.addEventListener('change', async e=>{
      const b = await toBase64(e.target.files[0], 1200);
      siteConfig.slider[e.target.dataset.i].img = b;
      e.target.nextElementSibling.src = b;
    });
  });
  document.querySelectorAll('#sliderEdits input[data-k]').forEach(inp=>{
    inp.addEventListener('input', e=>{ siteConfig.slider[e.target.dataset.i][e.target.dataset.k]=e.target.value; });
  });
}

$('btnAddSlide').onclick = ()=>{ siteConfig.slider=siteConfig.slider||[]; siteConfig.slider.push({title:'عنوان جديد', sub:'وصف', img:'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1600&q=80'}); renderSlider(); };
$('btnSaveSlider').onclick = async()=>{ await setDoc(doc(db,'config','site'),{slider:siteConfig.slider},{merge:true}); alert('تم حفظ السلايدر في السحابة - يظهر في كل الأجهزة'); };
$('btnSaveLogo').onclick = async()=>{
  const u={logoText:$('logoTextInput').value};
  if(logoImg) u.logoImage = logoImg; // SAME FIELD - logoImage - so old store still reads it, now bigger
  await setDoc(doc(db,'config','site'),{...siteConfig,...u},{merge:true});
  alert('تم حفظ اللوغو PNG - سيظهر كبير 92px وواضح في المتجر');
};
