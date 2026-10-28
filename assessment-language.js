/* Four-choice bilingual assessment UI; category keys stay unchanged for reports. */
(function(){
'use strict';
const questionEn=[
'Can your team make routine decisions without your approval?',
'Does daily work run smoothly when you are away for a day or two?',
'Do people bring you problems that someone else should handle?',
'Does each team member know their responsibilities and expected results?',
'Do you have to keep reminding your team to finish important work?',
'Does your team follow a clear process for recurring work?',
'Do the same operational mistakes keep happening?',
'Does your team follow up with every enquiry in a consistent way?',
'Can you see where enquiries come from and how many become customers?',
'Do sales depend heavily on you or one person?',
'Do you regularly review the key numbers that show business performance?',
'Can you easily see sales, expenses, cash flow and profit?',
'When a problem repeats, do you assign an owner and check whether the fix works?',
'Does every improvement task have one clear owner?',
'Do you check whether changes actually improved the business?'
];
const questionHi=[
'Kya team roz ke decisions aapki approval ke bina le leti hai?',
'Aap ek-do din available na hon, toh kya roz ka kaam smoothly chalta hai?',
'Kya log aise problems bhi aapke paas laate hain jo team khud solve kar sakti hai?',
'Kya har team member ko apni zimmedari aur expected result clear hai?',
'Kya important kaam poora karwane ke liye aapko baar-baar yaad dilana padta hai?',
'Kya baar-baar hone wale kaam ke liye team ek clear process follow karti hai?',
'Kya operations mein wahi galtiyan baar-baar hoti hain?',
'Kya har enquiry ka ek fixed process se follow-up hota hai?',
'Kya aapko pata hai enquiries kahan se aati hain aur kitni sales mein badalti hain?',
'Kya sales aap par ya kisi ek person par bahut depend karti hai?',
'Kya aap business ki performance samajhne ke liye zaroori numbers regularly dekhte hain?',
'Kya sales, kharcha, cash flow aur profit ki clear picture aasani se milti hai?',
'Problem repeat ho, toh kya kisi ko zimmedari dekar check karte hain ki solution kaam kar raha hai?',
'Kya har improvement task ko poora karne ki zimmedari ek person ki hoti hai?',
'Kya aap check karte hain ki changes se business mein sach mein sudhaar hua?'
];
const pairs=[
['Back to website','Website par wapas'],
['1 · Sawaal','1 · Sawaal'],['2 · Details','2 · Details'],['3 · Score & next step','3 · Score aur agla step'],
['Free · 3-minute Growth Score','Free · 3-minute Growth Score'],
['Business badhana hai? Growth kahan ruk rahi hai?','Business badhana hai? Growth kahan ruk rahi hai?'],
['Sales, team, follow-ups ya systems—pehle kis jagah dhyaan dena chahiye? 15 simple sawaalon ke jawab dein. Apna Growth Score aur sabse zaroori improvement areas dekhein.','Sales, team, follow-ups ya systems—pehle kis jagah dhyaan dena chahiye? 15 simple sawaalon ke jawab dein. Apna Growth Score aur sabse zaroori improvement areas dekhein.'],
['15 simple sawaal','15 simple sawaal'],['Lagbhag 3 minute','Lagbhag 3 minute'],['6 business areas ka score','6 business areas ka score'],
['Apna Growth Score check karein →','Apna Growth Score check karein →'],
['Free hai. Sawaalon ke baad contact details bharne par score screen par dikhega aur email copy bheji jayegi. Yeh shuruaati diagnostic hai, poora business audit nahi.','Free hai. Sawaalon ke baad contact details bharne par score screen par dikhega aur email copy bheji jayegi. Yeh shuruaati diagnostic hai, poora business audit nahi.'],
['Founder Dependency','Aap par nirbharta'],['People & Accountability','Team aur zimmedari'],['Process & Operations','Process aur roz ka kaam'],['Sales & Customer Growth','Sales aur customer growth'],['Numbers & Business Visibility','Numbers ki clarity'],['Execution & Improvement','Kaam aur sudhaar'],
['Always','Hamesha'],['Often','Aksar'],['Sometimes','Kabhi-kabhi'],['Never','Kabhi nahi'],
['← Back','← Pichhla'],['Next →','Agla →'],['Prepare My Result →','Mera score taiyaar karein →'],
['15 sawaal poore','15 sawaal poore'],['Apna Growth Score dekhein','Apna Growth Score dekhein'],
['Naam, email aur WhatsApp number bharne par score screen par dikhega. Email par ek copy bhi bhejenge; email delivery mein dikkat ho tab bhi screen par result milega.','Naam, email aur WhatsApp number bharne par score screen par dikhega. Email par ek copy bhi bhejenge; email delivery mein dikkat ho tab bhi screen par result milega.'],
['Your name','Aapka naam'],['Email address','Email address'],['Phone / WhatsApp number','Phone / WhatsApp number'],['Company name','Business ka naam'],['(optional)','(optional)'],['Business stage','Aapki team ka size'],['Select one','Ek option chunein'],['Founder with a team of 1–9','Founder aur 1–9 ki team'],['Growing team of 10–25','10–25 ki team'],['Established team of 26–50','26–50 ki team'],['Team of 51+','51 ya zyada ki team'],['Exploring or not sure','Abhi shuruaat hai / sure nahi'],
['Mera Growth Score dekhein →','Mera Growth Score dekhein →'],
['Your Business Health','Aapka Business Growth Score'],['OUT OF 100','100 MEIN SE'],
['Your six business health scores','6 areas mein aapka score'],['Your top 3 business gaps','Pehle in 3 areas par dhyaan dein'],['Important alerts from your answers','Aapke answers se zaroori signals'],
['Strong','Mazboot'],['Needs Optimization','Sudhaar ki jagah hai'],['Growth Constraint','Growth mein rukawat'],['Priority Risk','Pehle dhyaan dena zaroori'],
['Strong Business Foundation','Business ki neev mazboot hai'],['Growth Friction','Growth mein kuch rukawatein hain'],['Founder-Dependent Business','Business aap par zyada depend karta hai'],['Business Foundation Needs Attention','Business ki neev par dhyaan dein'],
['Your business shows a relatively strong foundation. The opportunity is to strengthen weak spots and prepare systems for the next stage of growth.','Business ki neev achhi lag rahi hai. Ab kamzor areas ko behtar karke agle stage ki taiyaari karein.'],
['Your business is functioning, but some gaps may be creating unnecessary delays, founder involvement, or lost opportunities.','Business chal raha hai, lekin kuch gaps se delays, aap par extra kaam ya opportunities miss ho sakti hain.'],
['Several parts of the business may still depend too heavily on the founder, individual employees, or informal ways of working.','Kai kaam abhi aap par, kisi ek employee par ya bina clear process ke chal rahe ho sakte hain.'],
['Important systems, accountability, visibility, or execution mechanisms appear inconsistent and should be prioritised before adding more complexity.','Naye kaam badhane se pehle systems, zimmedari aur numbers ki clarity ko mazboot karein.'],
['How much everyday decision-making and problem-solving still depends on the founder.','Roz ke decisions aur problem-solving kitna aap par depend karte hain.'],
['How clearly ownership, expectations and follow-through are defined across the team.','Team ko zimmedari, expected results aur kaam poora karne ka tareeka kitna clear hai.'],
['How consistently recurring work is executed without repeated errors or searching for information.','Roz ka kaam kitna consistent hai, bina baar-baar galti ya information dhoondhne ke.'],
['How systematic and visible your lead-to-customer process is, and whether sales depend on one person.','Enquiry se sale tak ka process kitna clear hai aur sales ek person par kitna depend karti hai.'],
['How easily you can see the numbers needed to make timely business decisions.','Sahi waqt par decisions lene ke liye zaroori numbers kitni aasani se milte hain.'],
['How consistently the business turns identified problems into owned, measured improvements.','Problem milne ke baad zimmedari dekar sudhaar karna aur result check karna kitna regular hai.'],
['Choose the next step that fits the problem.','Apni zaroorat ke hisaab se agla step chunein.'],
['Your score helps identify symptoms. The next step depends on whether you need clarity, one focused intervention, or ongoing execution support.','Score ek shuruaat hai. Ab dekhein: clarity chahiye, ek problem par focused kaam, ya regular execution support.'],
['Message on WhatsApp →','WhatsApp par baat karein →'],['Book a Growth Discovery Call →','Free Growth Call book karein →'],
['Growth Discovery Call →','Growth Discovery Call →'],['Discuss the constraint and decide what deserves attention first.','Baat karke tay karein ki pehle kis area par kaam karna hai.'],
['Best when one measurable issue needs focused execution.','Ek clear problem par focused execution ke liye.'],
['For connected execution gaps that need ongoing support.','Judi hui problems par regular execution support ke liye.']
];
/* English alternatives for the Hinglish opening. */
const english={
'1 · Sawaal':'1 · Questions','3 · Score & next step':'3 · Score & next step',
'Business badhana hai? Growth kahan ruk rahi hai?':'Want to grow your business? What is holding growth back?',
'Sales, team, follow-ups ya systems—pehle kis jagah dhyaan dena chahiye? 15 simple sawaalon ke jawab dein. Apna Growth Score aur sabse zaroori improvement areas dekhein.':'Sales, team, follow-ups or systems—what needs your attention first? Answer 15 simple questions to see your Growth Score and priority areas for improvement.',
'15 simple sawaal':'15 simple questions','Lagbhag 3 minute':'About 3 minutes','6 business areas ka score':'Scores across 6 business areas',
'Apna Growth Score check karein →':'Check my Growth Score →',
'Free hai. Sawaalon ke baad contact details bharne par score screen par dikhega aur email copy bheji jayegi. Yeh shuruaati diagnostic hai, poora business audit nahi.':'Free to use. After the questions, enter your contact details to see your score on screen and receive an email copy. This is an initial diagnostic, not a full business audit.',
'15 sawaal poore':'15 questions complete','Apna Growth Score dekhein':'See your Growth Score',
'Naam, email aur WhatsApp number bharne par score screen par dikhega. Email par ek copy bhi bhejenge; email delivery mein dikkat ho tab bhi screen par result milega.':'Enter your name, email and WhatsApp number to see your score. We will also send an email copy; your on-screen result will still appear if email delivery fails.',
'Mera Growth Score dekhein →':'Show my Growth Score →'
};
pairs.push(
['Founder Bottleneck Alert','Aap par zyada nirbharta'],
['Accountability Alert','Zimmedari clear karni hai'],
['Recurring Process Failure Alert','Process ki problem repeat ho rahi hai'],
['Sales Dependency Alert','Sales ek person par depend karti hai'],
['Too many day-to-day decisions or escalations may still be routing through you.','Roz ke bahut saare decisions aur problems abhi bhi aapke paas aa rahe ho sakte hain.'],
['Important work may require repeated reminders or follow-ups because ownership or review rhythm is unclear.','Zimmedari ya review ka tareeka clear na hone se kaam ke liye baar-baar reminders dene pad sakte hain.'],
['The same operational problems may be repeating because a process, ownership, training, or feedback-loop gap remains unresolved.','Process, zimmedari, training ya feedback mein gap ki wajah se wahi problems repeat ho sakti hain.'],
['Sales performance may depend too heavily on one person, making growth less predictable and harder to scale.','Ek person par sales depend hone se regular growth aur scale karna mushkil ho sakta hai.'],
['I agree to receive my personalised assessment result by email and one relevant follow-up by email or WhatsApp from Shikha Solutions. I can withdraw consent by emailing anant@shikhasolutions.com or replying STOP on WhatsApp.','Main apna result email par aur Shikha Solutions se ek relevant follow-up email ya WhatsApp par paane ke liye sahmat hoon. Consent hatane ke liye anant@shikhasolutions.com par email ya WhatsApp par STOP bhej sakta/sakti hoon.'],
['Your answers are used only to calculate and deliver this diagnostic.','Aapke answers is diagnostic ka score nikalne aur result dene ke liye use hote hain.'],
['Preparing your result…','Aapka result taiyaar ho raha hai…'],
['Your on-screen result is ready. We are sending your email copy now…','Aapka result neeche hai. Email copy bheji ja rahi hai…'],
['Your personalised result has been emailed. Your on-screen result is shown below.','Aapka result email kar diya gaya hai. Score neeche screen par bhi hai.'],
['Your on-screen result is ready. The email copy could not be delivered right now, so please save this page or use the next-step links below.','Aapka score neeche hai. Abhi email copy nahi pahunch saki; apne result ka screenshot lein ya neeche agla step chunein.']
);
let lang='hi';
const translations=new Map();
pairs.forEach(([en,hi])=>{const p={en:english[en]||en,hi};[en,hi,p.en].forEach(key=>translations.set(key,p));});
function translated(text){const key=text.trim();const p=translations.get(key);if(p)return text.replace(key,p[lang]);const question=key.match(/^Question (\d+) of (\d+)$/)||key.match(/^Sawaal (\d+) \/ (\d+)$/);if(question)return lang==='hi'?'Sawaal '+question[1]+' / '+question[2]:'Question '+question[1]+' of '+question[2];const gap=key.match(/^(#\d+)\s+(.+)$/);if(gap&&translations.has(gap[2]))return gap[1]+' '+translations.get(gap[2])[lang];if(key==='← Back to website'||key==='← Website par wapas')return lang==='hi'?'← Website par wapas':'← Back to website';return text;}
window.assessmentTranslate=translated;
function localise(){const root=document.querySelector('.wrap');const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(n){return n.parentElement.closest('script,style,.language-switch')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT}});let n;while((n=walker.nextNode()))n.nodeValue=translated(n.nodeValue);document.documentElement.lang=lang==='hi'?'hi-Latn':'en';document.querySelectorAll('[data-assessment-language]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.assessmentLanguage===lang)));}
document.addEventListener('DOMContentLoaded',()=>{
const originalShow=showQuestion,originalResults=renderResults;
showQuestion=function(i){originalShow(i);localise();};
renderResults=function(overall,cats){originalResults(overall,cats);localise();};
function setLanguage(value){lang=value;questions.forEach((q,i)=>q.text=(lang==='hi'?questionHi:questionEn)[i]);answersLabels.splice(0,answersLabels.length,...(lang==='hi'?['Hamesha','Aksar','Kabhi-kabhi','Kabhi nahi']:['Always','Often','Sometimes','Never']));if(document.getElementById('assessment').style.display!=='none'){renderQuestions();Object.entries(responses).forEach(([i,answer])=>{const option=document.querySelectorAll('#q'+i+' .option')[answer];if(option)option.classList.add('selected');});showQuestion(current);}localise();}
document.querySelectorAll('[data-assessment-language]').forEach(b=>b.addEventListener('click',()=>setLanguage(b.dataset.assessmentLanguage)));
setLanguage('hi');
});
})();