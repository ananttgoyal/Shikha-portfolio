(function(){
'use strict';
const data=window.CoachingScore, answers=Array(12).fill(null), $=id=>document.getElementById(id);
let current=0, result=null, submitted=false;
const labels=['Rarely or not yet','Sometimes','Most of the time','Consistently'];
function showQuestion(){
 const q=data.questions[current];
 $('question-count').textContent='Question '+(current+1)+' of 12';
 $('category-name').textContent=data.categories[q.cat].name;
 $('question-text').textContent=q.text;
 $('progress').value=current+1;
 $('answers').replaceChildren();
 labels.forEach((label,i)=>{
  const b=document.createElement('button');
  b.type='button';b.className='answer';b.textContent=label;
  b.setAttribute('aria-pressed',answers[current]===i?'true':'false');
  b.onclick=()=>{answers[current]=i;showQuestion();};
  $('answers').appendChild(b);
 });
 $('previous').disabled=current===0;
 $('next').disabled=answers[current]===null;
 $('next').textContent=current===11?'Continue to My Result →':'Next →';
}
$('start').onclick=()=>{$('intro').hidden=true;$('quiz').hidden=false;showQuestion();$('question-text').focus();};
$('previous').onclick=()=>{if(current>0){current--;showQuestion();$('question-text').focus();}};
$('next').onclick=()=>{if(answers[current]===null)return;if(current<11){current++;showQuestion();$('question-text').focus();}else finishQuestions();};
function finishQuestions(){
 result=data.calculate(answers);
 $('quiz').hidden=true;
 $('lead-gate').hidden=false;
 $('lead-gate-heading').focus();
}
function renderResult(){
 if(!result)return;
 $('score').textContent=result.overall+'/100';
 $('score-title').textContent=data.label(result.overall);
 $('priority').textContent=result.overall===100?'Keep your routines consistent':result.gaps[0].name;
 $('priority-action').textContent=result.overall===100
   ?'Your answers describe consistent habits in every area. Check them against actual enquiry records and student feedback, and keep reviewing them with your team.'
   :result.gaps[0].action;
 const tied=result.gaps.filter(c=>c.score===result.gaps[0].score);
 $('tie-note').textContent=tied.length>1&&result.overall<100?'Several areas share your lowest score. The first is suggested as a starting point; review the others below.':'';
 $('category-results').replaceChildren();
 result.categories.forEach(c=>{
  const el=document.createElement('div');el.className='category-result';
  const name=document.createElement('strong');name.textContent=c.name;
  const value=document.createElement('span');value.textContent=c.score+'/100';
  const meter=document.createElement('progress');meter.max=100;meter.value=c.score;meter.setAttribute('aria-label',c.name+' score');
  el.append(name,value,meter);$('category-results').appendChild(el);
 });
 $('result-whatsapp').href='https://wa.me/917758859995?text='+encodeURIComponent('Hi Aanant, my Coaching Growth Score is '+result.overall+'/100. My priority gap is '+result.gaps[0].name+'. I would like to discuss my institute.');
 $('lead-gate').hidden=true;
 $('results').hidden=false;
 $('results-heading').focus();
}
$('report-form').addEventListener('submit',async event=>{
 event.preventDefault();
 if(!result||submitted||!$('report-form').reportValidity())return;
 const form=$('report-form'),button=$('send-report'),status=$('send-status');
 button.disabled=true;status.textContent='Submitting your details and sending the result…';
 const fields=Object.fromEntries(new FormData(form));
 const payload={...fields,answers:answers.slice(),consent:form.elements.consent.checked,consentVersion:'coaching-2026-10-25',campaign:window.ShikhaTracking?window.ShikhaTracking.attribution():{}};
 try{
  const response=await fetch('/api/coaching-assessment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  const body=await response.json();
  if(!response.ok||!body.ok)throw new Error(body.error||'Unable to send your report right now.');
  if(!body.leadAccepted)throw new Error('We could not confirm receipt of your details. Please try again or contact us on WhatsApp.');
  submitted=true;
  if(window.ShikhaTracking)window.ShikhaTracking.lead('coaching-growth-score');
  renderResult();
  const notice=document.createElement('p');
  notice.className='note';
  notice.setAttribute('role','status');
  notice.textContent=body.customerEmailSent
   ?'Your result has been submitted for email delivery, and Shikha Solutions has received your details.'
   :'Shikha Solutions received your details. Your score is shown below, but we could not confirm the email copy. Please save this page or contact us on WhatsApp.';
  $('results-heading').insertAdjacentElement('afterend',notice);
 }catch(error){
  status.textContent=(error&&error.message?error.message:'The submission could not be completed.')+' Your answers are saved on this page. Please retry or contact us on WhatsApp.';
  button.disabled=false;
 }
});
})();
