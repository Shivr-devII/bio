let wizardStep=0,maxReached=0,isWorking=false,workingTimer=null,workingStarted=0,sequenceReviewed=false,researchLoading=false;
const FLOW={input:0,evidence:1,family:2,research:3,agent:4,conclusion:5};
const wizardLabels=['Input DNA','Sequence evidence','Family study','Research evidence','Evidence review','Conclusion'];
const flowTitles=['Sequence input','Sequence evidence','Family study','Research evidence','Evidence review','Conclusion'];
const flowDescriptions=['Enter a reference and altered coding sequence.','Compare DNA, mRNA and protein before making an interpretation.','Add family facts to study inheritance. This step is optional.','Use database records and papers to support this investigation.','Review sequence results, entered family facts and research sources.','Review the explanation, inspect its citations and ask a follow-up question.'];
const inputPane=document.querySelector('#lab .inputs'),summaryPane=document.querySelector('#lab .summary'),evidencePane=document.querySelector('#lab .evidence'),agentPane=document.querySelector('#lab .workflow'),reportPane=document.querySelector('#lab .interpretation');
$('flowNavigation').innerHTML=wizardLabels.map((label,i)=>'<button class="flowStep" id="flowStep'+i+'" type="button"><span class="flowNumber">0'+(i+1)+'</span><span>'+label+'</span></button>').join('');
$('flowControls').append($('run'));
const reportFact=document.createElement('p');reportFact.id='reportFact';reportFact.className='reportFact';reportPane.querySelector('.panelhead').after(reportFact);
function updateFlow(){
 inputPane.hidden=wizardStep!==FLOW.input;summaryPane.hidden=wizardStep!==FLOW.evidence;evidencePane.hidden=wizardStep!==FLOW.evidence;agentPane.hidden=wizardStep!==FLOW.agent;reportPane.hidden=wizardStep!==FLOW.conclusion;
 $('family').hidden=wizardStep!==FLOW.family;$('research').hidden=wizardStep!==FLOW.research;
 $('flowTitle').textContent=flowTitles[wizardStep];$('flowSubtitle').textContent=wizardStep===FLOW.conclusion&&$('mode').value==='compute'&&!lastAI?'Review the biology calculation under its stated assumptions. No model was called.':flowDescriptions[wizardStep];$('flowEyebrow').textContent='INVESTIGATION / '+String(wizardStep+1).padStart(2,'0')+' OF 06';
 $('caseContext').hidden=!sequenceReviewed;
 if(sequenceReviewed&&result){$('caseSequence').textContent=result.classification+' · '+result.a.length+' → '+result.b.length+' bases';$('caseFamily').textContent=familyState.people.length? familyState.people.length+' entered members':'No family facts';$('caseResearch').textContent=$('researchEnabled').checked?($('gene').value.trim()||'No gene specified')+(researchSources.length?' · '+researchSources.length+' retrieved records':' · sources pending'):'Research omitted';}
 $('notebook').hidden=![FLOW.agent,FLOW.conclusion].includes(wizardStep)||($('mode').value==='compute'&&!isWorking&&!lastAI);
 for(const entry of notebookEntries)entry.card.hidden=entry.superseded||entry.familyTask||(entry.initial&&wizardStep===FLOW.conclusion);
 const skippedAI=$('mode').value==='compute'&&!lastAI&&!isWorking;
 for(let i=0;i<wizardLabels.length;i++){const button=$('flowStep'+i);button.className='flowStep'+(i===wizardStep?' current':i<maxReached&&!(i===FLOW.agent&&skippedAI)?' completed':'');button.disabled=i>maxReached||(i===FLOW.agent&&skippedAI);button.setAttribute('aria-current',i===wizardStep?'step':'false');}
 $('flowBack').hidden=wizardStep===0;$('flowBack').textContent='← Back';$('export').hidden=wizardStep!==FLOW.conclusion;
 $('run').disabled=isWorking||(wizardStep===FLOW.research&&researchLoading);
 const actions=['Analyze sequences','Continue to family study',familyState.people.length?'Continue to research':'Continue without a family',$('mode').value==='compute'?'View computed conclusion':'Continue to review',isWorking?'Working…':lastAI?'View conclusion':'Generate explanation','Return to inputs'];$('run').textContent=actions[wizardStep];
 const hints=['Calculate the mutation and translation first.','These results use biology rules; no model has been called.','Family facts are entered separately. DNA does not identify a family.',skippedAI?'Optional source browsing; computation-only mode does not call a model.':$('researchEnabled').checked?'Use this research topic in the review.':'Continue with the computed evidence and entered family facts.',isWorking?'The live request is running. Findings appear as the provider returns them.':'The review uses the case context above.','Revisit earlier steps to refine the evidence.'];$('flowHint').textContent=hints[wizardStep];
 $('agentContext').textContent='Sequence: '+(sequenceReviewed&&result?result.classification:'not analyzed')+' / Family: '+familyState.people.length+' members / Research: '+($('researchEnabled').checked?($('gene').value.trim()||'no gene specified'):'omitted');
 $('lab').setAttribute('aria-busy',String(isWorking));$('familyWorking').hidden=!(isWorking&&wizardStep===FLOW.family);
 if(result)reportFact.textContent=result.change.type+' / '+result.classification+' · '+changesText(result);
}
function goStep(n,scroll=true){if(n>maxReached)return;wizardStep=n;updateFlow();if(scroll)$('flowNavigation').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}
function beginWorking(familyTask=false){isWorking=true;const target=familyTask?FLOW.family:FLOW.agent;maxReached=Math.max(maxReached,target);wizardStep=target;$('workingPanel').hidden=false;agentPane.setAttribute('aria-busy','true');workingStarted=Date.now();$('workingElapsed').textContent='0:00 elapsed';$('workingPhase').textContent='Connecting to the live model…';clearInterval(workingTimer);workingTimer=setInterval(()=>{const elapsed=Math.floor((Date.now()-workingStarted)/1000);$('workingElapsed').textContent=Math.floor(elapsed/60)+':'+String(elapsed%60).padStart(2,'0')+' elapsed';},1000);updateFlow();$('flowNavigation').scrollIntoView({behavior:'smooth',block:'start'});}
function endWorking(){isWorking=false;clearInterval(workingTimer);workingTimer=null;$('workingPanel').hidden=true;agentPane.setAttribute('aria-busy','false');updateFlow();}
function invalidateInterpretation(){if(isWorking)return;for(const entry of notebookEntries)entry.superseded=true;clearAI();if(maxReached>=FLOW.agent)maxReached=FLOW.agent;if(wizardStep===FLOW.conclusion)wizardStep=$('mode').value==='compute'?FLOW.research:FLOW.agent;$('activity').textContent='Review the updated evidence, then generate a new explanation.';updateFlow();}
function invalidateSequence(){if(isWorking)return;sequenceReviewed=false;maxReached=0;wizardStep=0;clearAI();notebookEntries=[];questionQueue=[];currentSources=[];$('conversationLog').innerHTML='';$('aiTrace').innerHTML='';$('familyAnswer').textContent='';researchSources=[];$('researchResults').innerHTML='';$('researchStatus').textContent='Search the current case to collect source records.';updateFlow();}
async function flowAction(){
 if(isWorking)return;
 if(wizardStep===FLOW.input){try{const r=MutaSense.analyze($('normal').value,$('mutant').value,$('frame').value==='unknown'?null:Number($('frame').value),$('context').value);render(r);clearAI();sequenceReviewed=true;$('error').hidden=true;$('dirty').hidden=true;$('resultStatus').textContent='SEQUENCE COMPUTATION COMPLETE';maxReached=FLOW.evidence;goStep(FLOW.evidence);}catch(e){$('error').textContent=e.message;$('error').hidden=false;}return;}
 if(wizardStep===FLOW.conclusion){goStep(FLOW.input);return;}
 if(wizardStep===FLOW.agent){if(lastAI)goStep(FLOW.conclusion);else await runInvestigation();return;}
 if(wizardStep===FLOW.research&&$('mode').value==='compute'){await runInvestigation();return;}
 maxReached=Math.max(maxReached,wizardStep+1);goStep(wizardStep+1);
}
$('run').onclick=flowAction;$('flowBack').onclick=()=>goStep(wizardStep===FLOW.conclusion&&$('mode').value==='compute'&&!lastAI?FLOW.research:Math.max(0,wizardStep-1));for(let i=0;i<wizardLabels.length;i++)$('flowStep'+i).onclick=()=>goStep(i);
$('mode').onchange=()=>{invalidateInterpretation();if(wizardStep===FLOW.agent&&$('mode').value==='compute')goStep(FLOW.research);};
for(const id of ['normal','mutant','frame','context','example'])$(id).addEventListener('input',invalidateSequence);
$('additionalContext').addEventListener('input',invalidateInterpretation);
for(const id of ['gene','variant'])$(id).addEventListener('input',()=>{researchSources=[];$('researchResults').innerHTML='';$('researchStatus').textContent='Topic changed. Search again to retrieve matching source records.';invalidateInterpretation();});
$('researchEnabled').addEventListener('change',invalidateInterpretation);
$('answerQuestion').onclick=()=>{$('followupInput').focus();$('notebook').scrollIntoView({behavior:'smooth',block:'start'});};
updateFlow();


