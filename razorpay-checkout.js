// Razorpay Standard Checkout for buttons marked data-razorpay-plan="<plan id>".
// The key id and amount come from /api/create-order; no secrets live here.
(function(){
  'use strict';
  var SCRIPT='https://checkout.razorpay.com/v1/checkout.js';
  var loading=null;
  function loadCheckout(){
    if(window.Razorpay) return Promise.resolve();
    if(loading) return loading;
    loading=new Promise(function(resolve,reject){
      var s=document.createElement('script');s.src=SCRIPT;s.async=true;
      s.onload=resolve;s.onerror=function(){loading=null;reject(new Error('Could not load Razorpay Checkout.'));};
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

  function pay(btn){
    var plan=btn.getAttribute('data-razorpay-plan');
    setBusy(btn,true);show(btn,'Opening secure payment…','info');
    Promise.all([loadCheckout(),post('/api/create-order',{plan:plan})]).then(function(r){
      var order=r[1];
      var rzp=new window.Razorpay({
        key:order.key_id,
        amount:order.amount,
        currency:order.currency,
        order_id:order.order_id,
        name:'Shikha Solutions',
        description:order.name,
        image:'/favicon-192x192.png',
        theme:{color:'#061A33'},
        handler:function(resp){
          show(btn,'Confirming your payment…','info');
          post('/api/verify-payment',{
            razorpay_payment_id:resp.razorpay_payment_id,
            razorpay_order_id:resp.razorpay_order_id,
            razorpay_signature:resp.razorpay_signature
          }).then(function(v){
            show(btn,'Payment successful. Thank you! Payment ID: '+v.payment_id+'. We will contact you shortly to schedule Day 0.','success');
            btn.textContent='Paid ✓';
            if(typeof window.gtag==='function') window.gtag('event','purchase',{transaction_id:v.payment_id,value:order.amount/100,currency:order.currency,items:[{item_name:order.name}]});
          }).catch(function(e){
            setBusy(btn,false);
            show(btn,'We received a payment response but could not verify it ('+e.message+'). Please contact us with Payment ID '+resp.razorpay_payment_id+' — do not pay again.','error');
          });
        },
        modal:{ondismiss:function(){setBusy(btn,false);show(btn,'Payment cancelled. You have not been charged.','info');}}
      });
      rzp.on('payment.failed',function(resp){
        var err=(resp&&resp.error)||{};
        show(btn,'Payment failed: '+(err.description||'please try again or use another method.'),'error');
      });
      rzp.open();
    }).catch(function(e){setBusy(btn,false);show(btn,e.message,'error');});
  }

  document.addEventListener('click',function(ev){
    var btn=ev.target.closest&&ev.target.closest('[data-razorpay-plan]');
    if(!btn) return;
    ev.preventDefault();
    if(!btn.disabled) pay(btn);
  });
})();
