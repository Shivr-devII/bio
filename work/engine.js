(function(root){
'use strict';
const letters='TCAG', code='FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG';
const table={};let k=0;for(const a of letters)for(const b of letters)for(const c of letters)table[a+b+c]=code[k++];
const names={F:'Phe',L:'Leu',S:'Ser',Y:'Tyr','*':'STOP',C:'Cys',W:'Trp',P:'Pro',H:'His',Q:'Gln',R:'Arg',I:'Ile',M:'Met',T:'Thr',N:'Asn',K:'Lys',V:'Val',A:'Ala',D:'Asp',E:'Glu',G:'Gly'};
const examples={
 sickle:{name:'Sickle-cell / HBB',normal:'CTGACTCCTGAGGAGAAG',mutant:'CTGACTCCTGTGGAGAAG',note:'Curated HBB coding fragment · c.10–27 · fragment codon 4 corresponds to mature β-globin residue 6.',context:'hbb'},
 silent:{name:'Silent substitution',normal:'ATGGAATTTCCGTAA',mutant:'ATGGAGTTTCCGTAA',note:'Synthetic teaching example · GAA → GAG · Glu stays Glu.'},
 missense:{name:'Missense substitution',normal:'ATGGAATTTCCGTAA',mutant:'ATGGTATTTCCGTAA',note:'Synthetic teaching example · GAA → GTA · Glu → Val.'},
 nonsense:{name:'Nonsense substitution',normal:'ATGCAATTTCCGTAA',mutant:'ATGTAATTTCCGTAA',note:'Synthetic teaching example · CAA → TAA · an earlier stop signal.'},
 insertion:{name:'Insertion / frameshift',normal:'ATGGAATTTCCGTAA',mutant:'ATGCGAATTTCCGTAA',note:'Synthetic teaching example · one C inserted after base 3.'},
 deletion:{name:'Deletion / frameshift',normal:'ATGGAATTTCCGTAA',mutant:'ATGAATTTCCGTAA',note:'Synthetic teaching example · one G deleted at base 4.'},
 inframe:{name:'In-frame insertion',normal:'ATGGAATTTCCGTAA',mutant:'ATGGCTGAATTTCCGTAA',note:'Synthetic teaching example · a GCT codon inserted after base 3.'},
 unchanged:{name:'No sequence change',normal:'ATGGAATTTCCGTAA',mutant:'ATGGAATTTCCGTAA',note:'Negative control · identical input sequences.'}
};
function clean(s,label){const t=s.replace(/\s/g,'').toUpperCase();if(!t)throw Error(label+' is empty. Enter 3–600 DNA bases.');if(/[^ACGT]/.test(t))throw Error(label+' contains an unsupported character. Use A, C, G and T only; spaces and line breaks are allowed.');if(t.length<3||t.length>600)throw Error(label+' must contain 3–600 bases.');return t;}
function translate(s,offset){let codons=[],active=true,protein='',stop=null;for(let p=offset;p+2<s.length;p+=3){const dna=s.slice(p,p+3),aa=table[dna];codons.push({dna,rna:dna.replace(/T/g,'U'),aa,name:names[aa],position:p+1,index:codons.length+1,active});if(active){if(aa==='*'){stop=codons.length;active=false;}else protein+=aa;}}return {rna:s.replace(/T/g,'U'),codons,protein,stop,tail:s.slice(offset+codons.length*3)};}
function detect(a,b){if(a===b)return {type:'No change',events:[],delta:0};if(a.length===b.length){let events=[];for(let i=0;i<a.length;i++)if(a[i]!==b[i])events.push({position:i+1,ref:a[i],alt:b[i]});return {type:'Substitution',events,delta:0,start:events[0].position-1};}let p=0;while(p<Math.min(a.length,b.length)&&a[p]===b[p])p++;let q=0;while(q<Math.min(a.length,b.length)-p&&a[a.length-1-q]===b[b.length-1-q])q++;const ref=a.slice(p,a.length-q),alt=b.slice(p,b.length-q);return {type:!ref?'Insertion':!alt?'Deletion':'Complex change',events:[{position:p+1,ref,alt}],delta:b.length-a.length,start:p,ref,alt,suffix:q};}
function analyze(normal,mutant,frame=0,context='unknown'){
 const a=clean(normal,'Normal DNA'),b=clean(mutant,'Mutated DNA');if(![0,1,2,null].includes(frame))throw Error('Choose a reading frame.');const change=detect(a,b),warnings=[];
 const known=frame!==null,n=known?translate(a,frame):null,m=known?translate(b,frame):null;let classification='Unresolved',details=[];
 if(!known){warnings.push('Reading frame is unknown. Translation and protein classification are withheld.');}
 else {
  if(n.tail||m.tail)warnings.push('Incomplete final codons are shown but not translated.');
  if(!n.stop||!m.stop)warnings.push('No stop codon in at least one sequence: displayed proteins are fragment translations.');
  if(frame>0)warnings.push('Bases before the selected first codon are excluded from translation.');
  if(change.type==='No change')classification='No change';
  else if(change.type==='Complex change'){classification='Complex / unresolved';warnings.push('This pair cannot be represented as one pure insertion or deletion. A full sequence alignment is needed.');}
  else if(change.type==='Substitution'){
   let effects=[];for(let i=0;i<Math.min(n.codons.length,m.codons.length);i++){
    const x=n.codons[i],y=m.codons[i];if(x.dna===y.dna)continue;
    let effect=(!x.active||!y.active)?'Beyond first stop':x.aa===y.aa?'Silent':y.aa==='*'?'Nonsense':x.aa==='*'?'Stop-loss':'Missense';
    details.push({index:i+1,before:x,after:y,effect});if(effect!=='Beyond first stop')effects.push(effect);
   }
   const outside=change.events.some(e=>e.position<=frame||e.position>frame+Math.min(n.codons.length,m.codons.length)*3);
   if(effects.includes('Nonsense'))classification='Nonsense';else if(effects.includes('Stop-loss'))classification='Stop-loss';else if(effects.includes('Missense'))classification='Missense';else if(effects.includes('Silent'))classification='Silent';else classification='Outside translated region';
   if(outside){warnings.push('A changed base lies outside complete codons. Its protein consequence is unresolved.');classification=effects.length?classification+' + unresolved':'Unresolved';}
   if(effects.length>1&&new Set(effects).size>1)warnings.push('Multiple codon effects occur; the headline reports the leading consequence. Inspect each changed codon.');
  }else{
   const start=change.start;
   if(start<frame){classification='Unresolved';warnings.push('The edit overlaps the excluded reading-frame prefix. Confirm the homologous coding start.');}
   else if(n.stop&&start>=frame+n.stop*3)classification='Outside translated region';
   else classification=change.delta%3===0?'In-frame '+change.type.toLowerCase():'Frameshift';
   warnings.push('Indels use a single contiguous-edit model. Repeated bases can make the displayed position non-unique.');
  }
 }
 const isHbb=context==='hbb'&&frame===0&&a===examples.sickle.normal&&b===examples.sickle.mutant;
 let impact='',next='',basis='General biology rule';
 if(isHbb){basis='Curated HBB case';impact='The coding codon GAG becomes GTG; mRNA GAG becomes GUG; glutamate (Glu) becomes valine (Val). In this known HBB variant, deoxygenated HbS can polymerize, contributing to red-cell sickling. The fragment alone does not establish a person’s genotype or diagnosis.';next='Connect the molecular change to hemoglobin behavior, then explain why inheritance and the second HBB allele matter.';}
 else if(classification.startsWith('Silent')){impact='The affected complete codon(s) encode the same amino acid(s). This is a synonymous change in this translation model. It does not prove the variant is harmless: effects on splicing or gene expression are outside this prototype.';next='Identify the gene and transcript, then investigate splicing or expression evidence before discussing a phenotype.';}
 else if(classification.startsWith('Missense')){impact='At least one translated amino acid changes. This may alter protein behavior, but a codon change alone cannot establish a change in structure, function or health.';next='Provide the gene, transcript and variant coordinates; look for curated evidence and functional studies.';}
 else if(classification.startsWith('Nonsense')){impact='A sense codon becomes a stop codon before the original stop in this fragment. Translation ends earlier in this model. Whether the cell produces a shortened protein or degrades the RNA depends on transcript context.';next='Check the full transcript and the stop’s location before discussing protein loss or RNA decay.';}
 else if(classification==='Frameshift'){impact='The coding insertion or deletion changes the reading frame because its length is not a multiple of three. Downstream codons are regrouped; a new stop may occur. The full protein effect cannot be recovered from a short fragment.';next='Obtain more downstream coding sequence and confirm the transcript and edit alignment.';}
 else if(classification.startsWith('In-frame')){impact='The edit changes the coding length by a multiple of three, preserving the downstream reading frame. Amino acids may be added, removed or changed near the edit. Preserving the frame does not imply normal protein function.';next='Locate the edit in the protein and check evidence about the affected region.';}
 else if(classification==='Stop-loss'){impact='An original stop codon becomes a sense codon. Translation may continue until another stop is reached. The extension is uncertain without more sequence.';next='Inspect the downstream transcript sequence and check for the next in-frame stop.';}
 else if(classification==='No change'){impact='The supplied DNA sequences are identical. This comparison provides no evidence of a sequence change. It says nothing about differences outside the supplied fragment.';next='Use a different example or confirm that you entered the intended variant sequence.';}
 else {impact='A reliable protein consequence cannot be assigned for this comparison under the selected assumptions. The DNA observation is kept separate from the unresolved interpretation.';next=!known?'Confirm where the first complete codon starts, then rerun the investigation.':'Confirm the reading frame, full coding sequence and alignment before assigning a protein effect.';}
 if(context==='hbb'&&!isHbb)warnings.push('The input does not exactly match the curated HBB example in frame 1. No sickle-cell-specific interpretation has been applied.');
 return {a,b,frame,change,n,m,classification,details,warnings,isHbb,basis,impact,next};
}
root.MutaSense={analyze,translate,detect,table,names,examples};
if(typeof module!=='undefined')module.exports=root.MutaSense;
})(typeof window==='undefined'?globalThis:window);
