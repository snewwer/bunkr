'use strict';
/* BUNK:R — interactive school concept. No live reservations, accounts, or payments. */
const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const euro = value => new Intl.NumberFormat('en-IE',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2}).format(value);

// Reliable responsive navigation, visible active section and reading progress.
const menu = $('#site-nav');
const toggle = $('#menu-toggle');
function closeMenu(){menu.classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Open navigation')}
function setMenu(open){menu.classList.toggle('open',open);toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close navigation':'Open navigation')}
toggle.addEventListener('click',()=>setMenu(!menu.classList.contains('open')));
$$('.site-nav a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('click',event=>{if(menu.classList.contains('open')&&!menu.contains(event.target)&&!toggle.contains(event.target))closeMenu()});
window.addEventListener('resize',()=>{if(window.innerWidth>740)closeMenu()});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.classList.contains('open')){closeMenu();toggle.focus()}});
const sections = $$('.site-nav a').map(a=>({anchor:a,section:$(a.getAttribute('href'))})).filter(x=>x.section);
let scrollScheduled=false;
function onScroll(){
 scrollScheduled=false;
 const root=document.documentElement;
 const denom=Math.max(1,root.scrollHeight-window.innerHeight);
 $('#scroll-progress-bar').style.width=(Math.min(100,Math.max(0,window.scrollY/denom*100)))+'%';
 $('.site-header').classList.toggle('is-scrolled',window.scrollY>24);
 let active=null;
 for(const s of sections){if(s.section.getBoundingClientRect().top<=window.innerHeight*.45)active=s}
 for(const s of sections){if(s===active)s.anchor.setAttribute('aria-current','location');else s.anchor.removeAttribute('aria-current')}
}
function requestScroll(){if(!scrollScheduled){scrollScheduled=true;requestAnimationFrame(onScroll)}}
window.addEventListener('scroll',requestScroll,{passive:true});window.addEventListener('resize',requestScroll);onScroll();
const backToTop=$('#back-to-top');
function updateBackToTop(){const show=window.scrollY>740;backToTop.classList.toggle('visible',show);backToTop.tabIndex=show?0:-1;backToTop.setAttribute('aria-hidden',String(!show))}
window.addEventListener('scroll',updateBackToTop,{passive:true});
updateBackToTop();
backToTop.addEventListener('click',()=>{
 window.scrollTo({top:0,behavior:reducedMotion?'auto':'smooth'});
});

// Subtle reveal animations are progressive enhancements and respect reduced motion.
if(!reducedMotion && 'IntersectionObserver' in window){
 const targets=$$('.section-heading,.metrics-row,.about-wide,.gallery-card,.event-card,.ticket-guide,.member-banner,.vip-layout,.bands,.vip-services article,.menu-layout,.contact-content');
 const observer=new IntersectionObserver(entries=>{
   for(const entry of entries){if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}}
 },{threshold:.04,rootMargin:'0px 0px 80px 0px'});
 targets.forEach(target=>{target.classList.add('reveal');observer.observe(target)});
 document.documentElement.classList.add('has-reveal');
}

// Gallery filtering and accessible image browser.
const galleryCards=$$('.gallery-card');
const photoDialog=$('#image-dialog');
let displayedCards=[...galleryCards];
let currentPhotoIndex=0;
let returnFocus=null;
function showPhoto(index){
 if(!displayedCards.length)return;
 currentPhotoIndex=(index+displayedCards.length)%displayedCards.length;
 const card=displayedCards[currentPhotoIndex];
 const photo=$('#dialog-image');
 photo.src=card.dataset.image;
 photo.alt=$('img',card)?.alt || card.dataset.title;
 $('#dialog-title').textContent=card.dataset.title;
 $('#dialog-description').textContent=card.dataset.description;
 $('#image-counter').textContent=String(currentPhotoIndex+1).padStart(2,'0')+' / '+String(displayedCards.length).padStart(2,'0');
}
function openPhoto(card){
 displayedCards=galleryCards.filter(c=>!c.classList.contains('hidden'));
 returnFocus=document.activeElement;
 showPhoto(displayedCards.indexOf(card));
 if(!photoDialog.open)photoDialog.showModal();
 $('#close-image').focus();
}
galleryCards.forEach(card=>card.addEventListener('click',()=>openPhoto(card)));
function stepPhoto(direction){showPhoto(currentPhotoIndex+direction)}
$('#image-prev').addEventListener('click',()=>stepPhoto(-1));
$('#image-next').addEventListener('click',()=>stepPhoto(1));
$('#close-image').addEventListener('click',()=>photoDialog.close());
photoDialog.addEventListener('click',event=>{if(event.target===photoDialog)photoDialog.close()});
photoDialog.addEventListener('close',()=>returnFocus?.focus());
photoDialog.addEventListener('keydown',event=>{
 if(event.key==='ArrowRight'){event.preventDefault();stepPhoto(1)}
 if(event.key==='ArrowLeft'){event.preventDefault();stepPhoto(-1)}
});
let swipeStart=null;
$('#dialog-image').addEventListener('touchstart',event=>{swipeStart=event.changedTouches[0]?.clientX??null},{passive:true});
$('#dialog-image').addEventListener('touchend',event=>{
 if(swipeStart===null)return;
 const delta=(event.changedTouches[0]?.clientX??swipeStart)-swipeStart;
 if(Math.abs(delta)>55)stepPhoto(delta<0?1:-1);
 swipeStart=null;
},{passive:true});
$$('.filter').forEach(filter=>filter.addEventListener('click',()=>{
 const value=filter.dataset.filter;
 $$('.filter').forEach(button=>{const selected=button===filter;button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected))});
 galleryCards.forEach(card=>card.classList.toggle('hidden',value!=='all'&&card.dataset.category!==value));
 const count=galleryCards.filter(c=>!c.classList.contains('hidden')).length;
 $('#gallery-status').textContent='Showing '+count+' '+(count===1?'space':'spaces')+' · '+(filter.textContent.trim());
}));

// VIP table preview. Prices are the approved PLN packages shown as EUR equivalents.
const vipPrices={1:212.95,2:212.95,3:268.99,4:325.02,5:403.48,6:481.93};
let guests=4;
function updateVip(){
 const total=vipPrices[guests];
 $('#guest-count').textContent=String(guests);
 $('#vip-total').textContent=euro(total);
 $('#vip-per-person').textContent=euro(total/guests)+' per guest';
 $('#vip-minimum-note').textContent=guests===1?'Single guests pay the two-person minimum.':'';
 const tier=guests<=2?'PRIVATE TABLE':guests<=4?'STANDARD TABLE':'GROUP TABLE';
 $('#vip-package-label').textContent=tier+' / '+String(guests).padStart(2,'0')+' '+(guests===1?'GUEST':'GUESTS');
 $('#minus-guest').disabled=guests===1;
 $('#plus-guest').disabled=guests===6;
}
$('#minus-guest').addEventListener('click',()=>{guests=Math.max(1,guests-1);updateVip()});
$('#plus-guest').addEventListener('click',()=>{guests=Math.min(6,guests+1);updateVip()});
updateVip();

// Informational event and membership dialogs: these are concepts, not bookings.
const infoDialog=$('#info-dialog');
const eventInfo={
 raw:{title:'BUNK:R RAW',text:'Our proposed Friday format: hard techno in The Factory, an international guest DJ, and Polish support acts. The Basement offers a darker underground alternative. Dates and artists are still to be confirmed.'},
 factory:{title:'FACTORY TAKEOVER',text:'Our proposed Saturday headline event: an international techno artist, the complete red-and-white Laser Factory show, and different music across two dance floors. This is not a confirmed performance.'},
 sunday:{title:'WAREHOUSE FREQUENCY',text:'Our proposed Sunday format: international underground guests, acid and hypnotic techno, plus local Warsaw DJs. The atmosphere stays raw and industrial.'},
 member:{title:'BUNK:R MEMBERSHIP',text:'Membership is planned to be free. Benefits could include early ticket access, event announcements and special member opportunities. This is a school concept: no accounts are created and no personal information is collected.'}
};
let returnInfoFocus=null;
function openInfo(info){
 returnInfoFocus=document.activeElement;
 $('#info-title').textContent=info.title;
 $('#info-description').textContent=info.text;
 infoDialog.showModal();
 $('#close-info').focus();
}
$$('.event-details').forEach(button=>button.addEventListener('click',()=>openInfo(eventInfo[button.dataset.event])));
$('#member-info').addEventListener('click',()=>openInfo(eventInfo.member));
$('#close-info').addEventListener('click',()=>infoDialog.close());
$('#info-done').addEventListener('click',()=>infoDialog.close());
infoDialog.addEventListener('click',event=>{if(event.target===infoDialog)infoDialog.close()});
infoDialog.addEventListener('close',()=>returnInfoFocus?.focus());

// Approved menu prices: EUR display conversions; no real sales or payments.
const menus={
 drinks:[['Water','Still or sparkling',2.24],['Soft drink','Classic soft drinks',4.03],['Beer','Selected beer',5.16],['Spirit with mixer','Classic mixed drink',7.85],['Signature cocktail','BUNK:R cocktail selection',10.31],['Alcohol-free mocktail','No alcohol',6.72]],
 food:[['BUNK:R Loaded Fries','Warm late-night snack',6.50],['Factory Pizza Slice','Freshly served pizza slice',5.38],['Warsaw Zapiekanka','Polish-style toasted baguette',6.28],['Basement Nachos','Nachos with dip',7.17],['VIP Sharing Platter','For groups',19.05],['Night Fuel: Pizza + soft drink','Concept combination deal',8.74],['Night Fuel: Fries + soft drink','Concept combination deal',9.86]],
 bottles:[['House vodka 0.7 L + mixers','VIP table service',100.87],['Gin 0.7 L + mixers','VIP table service',112.08],['Whisky 0.7 L + mixers','VIP table service',123.29],['Premium vodka 0.7 L + mixers','VIP table service',145.70]],
 champagne:[['Prosecco 0.75 L','Sparkling wine, not Champagne',65.00],['Moët & Chandon Brut Impérial','Champagne bottle',145.70],['Moët & Chandon Rosé Impérial','Rosé Champagne bottle',168.12],['Veuve Clicquot Brut','Champagne bottle',168.12],['Dom Pérignon Vintage','Premium Champagne bottle',493.14]]
};
const menuMedia={
 drinks:{src:'assets/bar.webp',alt:'Industrial bar with glowing amber bottle shelves',kicker:'THE DOUBLE BAR SYSTEM',title:'TWO FLOORS. TWO BARS.'},
 food:{src:'assets/food.webp',alt:'BUNK:R concept food counter serving fries, pizza and late-night snacks',kicker:'BUNK:R FOOD STATION',title:'FUEL THE NIGHT.'},
 bottles:{src:'assets/vip_tables.webp',alt:'Private VIP tables with leather seating and drinks service',kicker:'VIP TABLE SERVICE',title:'MADE FOR THE SKYBRIDGE.'},
 champagne:{src:'assets/vip_tables.webp',alt:'Premium VIP lounge with leather seating and tables',kicker:'CHAMPAGNE SELECTION',title:'YOUR MOMENT ABOVE THE FLOOR.'}
};
function loadMenu(kind,{focus=false}={}){
 if(!menus[kind])return;
 $$('.menu-tab').forEach(button=>{
  const selected=button.dataset.menu===kind;
  button.classList.toggle('active',selected);
  button.setAttribute('aria-selected',String(selected));
  button.tabIndex=selected?0:-1;
  if(selected&&focus)button.focus();
 });
 const panel=$('#menu-items');panel.setAttribute('aria-labelledby','tab-'+kind);
 const rows=menus[kind].map(([name,detail,price])=>{
  const row=document.createElement('div');row.className='menu-row';
  const left=document.createElement('div');
  const title=document.createElement('div');title.className='menu-row-name';title.textContent=name;
  const sub=document.createElement('div');sub.className='menu-row-desc';sub.textContent=detail;
  left.append(title,sub);
  const cost=document.createElement('span');cost.className='menu-row-price';cost.textContent=euro(price);
  row.append(left,cost);return row;
 });
 panel.replaceChildren(...rows);
 $('#menu-note').textContent=(kind==='bottles'||kind==='champagne')?'Illustrative VIP bottle-service prices in EUR. Alcohol service and advertising require Polish legal compliance. This website does not sell any products.':'Illustrative customer prices in EUR, converted from the original Polish concept menu. No purchases are possible.';
 const visual=menuMedia[kind];
 const photo=$('#menu-photo');
 if(photo.getAttribute('src')!==visual.src){
  photo.classList.add('is-changing');
  photo.onload=()=>photo.classList.remove('is-changing');
  photo.onerror=()=>photo.classList.remove('is-changing');
  photo.src=visual.src;
  if(photo.complete)photo.classList.remove('is-changing');
 }
 photo.alt=visual.alt;
 $('#menu-photo-kicker').textContent=visual.kicker;
 $('#menu-photo-title').textContent=visual.title;
}
const menuTabs=$$('.menu-tab');
menuTabs.forEach(button=>{
 button.addEventListener('click',()=>loadMenu(button.dataset.menu));
 button.addEventListener('keydown',event=>{
  let index=menuTabs.indexOf(button);
  if(event.key==='ArrowRight')index=(index+1)%menuTabs.length;
  else if(event.key==='ArrowLeft')index=(index+menuTabs.length-1)%menuTabs.length;
  else if(event.key==='Home')index=0;
  else if(event.key==='End')index=menuTabs.length-1;
  else return;
  event.preventDefault();loadMenu(menuTabs[index].dataset.menu,{focus:true});
 });
});
loadMenu('drinks');

// All in-page links scroll reliably in offline previews and hosted versions.
// Native href targets remain present as a no-JavaScript fallback.
$$('a[href^="#"]').forEach(link=>link.addEventListener('click',event=>{
 const hash=link.getAttribute('href');
 const target=hash&&$(hash);
 if(!target)return;
 event.preventDefault();
 if(hash==='#top'||hash==='#home')window.scrollTo({top:0,behavior:reducedMotion?'auto':'smooth'});
 else target.scrollIntoView({behavior:reducedMotion?'auto':'smooth',block:'start'});
 // Keep deep links without requiring a server or performing a page reload.
 try { if(window.location.protocol!=='about:')window.history.replaceState(null,'',hash); } catch(_) { /* navigation still works */ }
}));
