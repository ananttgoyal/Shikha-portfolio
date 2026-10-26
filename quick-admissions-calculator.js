(function(global,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory();
 else global.ShikhaQuickAdmissionsCalculator=factory();
})(typeof window!=='undefined'?window:this,function(){
 'use strict';
 function calculate(p){
  const leads=Number(p.leads), admissions=Number(p.admissions),target=Number(p.target),days=Number(p.days||30),scenarioPct=Number(p.scenarioPct);
  if(![leads,admissions,target,days,scenarioPct].every(Number.isFinite))throw Error('Enter valid numbers.');
  if([leads,admissions,target].some(x=>x<0||!Number.isInteger(x))||!Number.isInteger(days)||days<1)throw Error('Enter whole, non-negative enquiry and admission counts.');
  if(admissions>leads)throw Error('Admissions cannot exceed enquiries from the same period.');
  if(scenarioPct<1||scenarioPct>100)throw Error('Choose a scenario conversion between 1% and 100%.');
  const rate=leads>0?admissions/leads:null;
  const baseline=rate>0?Math.ceil(target/rate):null;
  const scenario= Math.ceil(target/(scenarioPct/100));
  const saved=baseline===null?null:baseline-scenario;
  return {rate,baseline,baselineDaily:baseline===null?null:Math.ceil(baseline/days),scenario,
    scenarioDaily:Math.ceil(scenario/days),saved,days,scenarioPct};
 }
 return {calculate};
});
(function(){
 'use strict';
 const root=document.getElementById('quick-calculator');
 if(!root||!window.ShikhaQuickAdmissionsCalculator)return;
 const el=id=>document.getElementById(id);
 const leads=el('quick-leads'),admissions=el('quick-admissions'),target=el('quick-target'),slider=el('quick-conversion');
 const nf=new Intl.NumberFormat('en-IN',{maximumFractionDigits:0});
 const pf=new Intl.NumberFormat('en-IN',{maximumFractionDigits:1,style:'percent'});
 const out=['quick-current-rate','quick-needed-leads','quick-leads-day','quick-scenario-leads','quick-scenario-day','quick-savings'];
 let touchedSlider=false,tracked=false;
 const parse=field=>field.value.trim()===''?NaN:Number(field.value);
 function fmt(x){return x===null?'—':nf.format(x)}
 function render(){
  const err=el('quick-error');err.hidden=true;err.textContent='';
  const lv=parse(leads),av=parse(admissions),tv=parse(target);
  if(!touchedSlider&&Number.isFinite(lv)&&lv>0&&Number.isFinite(av)&&av<=lv){
   slider.value=Math.max(1,Math.min(100,Math.round(av/lv*100)+5));
  }
  const scenario=Number(slider.value);
  el('quick-scenario-value').textContent=scenario+'%';
  el('quick-scenario-label').textContent=scenario+'% conversion';
  const valid=[lv,av,tv].every(x=>Number.isInteger(x)&&x>=0)&&av<=lv;
  if(!valid){
   out.forEach(id=>{el(id).textContent='—'});
   err.hidden=false;err.textContent=av>lv&&Number.isFinite(av)&&Number.isFinite(lv)
    ?'Admissions cannot be greater than enquiries.': 'Enter non-negative whole numbers in all three fields.';
   return;
  }
  const r=window.ShikhaQuickAdmissionsCalculator.calculate({leads:lv,admissions:av,target:tv,days:30,scenarioPct:scenario});
  el('quick-current-rate').textContent=r.rate===null?'—':pf.format(r.rate);
  el('quick-needed-leads').textContent=fmt(r.baseline);
  el('quick-leads-day').textContent=fmt(r.baselineDaily);
  el('quick-scenario-leads').textContent=fmt(r.scenario);
  el('quick-scenario-day').textContent=fmt(r.scenarioDaily);
  el('quick-savings').textContent=r.saved===null?'No baseline yet':r.saved>0?fmt(r.saved)+' fewer enquiries':r.saved<0?fmt(-r.saved)+' more enquiries':'Same enquiry requirement';
  el('quick-savings').setAttribute('data-direction',r.saved===null?'none':r.saved>0?'better':r.saved<0?'worse':'none');
  el('quick-explanation').textContent=r.baseline===null
    ?'No positive historical conversion is available yet. The scenario is hypothetical. Record confirmed admissions before relying on a target forecast.'
    :'At your current '+pf.format(r.rate)+' enquiry conversion, '+fmt(tv)+' admissions need approximately '+fmt(r.baseline)+' enquiries in 30 days. Move the slider to explore how changing conversion changes the daily lead requirement.';
  const msg='Hi Aanant, I tried the free Admissions Calculator. My current conversion is '+(r.rate===null?'not available':pf.format(r.rate))+'. To reach '+nf.format(tv)+' admissions in 30 days the estimate is '+fmt(r.baselineDaily)+' enquiries/day. I would like to discuss lead generation and counselling follow-up.';
  el('quick-whatsapp').href='https://wa.me/917758859995?text='+encodeURIComponent(msg);
 }
 function record(){if(!tracked&&window.ShikhaTracking){window.ShikhaTracking.event('quick_calculator_used',{tool_name:'coaching_admissions'});tracked=true}}
 [leads,admissions,target].forEach(input=>input.addEventListener('input',()=>{record();render()}));
 slider.addEventListener('input',()=>{touchedSlider=true;record();render()});
 el('open-advanced').addEventListener('click',()=>{
  const detail=el('advanced-calculator');detail.open=true;
  const form=el('admissions-form');
  if(form){form.elements.leads.value=leads.value;form.elements.admissions.value=admissions.value;form.elements.target.value=target.value;form.elements.days.value='30'}
  detail.scrollIntoView({behavior:'smooth',block:'start'});
 });
 render();
})();
