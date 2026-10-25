(function(){
'use strict';
const form=document.getElementById('admissions-form');
if(!form||!window.ShikhaAdmissionsCalculator)return;
const byId=id=>document.getElementById(id);
const number=new Intl.NumberFormat('en-IN',{maximumFractionDigits:0});
const rupees=new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0});
const pct=v=>v===null?'Not available':new Intl.NumberFormat('en-IN',{style:'percent',maximumFractionDigits:1}).format(v);
const fmt=v=>v===null?'Not available':number.format(v);
const money=v=>v===null?'Not available':rupees.format(v);
function read(){
 const fields=Object.fromEntries(new FormData(form));
 return Object.fromEntries(Object.entries(fields).map(([k,v])=>[k,k==='qualifiedDay'&&v.trim()===''?'':v.trim()]));
}
form.addEventListener('submit',event=>{
 event.preventDefault();
 const err=byId('calc-error');err.hidden=true;err.textContent='';
 if(!form.reportValidity())return;
 try{
  const calc=window.ShikhaAdmissionsCalculator.compute(read());
  byId('out-rate').textContent=pct(calc.rate);
  byId('out-interested-rate').textContent=pct(calc.interestedRate);
  byId('out-target-leads').textContent=fmt(calc.projectedLeads);
  byId('out-daily-leads').textContent=fmt(calc.projectedLeadDay);
  byId('out-qualified-daily').textContent=fmt(calc.interestedNeededPerDay);
  byId('out-cac').textContent=money(calc.actualCostPerAdmission);
  byId('out-spend').textContent=money(calc.expectedSpend);
  byId('out-breakeven').textContent=fmt(calc.breakEven);
  const notes=byId('result-notes');notes.replaceChildren();
  calc.warnings.forEach(w=>{
    const p=document.createElement('p');p.className='result-note';p.textContent=w;notes.appendChild(p);
  });
  const p=calc.input;
  const summary=calc.projectedLeads===null
    ?'You have not yet established a positive admissions conversion rate from the enquiries in your sample. Start by tracking actual enquiries through to confirmed admissions before making a target-leads forecast.'
    :'You recorded '+number.format(p.admissions)+' admissions from '+number.format(p.leads)+' enquiries over '+number.format(p.days)+' days ('+pct(calc.rate)+'). At the same conversion rate, a target of '+number.format(p.target)+' admissions would require about '+fmt(calc.projectedLeads)+' enquiries, or '+fmt(calc.projectedLeadDay)+' per day over the next '+number.format(p.days)+' days.';
  byId('out-summary').textContent=summary+(calc.interestedRate!==null?' Based on your reported interested leads, estimated interested-lead conversion is '+pct(calc.interestedRate)+'; that implies about '+fmt(calc.interestedNeededPerDay)+' interested leads per day for the target.':'');
  byId('out-costs').textContent=calc.breakEven===null
    ?'Cost per admission and break-even cannot be estimated reliably from this baseline, or estimated contribution per admission is not positive. Review actual conversion, fees and all expense categories.'
    :'At your entered acquisition cost, the historical lead acquisition spend is '+money(calc.actualCostPerAdmission)+' per confirmed admission. Estimated break-even is '+fmt(calc.breakEven)+' admissions during this period after direct delivery, acquisition and fixed costs. At your target, estimated remaining contribution after those costs is '+money(calc.estimatedContribution)+'.';
  const msg='Hi Aanant, I used the Shikha Solutions Coaching Admissions Calculator. My current conversion is '+pct(calc.rate)+', my desired admissions target is '+number.format(p.target)+', and the estimate is '+fmt(calc.projectedLeadDay)+' leads/day. I want help with more qualified leads, enquiry follow-up and counselling conversions.';
  byId('results-whatsapp').href='https://wa.me/917758859995?text='+encodeURIComponent(msg);
  byId('calc-results').hidden=false;
  byId('result-heading').focus();
  byId('calc-results').scrollIntoView({behavior:'smooth',block:'start'});
 }catch(error){
  byId('calc-results').hidden=true;err.hidden=false;
  err.textContent=error&&error.message?error.message:'Please check your figures and try again.';
  err.focus();
 }
});
byId('calc-print').addEventListener('click',()=>{window.print()});
})();
