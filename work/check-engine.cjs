const assert=require('node:assert/strict');
const M=require('./engine.js');let checks=0;
function check(a,b,expected,frame=0,ctx='unknown'){const r=M.analyze(a,b,frame,ctx);assert.equal(r.classification,expected);checks++;return r;}
for(const [key,label]of Object.entries({sickle:'Missense',silent:'Silent',missense:'Missense',nonsense:'Nonsense',insertion:'Frameshift',deletion:'Frameshift',inframe:'In-frame insertion',unchanged:'No change'})){const e=M.examples[key];const r=check(e.normal,e.mutant,label,0,e.context);if(key==='sickle'){assert.equal(r.change.events[0].position,11);assert.equal(r.n.protein,'LTPEEK');assert.equal(r.m.protein,'LTPVEK');assert.equal(r.isHbb,true);}}
assert.equal(Object.keys(M.table).length,64);assert.equal(M.table.GAG,'E');assert.equal(M.table.GTG,'V');assert.equal(M.table.TAA,'*');checks++;
const r=check('ATGCAATTTCCGTAA','ATGTAATTTCCGTAA','Nonsense');assert.equal(r.m.protein,'M');assert.equal(r.m.stop,2);assert.equal(r.m.codons[2].active,false);
check('ATGGAATTT','ATGGAATTT','No change');check('ATGGAATTT','ATGGAATTC','Silent');
check('ATGGAATTT','ATGGTATTT','Unresolved',null);
check('ATGTAA','ATGCAA','Stop-loss');check('ATGTAAGAA','ATGTAAGTA','Outside translated region');
check('AATGGAA','AATGGAG','Silent',1);check('AAATGGAA','AAATGGAG','Silent',2);
check('ATGGAATTTC','ATGGAATTTG','Unresolved');
check('ATGGAATTTCCGTAA','ATGTTTCCGTAA','In-frame deletion');
check('ATGGAATTTCCGTAA','ATGCCTTCCGTAA','Complex / unresolved');
assert.throws(()=>M.analyze('ATGN','ATGT'),/unsupported/);assert.throws(()=>M.analyze('','ATG'),/empty/);assert.throws(()=>M.analyze('A'.repeat(601),'ATG'),/600/);checks++;
assert.equal(M.analyze(' ctg act cct gag gag aag ','ctgactcctgtggagaag',0,'hbb').isHbb,true);assert.equal(M.analyze(M.examples.missense.normal,M.examples.missense.mutant,0,'hbb').isHbb,false);checks++;
console.log(`${checks} biology and validation checks passed.`);
