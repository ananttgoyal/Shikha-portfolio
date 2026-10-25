(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.ShikhaAdmissionsCalculator=factory();
})(typeof window!=='undefined'?window:this,function(){
 'use strict';
 function finite(x){return typeof x==='number'&&Number.isFinite(x)}
 function compute(input){
  const p={days:Number(input.days),leads:Number(input.leads),admissions:Number(input.admissions),
   qualifiedDay:input.qualifiedDay===''||input.qualifiedDay==null?null:Number(input.qualifiedDay),
   target:Number(input.target),cpl:Number(input.cpl),fee:Number(input.fee),
   variable:Number(input.variable),fixed:Number(input.fixed)};
  for(const k of ['days','leads','admissions','target','cpl','fee','variable','fixed']){
   if(!finite(p[k])||p[k]<0)throw Error('Please enter valid non-negative numbers.');
  }
  if(!Number.isInteger(p.days)||p.days<1||p.days>365)throw Error('Days must be between 1 and 365.');
  if(!Number.isInteger(p.leads)||!Number.isInteger(p.admissions)||!Number.isInteger(p.target))throw Error('Enquiries, admissions and target must be whole numbers.');
  if(p.admissions>p.leads)throw Error('Admissions cannot exceed recorded enquiries for this planning model.');
  if(p.qualifiedDay!==null&&(!finite(p.qualifiedDay)||p.qualifiedDay<0))throw Error('Interested enquiries per day must be zero or higher.');
  const warnings=[];
  if(p.leads===0)warnings.push('No historical enquiries entered. A reliable lead-conversion projection is not possible yet.');
  if(p.leads>0&&p.admissions===0)warnings.push('No recorded admissions yet. We cannot project target leads or a reliable marketing cost per admission without a positive conversion baseline.');
  if(p.fee<=p.variable&&p.fee>0)warnings.push('Fee per admission is not higher than the direct delivery cost. Break-even may not be achievable.');
  const rate=p.leads>0?p.admissions/p.leads:null;
  const projectedLeads=rate>0?Math.ceil(p.target/rate):null;
  const projectedLeadDay=projectedLeads!==null?Math.ceil(projectedLeads/p.days):null;
  const expectedSpend=projectedLeads!==null?projectedLeads*p.cpl:null;
  const leadCostPerAdmission=rate>0?p.cpl/rate:null;
  const historicalSpend=p.leads*p.cpl;
  const interestedCount=p.qualifiedDay===null?null:p.qualifiedDay*p.days;
  let interestedRate=null,interestedNeeded=null,interestedNeededPerDay=null;
  if(interestedCount!==null){
   if(interestedCount>p.leads+0.00001){warnings.push('Interested leads per day exceed total enquiries over this period. Please check that both figures refer to the same days.');}
   else if(interestedCount<p.admissions-0.00001){warnings.push('Interested leads counted are fewer than admissions. The interested-lead conversion estimate cannot be used.');}
   else if(interestedCount>0&&p.admissions>0){
     interestedRate=p.admissions/interestedCount;
     interestedNeeded=Math.ceil(p.target/interestedRate);
     interestedNeededPerDay=Math.ceil(interestedNeeded/p.days);
   }
  }
  const margin=leadCostPerAdmission===null?null:p.fee-p.variable-leadCostPerAdmission;
  let breakEven=null;
  if(margin!==null&&margin>0){breakEven=Math.ceil(p.fixed/margin);}
  else if(margin!==null){warnings.push('Each admission does not cover estimated direct costs plus acquisition spend at this conversion. No finite break-even admissions count is available.');}
  const actualCostPerAdmission=p.admissions>0?historicalSpend/p.admissions:null;
  const blendedCostPerAdmission=p.admissions>0?p.variable+(p.fixed+historicalSpend)/p.admissions:null;
  const revenueAtTarget=p.target*p.fee;
  const estimatedContribution=expectedSpend===null?null:revenueAtTarget-p.target*p.variable-expectedSpend-p.fixed;
  return {input:p,warnings,rate,interestedRate,projectedLeads,projectedLeadDay,
   expectedSpend,leadCostPerAdmission,actualCostPerAdmission,
   blendedCostPerAdmission,interestedCount,interestedNeeded,interestedNeededPerDay,
   margin,breakEven,revenueAtTarget,estimatedContribution};
 }
 return {compute};
});
