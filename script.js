
const toggle=document.querySelector('.mobile-toggle');
const menu=document.querySelector('.menu');
if(toggle&&menu){toggle.addEventListener('click',()=>{const isOpen=menu.classList.toggle('open');toggle.setAttribute('aria-expanded',String(isOpen))})}

document.querySelectorAll('.catalog-link').forEach(link=>{
  link.textContent='Carnaval';
  link.setAttribute('aria-label','Carnavalscatalogus');
});

const topbar=document.querySelector('.topbar');
if(topbar){
  let previousScroll=Math.max(window.scrollY,0);
  let ticking=false;
  const updateTopbar=()=>{
    const currentScroll=Math.max(window.scrollY,0);
    if(currentScroll>previousScroll&&currentScroll>90){
      topbar.classList.add('is-hidden');
      document.body.classList.add('topbar-hidden');
    }else if(currentScroll<previousScroll||currentScroll<=24){
      topbar.classList.remove('is-hidden');
      document.body.classList.remove('topbar-hidden');
    }
    previousScroll=currentScroll;
    ticking=false;
  };
  window.addEventListener('scroll',()=>{
    if(!ticking){window.requestAnimationFrame(updateTopbar);ticking=true}
  },{passive:true});
}
const io=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}})},{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
document.querySelectorAll('.faq details').forEach(d=>{d.addEventListener('toggle',()=>{if(d.open){d.parentElement.querySelectorAll('details').forEach(o=>{if(o!==d)o.open=false})}})});

const parallaxHeroes=document.querySelectorAll('.hero,.page-hero,.drivein-hero,.private-hero-image');
if(parallaxHeroes.length&&window.matchMedia('(max-width: 980px)').matches&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  let parallaxTicking=false;
  const updateParallax=()=>{
    parallaxHeroes.forEach(hero=>{
      const rect=hero.getBoundingClientRect();
      if(rect.bottom>0&&rect.top<window.innerHeight){
        const offset=Math.max(-24,Math.min(36,-rect.top*.075));
        hero.style.setProperty('--parallax-y',`${offset}px`);
      }
    });
    parallaxTicking=false;
  };
  window.addEventListener('scroll',()=>{
    if(!parallaxTicking){window.requestAnimationFrame(updateParallax);parallaxTicking=true}
  },{passive:true});
  updateParallax();
}

const contactForm=document.querySelector('[data-contact-form]');
if(contactForm){
  const submitButton=contactForm.querySelector('button[type="submit"]');
  const formStatus=contactForm.querySelector('.form-status');
  contactForm.addEventListener('submit',async event=>{
    event.preventDefault();
    if(!contactForm.reportValidity())return;
    submitButton.disabled=true;
    submitButton.textContent='Bezig met versturen…';
    formStatus.textContent='';
    formStatus.className='form-status';
    try{
      const response=await fetch(contactForm.action,{method:'POST',body:new FormData(contactForm),headers:{Accept:'application/json'}});
      if(!response.ok)throw new Error('Formulier kon niet worden verstuurd');
      contactForm.reset();
      submitButton.textContent='Aanvraag verstuurd';
      formStatus.textContent='Bedankt! Je bericht is verstuurd. We nemen zo snel mogelijk contact met je op.';
      formStatus.classList.add('is-success');
    }catch(error){
      submitButton.disabled=false;
      submitButton.textContent='Verstuur aanvraag';
      formStatus.textContent='Het versturen is niet gelukt. Probeer het opnieuw of mail naar info@decibelsound.nl.';
      formStatus.classList.add('is-error');
    }
  });
}

const carnavalPromoKey='decibel-carnaval-promo-2027-last-shown';
const carnavalPromoInterval=12*60*60*1000;
const isCarnavalCatalog=document.body.classList.contains('carnaval-page');
const isHomePage=/(^|\/)index\.html$/.test(window.location.pathname)||window.location.pathname==='/'||window.location.pathname.endsWith('/Output/');
let promoLastShown=0;
try{promoLastShown=Number(localStorage.getItem(carnavalPromoKey)||0)}catch(error){promoLastShown=0}
const promoIsDue=!promoLastShown||Date.now()-promoLastShown>=carnavalPromoInterval;
if(isHomePage&&!isCarnavalCatalog&&promoIsDue){
  window.setTimeout(()=>{
    try{localStorage.setItem(carnavalPromoKey,String(Date.now()))}catch(error){/* De popup werkt ook zonder webopslag. */}
    const promo=document.createElement('div');
    promo.className='carnaval-promo';
    promo.innerHTML=`
      <button class="carnaval-promo__backdrop" type="button" data-promo-close aria-label="Popup sluiten"></button>
      <section class="carnaval-promo__card" role="dialog" aria-modal="true" aria-labelledby="carnaval-promo-title" tabindex="-1">
        <button class="carnaval-promo__close" type="button" data-promo-close aria-label="Popup sluiten">×</button>
        <div class="carnaval-promo__visual" aria-hidden="true"></div>
        <div class="carnaval-promo__content">
          <p class="carnaval-promo__eyebrow">Carnavalsverhuur 2027</p>
          <h2 id="carnaval-promo-title">Geluid en licht nodig voor jullie carnavals<wbr>wagen?</h2>
          <p>Bekijk de sets en stel jullie pakket samen.</p>
          <div class="carnaval-promo__actions"><a class="btn" href="carnaval.html">Bekijk carnavalssets</a><button type="button" data-promo-close>Sluiten</button></div>
        </div>
      </section>`;
    const closePromo=()=>{
      promo.classList.remove('is-visible');
      document.body.classList.remove('carnaval-promo-open');
      window.setTimeout(()=>promo.remove(),320);
    };
    promo.querySelectorAll('[data-promo-close]').forEach(button=>button.addEventListener('click',closePromo));
    promo.addEventListener('keydown',event=>{if(event.key==='Escape')closePromo()});
    document.body.appendChild(promo);
    document.body.classList.add('carnaval-promo-open');
    window.requestAnimationFrame(()=>{
      promo.classList.add('is-visible');
      promo.querySelector('.carnaval-promo__card').focus({preventScroll:true});
    });
  },900);
}
