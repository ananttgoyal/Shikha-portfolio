(function(global,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory();
 else global.ShikhaQuickAdmissionsCalculator=factory();
})(typeof window!=='undefined'?window:this,function(){
 'use strict';
 function calculate(p){
  const hasTarget=p.target!==''&&p.target!==null&&p.target!==undefined;
  const leads=Number(p.leads), admissions=Number(p.admissions);
  const target=hasTarget?Number(p.target):null;
  const days=Number(p.days||30), scenarioPct=Number(p.scenarioPct);
  if(![leads,admissions,days,scenarioPct].every(Number.isFinite)||(hasTarget&&!Number.isFinite(target)))throw Error('Enter valid numbers.');
  if([leads,admissions].some(x=>x<0||!Number.isInteger(x))||(hasTarget&&(target<0||!Number.isInteger(target)))||!Number.isInteger(days)||days<1)throw Error('Enter whole, non-negative enquiry and admission counts.');
  if(admissions>leads)throw Error('Admissions cannot exceed enquiries from the same period.');
  if(scenarioPct<1||scenarioPct>100)throw Error('Choose a scenario conversion between 1% and 100%.');
  const rate=leads>0?admissions/leads:null;
  const goal=hasTarget?target:admissions;
  // Without a future target, report actual enquiry volume, not a forecast.
  const baseline=hasTarget?(goal===0?0:rate>0?Math.ceil(goal/rate):null):leads;
  const baselineDaily=baseline===null?null:Math.ceil(baseline/days);
  // Only a meaningful positive admissions count produces an optional scenario.
  const scenario=goal>0?Math.ceil(goal/(scenarioPct/100)):hasTarget?0:null;
  const saved=rate>0&&scenario!==null&&baseline!==null?baseline-scenario:null;
  return {rate,hasTarget,goal,baseline,baselineDaily,scenario,scenarioDaily:scenario===null?null:Math.ceil(scenario/days),saved,days,scenarioPct,leads,admissions};
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
 const fmt=x=>x===null?'—':nf.format(x);
 function render(){
  const err=el('quick-error');err.hidden=true;err.textContent='';
  const lv=parse(leads),av=parse(admissions),hasTarget=target.value.trim()!=='',tv=hasTarget?parse(target):null;
  if(!touchedSlider&&Number.isFinite(lv)&&lv>0&&Number.isFinite(av)&&av<=lv){
   slider.value=Math.max(1,Math.min(100,Math.round(av/lv*100)+5));
  }
  const scenarioPct=Number(slider.value);
  el('quick-scenario-value').textContent=scenarioPct+'%';
  el('quick-scenario-label').textContent=scenarioPct+'% conversion';
  const valid=[lv,av].every(x=>Number.isInteger(x)&&x>=0)&&av<=lv&&(!hasTarget||(Number.isInteger(tv)&&tv>=0));
  if(!valid){
   out.forEach(id=>{el(id).textContent='—'});
   el('quick-explanation').textContent='Enter your current enquiries and confirmed admissions from the same 30-day period.';
   err.hidden=false;
   err.textContent=av>lv&&Number.isFinite(av)&&Number.isFinite(lv)
    ?'Admissions cannot be greater than enquiries.'
    :hasTarget&&(!Number.isInteger(tv)||tv<0)?'The optional target must be a non-negative whole number.'
    :'Enter non-negative whole numbers for enquiries and admissions. The target is optional.';
   return;
  }
  const r=window.ShikhaQuickAdmissionsCalculator.calculate({leads:lv,admissions:av,target:hasTarget?tv:null,days:30,scenarioPct});
  el('quick-current-rate').textContent=r.rate===null?'—':pf.format(r.rate);
  el('quick-needed-leads').textContent=fmt(r.baseline);
  el('quick-leads-day').textContent=fmt(r.baselineDaily);
  el('quick-scenario-leads').textContent=fmt(r.scenario);
  el('quick-scenario-day').textContent=fmt(r.scenarioDaily);
  el('quick-baseline-label').textContent=r.hasTarget?'Enquiries needed for your target':'Your actual enquiries in 30 days';
  el('quick-daily-label').textContent=r.hasTarget?'Enquiries needed per day':'Your current enquiries per day';
  el('quick-daily-context').textContent=r.hasTarget?'To reach '+fmt(r.goal)+' admissions in 30 days at your current conversion':'Based on '+fmt(r.leads)+' recorded enquiries over 30 days';
  el('quick-scenario-context').textContent=r.hasTarget?'For a goal of '+fmt(r.goal)+' admissions':'For your current '+fmt(r.admissions)+' admissions';
  const savings=r.saved===null?'No reliable comparison yet':r.saved>0?fmt(r.saved)+' fewer enquiries':r.saved<0?fmt(-r.saved)+' more enquiries':'Same enquiry requirement';
  el('quick-savings').textContent=savings;
  el('quick-savings').setAttribute('data-direction',r.saved===null?'none':r.saved>0?'better':r.saved<0?'worse':'none');
  if(r.rate===null){
   el('quick-explanation').textContent='No enquiries recorded yet. Your current daily enquiry count is visible above. Add a future target to explore a hypothetical conversion scenario.';
  }else if(r.rate===0){
   el('quick-explanation').textContent='Your current conversion is 0%. You recorded '+fmt(r.leads)+' enquiries without confirmed admissions. Record outcomes before forecasting at your current rate; an improved conversion scenario is hypothetical.';
  }else if(!r.hasTarget){
   el('quick-explanation').textContent='From '+fmt(r.leads)+' enquiries, '+fmt(r.admissions)+' became admissions ('+pf.format(r.rate)+'). To achieve those same '+fmt(r.admissions)+' admissions at '+scenarioPct+'% conversion, the estimate is '+fmt(r.scenario)+' enquiries. Add an optional target to forecast next month.';
  }else{
   el('quick-explanation').textContent='At your current '+pf.format(r.rate)+' conversion, a target of '+fmt(r.goal)+' admissions would take approximately '+fmt(r.baseline)+' enquiries. At '+scenarioPct+'% conversion, the estimate is '+fmt(r.scenario)+'. Estimates are not guarantees.';
  }
  const msg=r.hasTarget
   ?'Hi Aanant, I tried the Shikha Solutions Admissions Calculator. My current conversion is '+(r.rate===null?'not available':pf.format(r.rate))+'. I am planning '+fmt(r.goal)+' admissions, with an estimated '+fmt(r.baselineDaily)+' enquiries per day at my current conversion. Can we discuss follow-up and counselling?'
   :'Hi Aanant, I tried the Shikha Solutions Admissions Calculator. I received '+fmt(r.leads)+' enquiries and '+fmt(r.admissions)+' admissions in 30 days. My current conversion is '+(r.rate===null?'not available':pf.format(r.rate))+'. Can we discuss improving follow-up and counselling?';
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
