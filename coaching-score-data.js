(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CoachingScore=factory();})(typeof self!=='undefined'?self:this,function(){
 'use strict';
 const categories=[
 {name:'Enquiry handling',action:'Review your last 10 enquiries. Give each one an owner, a response deadline and a recorded next action.'},
 {name:'Counselling & course fit',action:'Review three counselling conversations. Record the learner’s goal, course fit and agreed next step before discussing a discount.'},
 {name:'Follow-up & conversion',action:'List every open enquiry with its next action and date. Review overdue follow-ups with the counsellor each morning.'},
 {name:'Parent & learner confidence',action:'Ask five undecided learners or parents what remains unclear. Prepare clear evidence and answers for their most common concern.'},
 {name:'Learning & student support',action:'Ask five current students where they struggle. Assign one improvement in teaching, practice or doubt resolution and review it next week.'},
 {name:'Team ownership & review',action:'Create a weekly admissions review covering enquiries, demos or visits, admissions and reasons for loss. Assign one owner to every action.'}
 ];
 const questions=[
 {cat:0,text:'Every new enquiry receives a first response within a response time agreed by our team.'},
 {cat:0,text:'Every enquiry is recorded in one tracker with its source, course interest and responsible counsellor.'},
 {cat:1,text:'Before recommending a course, counsellors understand the learner’s goal, starting level and constraints.'},
 {cat:1,text:'Counsellors explain course fit, learning support and total cost clearly, rather than relying on discounts.'},
 {cat:2,text:'Every open enquiry has a useful next action and follow-up date, and overdue actions are reviewed.'},
 {cat:2,text:'We track enquiry-to-admission conversion and record why learners decide not to join.'},
 {cat:3,text:'Our team identifies who is involved in the decision and answers their concerns, with the learner’s permission.'},
 {cat:3,text:'We explain genuine results, faculty and facilities clearly, including hostel or transport arrangements when offered.'},
 {cat:4,text:'Demos and student feedback help us check whether learners understand the teaching and can follow the course.'},
 {cat:4,text:'Students have a clear way to get doubts resolved, and learning progress is reviewed regularly.'},
 {cat:5,text:'Counsellors handle routine admissions decisions within clear boundaries, without waiting for the founder each time.'},
 {cat:5,text:'We review admissions activity and outcomes weekly, with named owners for the actions we agree.'}
 ];
 function calculate(answers){
  if(!Array.isArray(answers)||answers.length!==questions.length||answers.some(a=>!Number.isInteger(a)||a<0||a>3))throw new Error('Answer all 12 questions.');
  const scores=categories.map((c,i)=>({...c,score:Math.round(questions.reduce((sum,q,j)=>sum+(q.cat===i?answers[j]:0),0)/6*100)}));
  const gaps=scores.slice().sort((a,b)=>a.score-b.score);
  return {overall:Math.round(answers.reduce((a,b)=>a+b,0)/36*100),categories:scores,gaps};
 }
 function label(score){return score>=80?'Consistent habits to build on':score>=50?'Some admissions gaps to strengthen':'Admissions foundations need attention';}
 return {categories,questions,calculate,label};
});
