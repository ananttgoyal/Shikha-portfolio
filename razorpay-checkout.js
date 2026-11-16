// Razorpay Standard Checkout for buttons marked data-razorpay-plan="<plan id>".
// Step 1: collect billing details + policy consent. Step 2: create the order on
// the server. Step 3: open Razorpay. Step 4: verify the signature on the server.
// The key id and amount come from /api/create-order; no secrets live here.
(function(){
  'use strict';
  var SCRIPT='https://checkout.razorpay.com/v1/checkout.js';
  var loading=null, dialog=null, activeBtn=null;

  function loadCheckout(){
    if(window.Razorpay) return Promise.resolve();
    if(loading) return loading;
    loading=new Promise(function(resolve,reject){
      var s=document.createElement('script');s.src=SCRIPT;s.async=true;
      s.onload=resolve;s.onerror=function(){loading=null;reject(new Error('Could not load the payment window. Check your connection and try again.'));};
      document.head.appendChild(s);
    });
    return loading;
  }
  function post(url,data){
    return fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})
      .then(function(r){return r.json().catch(function(){return {};}).then(function(j){if(!r.ok||!j.ok)throw new Error(j.error||'Something went wrong. Please try again.');return j;});});
  }
  function statusFor(btn){
    var el=btn.parentNode.querySelector('.pay-status');
    if(!el){el=document.createElement('p');el.className='pay-status';el.setAttribute('role','status');el.setAttribute('aria-live','polite');btn.insertAdjacentElement('afterend',el);}
    return el;
  }
  function show(btn,msg,kind){var el=statusFor(btn);el.textContent=msg;el.dataset.kind=kind||'';}
  function setBusy(btn,busy){btn.disabled=busy;btn.setAttribute('aria-busy',busy?'true':'false');}

  function buildDialog(){
    var d=document.createElement('dialog');
    d.className='pay-dialog';d.setAttribute('aria-labelledby','pay-dialog-title');
    d.innerHTML=
      '<form method="dialog" class="pay-form" novalidate>'+
        '<button type="button" class="pay-close" aria-label="Close">×</button>'+
        '<p class="pay-kicker">Secure payment</p>'+
        '<h2 id="pay-dialog-title">Your details</h2>'+
        '<p class="pay-summary"><strong data-pay-product></strong><span data-pay-amount></span></p>'+
        '<label>Full name<input name="name" autocomplete="name" required maxlength="100"></label>'+
        '<label>Email<input name="email" type="email" autocomplete="email" required maxlength="180"></label>'+
        '<label>Mobile / WhatsApp<input name="phone" type="tel" inputmode="numeric" autocomplete="tel" required maxlength="14" placeholder="10-digit Indian mobile"></label>'+
        '<label>Business name<input name="business" autocomplete="organization" required maxlength="150"></label>'+
        '<label>City<input name="city" autocomplete="address-level2" required maxlength="80"></label>'+
        '<label>GSTIN <span class="pay-optional">(optional, for a GST invoice)</span><input name="gstin" maxlength="15" autocapitalize="characters" spellcheck="false"></label>'+
        '<label class="pay-check"><input type="checkbox" name="agreeTerms" required> <span>I agree to the <a href="/terms.html" target="_blank" rel="noopener">Terms</a>, <a href="/refund-policy" target="_blank" rel="noopener">Refund &amp; Cancellation Policy</a> and <a href="/service-delivery-policy" target="_blank" rel="noopener">Service Delivery Policy</a>. I understand Day 0 is scheduled after payment and that results are not guaranteed.</span></label>'+
        '<p class="pay-error" role="alert"></p>'+
        '<button type="submit" class="btn btn-gold pay-submit">Continue to payment →</button>'+
        '<p class="pay-fine">Payments are processed securely by Razorpay (UPI, cards, net banking, wallets). We never see or store your card details. Cancel before Day 0 for a full refund.</p>'+
      '</form>';
    document.body.appendChild(d);
    var form=d.querySelector('form'), err=d.querySelector('.pay-error');
    d.querySelector('.pay-close').addEventListener('click',function(){d.close('cancel');});
    d.addEventListener('close',function(){if(d.returnValue!=='submit'&&activeBtn){setBusy(activeBtn,false);}});
    form.addEventListener('submit',function(ev){
      ev.preventDefault();
      var data={};new FormData(form).forEach(function(v,k){data[k]=String(v).trim();});
      data.agreeTerms=form.elements.agreeTerms.checked;
      var phone=data.phone.replace(/[\s()-]/g,'').replace(/^\+?91(?=\d{10}$)/,'');
      if(!data.name||!data.business||!data.city){err.textContent='Please fill in your name, business name and city.';return;}
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)){err.textContent='Please enter a valid email address — your receipt goes here.';return;}
      if(!/^[6-9]\d{9}$/.test(phone)){err.textContent='Please enter a valid 10-digit Indian mobile number.';return;}
      if(data.gstin&&!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i.test(data.gstin)){err.textContent='That GSTIN does not look right. Check it or leave it blank.';return;}
      if(!data.agreeTerms){err.textContent='Please accept the Terms and policies to continue.';return;}
      err.textContent='';
      data.phone=phone;data.gstin=data.gstin.toUpperCase();
      d.returnValue='submit';d.close('submit');
      pay(activeBtn,data);
    });
    return d;
  }

  function openDetails(btn){
    if(typeof HTMLDialogElement==='undefined'){show(btn,'Your browser cannot open the payment form. Please update it, or WhatsApp +91 77588 59995 for a payment link.','error');return;}
    dialog=dialog||buildDialog();
    activeBtn=btn;setBusy(btn,true);
    dialog.querySelector('[data-pay-product]').textContent=btn.getAttribute('data-product')||'';
    dialog.querySelector('[data-pay-amount]').textContent=btn.getAttribute('data-amount-label')||'';
    dialog.querySelector('.pay-error').textContent='';
    dialog.returnValue='';
    dialog.showModal();
    var first=dialog.querySelector('input[name=name]');if(first&&!first.value)first.focus();
  }

  function pay(btn,details){
    var plan=btn.getAttribute('data-razorpay-plan');
    show(btn,'Opening secure payment…','info');
    var payload={plan:plan};for(var k in details)payload[k]=details[k];
    Promise.all([loadCheckout(),post('/api/create-order',payload)]).then(function(r){
      var order=r[1];
      var rzp=new window.Razorpay({
        key:order.key_id,
        amount:order.amount,
        currency:order.currency,
        order_id:order.order_id,
        name:'Shikha Solutions',
        description:order.name,
        image:'/favicon-192x192.png',
        prefill:order.prefill,
        readonly:{email:true,contact:true},
        theme:{color:'#061A33'},
        handler:function(resp){
          show(btn,'Confirming your payment… please do not close this page.','info');
          post('/api/verify-payment',{
            razorpay_payment_id:resp.razorpay_payment_id,
            razorpay_order_id:resp.razorpay_order_id,
            razorpay_signature:resp.razorpay_signature
          }).then(function(v){
            show(btn,'Payment successful — thank you! Payment ID: '+v.payment_id+'. '+(v.receiptEmailed?'Your receipt has been emailed to '+details.email+'. ':'Please save this Payment ID; your receipt will follow by email. ')+'Aanant will contact you within 1 working day to schedule Day 0.','success');
            btn.textContent='Paid ✓';
            if(typeof window.gtag==='function') window.gtag('event','purchase',{transaction_id:v.payment_id,value:order.amount/100,currency:order.currency,items:[{item_name:order.name}]});
          }).catch(function(e){
            setBusy(btn,false);
            show(btn,'We received your payment but could not confirm it automatically ('+e.message+'). Please do not pay again — WhatsApp +91 77588 59995 with Payment ID '+resp.razorpay_payment_id+' and we will sort it out.','error');
          });
        },
        modal:{ondismiss:function(){setBusy(btn,false);show(btn,'Payment cancelled. You have not been charged.','info');}}
      });
      rzp.on('payment.failed',function(resp){
        var err=(resp&&resp.error)||{};
        show(btn,'Payment failed: '+(err.description||'please try again or use another method.')+' If money was deducted, it will be refunded automatically by your bank within 5–7 working days.','error');
      });
      rzp.open();
    }).catch(function(e){setBusy(btn,false);show(btn,e.message,'error');});
  }

  document.addEventListener('click',function(ev){
    var btn=ev.target.closest&&ev.target.closest('[data-razorpay-plan]');
    if(!btn) return;
    ev.preventDefault();
    if(!btn.disabled) openDetails(btn);
  });
})();
