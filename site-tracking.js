/* Shared optional measurement and session campaign attribution. No form PII is sent to Google Analytics or Meta. */
(function(){
  'use strict';
  var PIXEL_ID='1379267867650441', GA_ID='G-TTPKSFHKHH';
  var KEYS=['utm_source','utm_medium','utm_campaign','utm_content','utm_term'];
  var campaign={},gaReady=false,ready=false,leadSent=new Set();
  function readConsent(){try{return localStorage.getItem('shikha-tracking-consent-v2')}catch(e){return null}}
  try{campaign=JSON.parse(sessionStorage.getItem('shikha-campaign')||'{}')}catch(e){}
  var params=new URLSearchParams(location.search),incoming={};
  KEYS.forEach(function(key){if(params.get(key))incoming[key]=params.get(key).trim().slice(0,160)});
  if(Object.keys(incoming).length){campaign=incoming;campaign.landing_path=location.pathname.slice(0,200)}
  if(!campaign.landing_path)campaign.landing_path=location.pathname.slice(0,200);
  try{sessionStorage.setItem('shikha-campaign',JSON.stringify(campaign))}catch(e){}
  function initPixel(){
    if(ready||readConsent()!=='accepted')return;
    ready=true;
    if(!window.fbq){var n=window.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};window._fbq=n;n.push=n;n.loaded=true;n.version='2.0';n.queue=[];var s=document.createElement('script');s.async=true;s.src='https://connect.facebook.net/en_US/fbevents.js';document.head.appendChild(s)}
    window.fbq('consent','grant');window.fbq('init',PIXEL_ID);window.fbq('track','PageView');
  }
  function safeUrl(raw){
    try{var u=new URL(raw);return u.origin+u.pathname}catch(e){return ''}
  }
  function initAnalytics(){
    if(gaReady||readConsent()!=='accepted')return;
    gaReady=true;window['ga-disable-'+GA_ID]=false;
    window.dataLayer=window.dataLayer||[];
    window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};
    window.gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
    window.gtag('consent','update',{analytics_storage:'granted'});
    window.gtag('js',new Date());
    var options={page_location:safeUrl(location.href),page_referrer:safeUrl(document.referrer),allow_google_signals:false,allow_ad_personalization_signals:false};
    var fields={utm_source:'campaign_source',utm_medium:'campaign_medium',utm_campaign:'campaign_name',utm_content:'campaign_content',utm_term:'campaign_term'};
    KEYS.forEach(function(key){if(campaign[key])options[fields[key]]=campaign[key]});
    window.gtag('config',GA_ID,options);
    var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id='+GA_ID;document.head.appendChild(s);
  }
  function choice(value){
    try{localStorage.setItem('shikha-tracking-consent-v2',value)}catch(e){}
    if(value==='accepted'){
      window['ga-disable-'+GA_ID]=false;
      if(gaReady&&window.gtag)window.gtag('consent','update',{analytics_storage:'granted'});
      if(ready&&window.fbq)window.fbq('consent','grant');
      initPixel();initAnalytics();
    }else{
      window['ga-disable-'+GA_ID]=true;
      if(window.gtag)window.gtag('consent','update',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
      if(window.fbq)window.fbq('consent','revoke');
    }
    var b=document.getElementById('tracking-choice');if(b)b.hidden=true;
  }
  function banner(){
    var b=document.getElementById('tracking-choice');if(b){b.hidden=false;return}
    b=document.createElement('aside');b.id='tracking-choice';b.setAttribute('aria-label','Optional tracking preferences');
    b.style.cssText='position:fixed;bottom:20px;left:20px;right:20px;max-width:640px;z-index:1000;background:#fff;color:#061A33;border:1px solid #C98A16;border-radius:12px;padding:18px;box-shadow:0 8px 30px #061a3326;font:14px/1.5 Arial,sans-serif';
    b.innerHTML='<p style="margin:0 0 12px">May we use optional Google Analytics and Meta advertising cookies to measure visits and enquiries? You can use all forms without accepting. <a href="/privacy.html" style="text-decoration:underline">Privacy Policy</a></p><div style="display:flex;gap:10px;flex-wrap:wrap"><button type="button" data-choice="accepted">Accept optional tracking</button><button type="button" data-choice="declined">Decline</button></div>';
    b.querySelectorAll('button').forEach(function(x){x.style.cssText='padding:10px 14px;cursor:pointer;border:1px solid #061A33;border-radius:6px;background:#F7F3EC;color:#061A33;font:inherit';x.onclick=function(){choice(x.dataset.choice)}});document.body.appendChild(b);
  }
  window.ShikhaTracking={
    attribution:function(){return Object.assign({},campaign)},
    lead:function(formName){if(readConsent()!=='accepted'||leadSent.has(formName))return;initPixel();initAnalytics();leadSent.add(formName);window.fbq('track','Lead',{content_name:formName});window.gtag('event','generate_lead',{send_to:GA_ID,form_name:formName})},
    preferences:banner
  };
  initPixel();initAnalytics();
  document.addEventListener('DOMContentLoaded',function(){
    document.querySelectorAll('form').forEach(function(form){KEYS.concat(['landing_path']).forEach(function(key){var input=document.createElement('input');input.type='hidden';input.name=key;input.value=campaign[key]||'';form.appendChild(input)})});
    document.querySelectorAll('[data-tracking-preferences]').forEach(function(x){x.addEventListener('click',banner)});
    if(!readConsent())banner();
  });
})();
