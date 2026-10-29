const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const nodes=new Map();
function node(id){if(!nodes.has(id))nodes.set(id,{id,hidden:false,value:'',checked:false,disabled:false,textContent:'',innerHTML:'',className:'',dataset:{},children:[],setAttribute(k,v){this[k]=v},append(...xs){this.children.push(...xs)},after(){},querySelector(){return node(id+'-head')},querySelectorAll(){return []},addEventListener(){},scrollIntoView(){},focus(){}});return nodes.get(id)}
const paneSelectors=['.inputs','.summary','.evidence','.workflow','.interpretation'];
const doc={getElementById:node,querySelector:s=>node(s),querySelectorAll:()=>[],createElement:()=>node('dynamic-'+nodes.size),createTextNode:text=>({textContent:text}),addEventListener(){}};
const context=vm.createContext({document:doc,console,setInterval:()=>1,clearInterval(){},setTimeout,AbortController,AbortSignal,TextDecoder,Response,structuredClone,matchMedia:()=>({matches:true}),fetch:async()=>{throw Error('Unexpected network request')},URL,Blob});
vm.runInContext("const $=id=>document.getElementById(id);let result;const esc=s=>String(s);function changesText(){return 'A → T'}function render(r){result=r}function setStage(){}function view(){}function download(){}",context);
vm.runInContext(fs.readFileSync('work/engine.js','utf8'),context);
vm.runInContext(fs.readFileSync('work/family.js','utf8'),context);
vm.runInContext(fs.readFileSync('work/live-v2.js','utf8').replace('clearAI();checkConnection();',''),context);
node('normal').value='CTGACTCCTGAGGAGAAG';node('mutant').value='CTGACTCCTGTGGAGAAG';node('frame').value='0';node('context').value='hbb';node('mode').value='live';node('gene').value='HBB';node('variant').value='c.20A>T';node('researchEnabled').checked=true;
vm.runInContext(fs.readFileSync('work/wizard-ui.js','utf8'),context);
vm.runInContext(fs.readFileSync('work/family-research-ui.js','utf8'),context);
const run=s=>vm.runInContext(s,context);
function only(stage){const visible=paneSelectors.filter(s=>!node('#lab '+s).hidden);assert.deepEqual(visible,stage===0?['.inputs']:stage===1?['.summary','.evidence']:stage===4?['.workflow']:stage===5?['.interpretation']:[]);assert.equal(node('family').hidden,stage!==2);assert.equal(node('research').hidden,stage!==3)}
(async()=>{
only(0);run('goStep(FLOW.research)');assert.equal(run('wizardStep'),0);
await run('flowAction()');only(1);assert.equal(run('result.classification'),'Missense');
await run('flowAction()');only(2);
run("$('loadFamily').onclick()");const members=run('familyState.people.length');assert.equal(members,5);assert.match(node('caseFamily').textContent,/5/);
await run('flowAction()');only(3);await run('flowAction()');only(4);
const input=run('payload()');assert.equal(input.gene,'HBB');assert.equal(input.variant,'c.20A>T');assert.equal(input.family.people.length,members);
run('beginWorking(true)');only(2);assert.equal(node('familyWorking').hidden,false);run('endWorking()');assert.equal(node('familyWorking').hidden,true);
run('beginWorking(false)');only(4);run('endWorking()');
run("showAI({id:'test',text:'Synthetic test answer',elapsed_seconds:1,provider:'Test fixture'})");only(5);assert.equal(run('maxReached'),5);
run('goStep(FLOW.family)');assert.equal(run('familyState.people.length'),members);run("$('inheritance').value='dominant';$('inheritance').onchange()");assert.equal(run('lastAI'),null);assert.equal(run('maxReached'),4);
run("goStep(FLOW.input);$('mode').value='compute';$('mode').onchange()");
await run('flowAction()');await run('flowAction()');await run('flowAction()');only(3);await run('flowAction()');only(5);assert.equal(node('flowStep4').disabled,true);assert.match(node('basis').textContent,/COMPUTED BIOLOGY NOTE/);assert.equal(run('lastAI'),null);
run("$('flowBack').onclick()");only(3);
run("invalidateSequence()");only(0);assert.equal(run('maxReached'),0);assert.equal(node('caseContext').hidden,true);
console.log('Passed unified-flow checks: isolated panes, optional family, shared payload, family generation, AI completion, edit invalidation, offline skip and back navigation.');
})().catch(e=>{console.error(e);process.exitCode=1});

