
(function(){
  /* oude ankerlinks van de one-pager doorsturen */
  var oud = {'#opdrachtgevers':'/voor-opdrachtgevers/','#professionals':'/werken-via-zet/','#over':'/over-zet/','#contact':'/contact/','#rekentool':'/rekentool/'};
  if(location.pathname === '/' && oud[location.hash]){ location.replace(oud[location.hash]); return; }
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var header = document.getElementById('header');

  /* header */
  var lastY = 0;
  window.addEventListener('scroll', function(){
    var y = window.scrollY;
    header.classList.toggle('scrolled', y > 40);
    if(!document.body.classList.contains('menu-open')){
      if(y > 140 && y > lastY + 8) header.classList.add('hidden');
      else if(y < lastY - 8 || y < 140) header.classList.remove('hidden');
    }
    lastY = y;
    var mc = document.getElementById('mobCta');
    if(mc){ var inForm = false; document.querySelectorAll('form[data-zet-form]').forEach(function(f){ var r = f.getBoundingClientRect(); if(r.top < window.innerHeight - 80 && r.bottom > 80) inForm = true; }); mc.classList.toggle('show', y > 420 && !inForm); }
  }, {passive:true});

  var burger = document.getElementById('burger');
  burger.addEventListener('click', function(){
    var open = document.body.classList.toggle('menu-open');
    document.getElementById('navLinks').classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && document.body.classList.contains('menu-open')){ burger.click(); burger.focus(); } });
  document.querySelectorAll('.dd-toggle').forEach(function(t){
    t.addEventListener('click', function(){
      var g = t.parentNode; var open = g.classList.toggle('open');
      t.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
  /* gegevens van een eerder ingevulde poort hergebruiken (alleen in deze browser) */
  try {
    var lead = JSON.parse(localStorage.getItem('zet_lead') || 'null');
    if(lead){ document.querySelectorAll('form[data-prefill]').forEach(function(f){
      var n = f.querySelector('[name=naam]'), e = f.querySelector('[name=email]');
      if(n && !n.value) n.value = lead.naam || ''; if(e && !e.value) e.value = lead.email || '';
    }); }
  } catch(e){}

  /* reveals */
  var els = document.querySelectorAll('.rv');
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target);} });
    }, {threshold:0, rootMargin:'0px 0px 90px 0px'});
    els.forEach(function(el){ io.observe(el); });
  } else { els.forEach(function(el){ el.classList.add('in'); }); }

  /* parallax (home) */
  if(!reduceMotion){
    var planesWrap = document.getElementById('heroPlanes');
    if(planesWrap){
      var planes = planesWrap.querySelectorAll('[data-depth]');
      var tx=0, ty=0, cx=0, cy=0, raf;
      window.addEventListener('mousemove', function(e){
        tx = (e.clientX/window.innerWidth - .5); ty = (e.clientY/window.innerHeight - .5);
        if(!raf) raf = requestAnimationFrame(tick);
      }, {passive:true});
      var tick = function(){
        cx += (tx-cx)*.06; cy += (ty-cy)*.06;
        planes.forEach(function(p){ var d = parseFloat(p.dataset.depth)*220; p.style.translate = (cx*-d)+'px '+(cy*-d)+'px'; });
        raf = (Math.abs(tx-cx)>.001||Math.abs(ty-cy)>.001) ? requestAnimationFrame(tick) : null;
      };
    }
  }

  /* magnetische knoppen */
  if(!reduceMotion && matchMedia('(pointer:fine)').matches){
    var mags = document.querySelectorAll('[data-magnet]');
    document.addEventListener('mousemove', function(e){
      mags.forEach(function(btn){
        var r = btn.getBoundingClientRect();
        var dx = e.clientX-(r.left+r.width/2), dy = e.clientY-(r.top+r.height/2);
        if(Math.hypot(dx,dy) < 110){ btn.style.transform = 'translate('+(dx*.18)+'px,'+(dy*.18)+'px)'; }
        else if(btn.style.transform){ btn.style.transform = ''; }
      });
    }, {passive:true});
  }

  /* analytics-events */
  function track(name, params){ if(typeof gtag === 'function'){ gtag('event', name, params||{}); } }
  document.querySelectorAll('a[href^="tel:"]').forEach(function(a){ a.addEventListener('click', function(){ track('contact_click',{method:'telefoon'}); }); });
  document.querySelectorAll('a[href^="mailto:"]').forEach(function(a){ a.addEventListener('click', function(){ track('contact_click',{method:'email'}); }); });
  document.querySelectorAll('a[href*="linkedin.com"]').forEach(function(a){ a.addEventListener('click', function(){ track('linkedin_click',{}); }); });

  /* formulieren (Formspree, AJAX) */
  document.querySelectorAll('form[data-zet-form]').forEach(function(form){
    form.addEventListener('input', function(){ var er = form.querySelector('.form-error'); if(er){ er.style.display='none'; } });
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var btn = form.querySelector('button[type=submit]');
      var ok = form.querySelector('.form-success'), err = form.querySelector('.form-error');
      if(err){ err.style.display='none'; }
      var required = form.querySelectorAll('[required]');
      form.querySelectorAll('.field-msg').forEach(function(x){ x.remove(); });
      form.querySelectorAll('[aria-invalid]').forEach(function(x){ x.removeAttribute('aria-invalid'); });
      for(var i=0;i<required.length;i++){
        var leeg = !required[i].value.trim(), fout = (required[i].type==='email' && required[i].value.indexOf('@')<0);
        if(leeg || fout){
          if(err){ err.textContent='Vul alle verplichte velden in, met een geldig e-mailadres.'; err.style.display='block'; }
          required[i].setAttribute('aria-invalid','true');
          var msg = document.createElement('p'); msg.className='field-msg'; msg.textContent = fout && !leeg ? 'Vul een geldig e-mailadres in.' : 'Dit veld is verplicht.';
          required[i].parentNode.appendChild(msg);
          required[i].focus(); if(required[i].scrollIntoView){ required[i].scrollIntoView({behavior:'smooth', block:'center'}); } return;
        }
      }
      var fd = new FormData(form);
      var btnText = btn.innerHTML; btn.disabled = true; btn.innerHTML = 'Versturen…';
      var samenvatting = [];
      form.querySelectorAll('.field').forEach(function(x){
        var lab = x.querySelector('label'), inp = x.querySelector('input,select,textarea');
        if(lab && inp && inp.value && inp.type !== 'hidden'){ samenvatting.push('<li><span>' + lab.textContent.replace(' *','') + '</span>' + inp.value.replace(/</g,'&lt;') + '</li>'); }
      });
      fetch(form.action, {method:'POST', body:fd, headers:{'Accept':'application/json'}})
        .then(function(r){ return r.ok ? r.json() : Promise.reject(r); })
        .then(function(){
          form.querySelectorAll('.field, .form-grid, .form-privacy, .form-alt').forEach(function(x){ x.style.display='none'; });
          btn.style.display='none';
          var naam = (fd.get('naam')||'').toString().split(' ')[0];
          if(ok){ ok.style.display='block'; ok.setAttribute('tabindex','-1'); ok.focus({preventScroll:false}); if(naam){ ok.textContent = ok.textContent.replace('{naam}', naam); } else { ok.textContent = ok.textContent.replace(', {naam}',''); }
            if(samenvatting.length){ var sv = document.createElement('ul'); sv.className='form-samenvatting'; sv.innerHTML = '<li class="fs-kop">Verstuurd</li>' + samenvatting.join(''); ok.parentNode.insertBefore(sv, ok.nextSibling); } }
          var intro = form.querySelector('.form-intro'); if(intro){ intro.style.display='none'; }
          track('generate_lead', {form_name: form.dataset.zetForm, lead_type: fd.get('type')||form.dataset.zetForm});
          try { localStorage.setItem('zet_lead', JSON.stringify({naam: fd.get('naam')||'', email: fd.get('email')||''})); } catch(e){}
          form.dispatchEvent(new CustomEvent('zet:success'));
          /* direct een kennismaking inplannen (Cal.com) */
          var cal = form.dataset.cal || '';
          if(!cal && form.dataset.calOg){ var tp = (fd.get('type')||'').toString(); cal = tp === 'Professional' ? form.dataset.calPro : (tp === 'Opdrachtgever' ? form.dataset.calOg : ''); }
          if(cal){
            var je = /professional/.test(cal);
            var q = '?name=' + encodeURIComponent(fd.get('naam')||'') + '&email=' + encodeURIComponent(fd.get('email')||'');
            var bl = document.createElement('div'); bl.className = 'cal-plan';
            bl.innerHTML = '<p class="cal-kop">' + (je ? 'Wil je direct een kennismaking inplannen?' : 'Wilt u direct een kennismaking inplannen?') + '</p>' +
              '<p class="cal-tekst">' + (je ? 'Kies zelf een moment in de agenda van Mees. Je krijgt meteen een bevestiging met een Teams-link.' : 'Kies zelf een moment in de agenda van Mees. U krijgt meteen een bevestiging met een Teams-link.') + '</p>' +
              '<a class="btn btn-coral" href="' + cal + q + '" target="_blank" rel="noopener">Kies een moment <span class="arr" aria-hidden="true">→</span></a>';
            form.appendChild(bl);
            track('kennismaking_agenda_getoond', {form_name: form.dataset.zetForm});
          }
        })
        .catch(function(){
          btn.disabled=false; btn.innerHTML=btnText;
          if(err){ err.textContent='Versturen is niet gelukt. Mail ons gerust direct op info@dejuistezet.nl of bel 06-17499285.'; err.style.display='block'; }
        });
    });
  });

  /* rekentool */
  var rT = document.getElementById('r-tarief'), rU = document.getElementById('r-uren');
  if(rT && rU){
    var fmt = function(n){ return '€ ' + Math.round(n).toLocaleString('nl-NL'); };
    var used = false;
    var nT = document.getElementById('n-tarief');
    var calc = function(){
      var tarief = +rT.value, uren = +rU.value;
      if(nT && document.activeElement !== nT){ nT.value = tarief; }
      document.getElementById('v-uren').textContent = uren;
      [rT,rU].forEach(function(r){ r.style.setProperty('--fill', ((r.value-r.min)/(r.max-r.min)*100)+'%'); });
      var BRUTO_FACTOR = 0.455;
      var uurloon = tarief*BRUTO_FACTOR;
      var basis = uurloon*uren*(52/12);
      var vakgeld = basis*0.08;
      var tb = document.getElementById('t-basis'); if(tb){ tb.textContent = fmt(basis); }
      var tu = document.getElementById('t-uur'); if(tu){ tu.textContent = fmt(uurloon); }
      document.getElementById('t-salaris').textContent = fmt(basis + vakgeld);
      var lv = document.getElementById('t-live'); if(lv){ lv.textContent = fmt(basis + vakgeld); }
      document.getElementById('t-vakgeld').textContent = fmt(vakgeld);
      if(!used){ used = true; track('rekentool_gebruik',{}); }
    };
    rT.addEventListener('input', calc); rU.addEventListener('input', calc);
    if(nT){ nT.addEventListener('input', function(){ var v = Math.max(40, Math.min(250, +nT.value || 0)); if(v >= 40){ rT.value = Math.max(+rT.min, Math.min(+rT.max, v)); } calc(); if(v > +rT.max || v < +rT.min){ /* buiten schuifbereik: reken met ingetypte waarde */ var uren = +rU.value, basis = v*0.455*uren*(52/12), vak = basis*0.08; document.getElementById('t-salaris').textContent = fmt(basis+vak); document.getElementById('t-vakgeld').textContent = fmt(vak); var tb=document.getElementById('t-basis'); if(tb) tb.textContent=fmt(basis); var tu=document.getElementById('t-uur'); if(tu) tu.textContent=fmt(v*0.455); var om=document.getElementById('t-omzet'); if(om) om.textContent=fmt(v*uren*(52/12)); var lv=document.getElementById('t-live'); if(lv) lv.textContent=fmt(basis+vak); } }); }
    used = true; calc(); used = false;

    /* e-mailgate */
    var gate = document.getElementById('gate'), gated = document.getElementById('gated');
    var unlock = function(){ if(gate){ gate.style.display='none'; } if(gated){ gated.classList.remove('gate-blur'); } };
    var stored = false;
    try { stored = localStorage.getItem('zet_rt') === '1'; } catch(e){}
    if(stored){ unlock(); }
    var gf = document.getElementById('gateForm');
    if(gf){ gf.addEventListener('zet:success', function(){ try{ localStorage.setItem('zet_rt','1'); }catch(e){} setTimeout(unlock, 900); track('rekentool_unlock',{}); }); }
  }

  /* cookies / consent */
  var cb = document.getElementById('cookie');
  var consent = null;
  try { consent = localStorage.getItem('zet_consent'); } catch(e){}
  function applyConsent(v){
    try { localStorage.setItem('zet_consent', v); } catch(e){}
    if(typeof gtag === 'function'){ gtag('consent','update',{analytics_storage: v==='ja' ? 'granted' : 'denied'}); }
    if(cb) cb.classList.remove('show');
  }
  if(cb){
    if(consent === 'ja'){ applyConsent('ja'); }
    else if(consent !== 'nee'){ cb.classList.add('show'); }
    document.getElementById('cookieJa').addEventListener('click', function(){ applyConsent('ja'); });
    document.getElementById('cookieNee').addEventListener('click', function(){ applyConsent('nee'); });
  }

  
  /* whitepaper-gate */
  document.querySelectorAll('form[data-zet-form="whitepaper"]').forEach(function(f){
    var slug = f.dataset.wp, key = 'zet_wp_' + slug, dl = document.getElementById('wp-dl-' + slug);
    var show = function(){ if(dl){ dl.hidden = false; } };
    var stored = false;
    try { stored = localStorage.getItem(key) === '1'; } catch(e){}
    if(stored){ f.style.display = 'none'; show(); }
    f.addEventListener('zet:success', function(){
      try { localStorage.setItem(key, '1'); } catch(e){}
      setTimeout(function(){ show(); if(dl && dl.scrollIntoView){ dl.scrollIntoView({behavior:'smooth', block:'center'}); } }, 500);
      track('whitepaper_unlock', {whitepaper: slug});
    });
  });
  document.querySelectorAll('a[data-wp-dl]').forEach(function(a){ a.addEventListener('click', function(){ track('whitepaper_download', {whitepaper: a.dataset.wpDl}); }); });

  var y = document.getElementById('year'); if(y) y.textContent = new Date().getFullYear();
})();
