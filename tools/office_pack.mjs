// Build the owner view snapshot from a Job Office export folder.
// Usage: node tools/office_pack.mjs <export dir> <out.json>
// The export folder holds <collection path>/<doc id>.json files (ArtifactData out_dir layout).
import fs from 'node:fs';import path from 'node:path';
const [dir,out]=process.argv.slice(2);if(!dir||!out){console.error('usage: node tools/office_pack.mjs <export dir> <out.json>');process.exit(1)}
const readCol=c=>{const d=path.join(dir,c);if(!fs.existsSync(d))return [];return fs.readdirSync(d).filter(f=>f.endsWith('.json')).map(f=>{try{return {id:f.slice(0,-5),...JSON.parse(fs.readFileSync(path.join(d,f),'utf8'))}}catch(e){return null}}).filter(Boolean)};
const trim=o=>{const r={};for(const[k,v]of Object.entries(o)){if(['files','signature','sig','sigData','photos'].includes(k))continue;if(typeof v==='string'&&v.length>1500)continue;if(k==='events'&&Array.isArray(v)){r.events=v.slice(-8).map(e=>({at:e.at,t:String(e.t||'').slice(0,160)}));continue}if(k==='intake'&&v&&typeof v==='object'){const I={};for(const[a,b]of Object.entries(v))if(typeof b!=='string'||b.length<400)I[a]=b;r.intake=I;continue}r[k]=v}return r};
const cfg=(readCol('config').find(x=>x.id==='sales'))||{};const team={};for(const[id,t]of Object.entries(cfg.team||{}))team[id]=t&&(t.name||t.email)||'Salesman';
const leads=[];
const salesDir=path.join(dir,'sales');
if(fs.existsSync(salesDir))for(const rep of fs.readdirSync(salesDir)){if(!fs.statSync(path.join(salesDir,rep)).isDirectory())continue;const ld=path.join('sales',rep,'leads');for(const l of readCol(ld))leads.push({...trim(l),_rep:rep});if(!team[rep])team[rep]='Salesman'}
for(const l of readCol('fin/money/leads'))leads.push({...trim(l),_rep:''});
const settings=Object.fromEntries(readCol('fin/money/settings').map(s=>[s.id,s]));
const pb=settings.pricebook||{},co=settings.company||{};
const snap={v:1,gen:Date.now(),company:co.name||'Timberline Builders',targetPct:Number(pb.targetPct)||30,floorPct:Number(pb.floorPct)||19,team,
 leads,jobs:readCol('jobs').map(trim),invoices:readCol('fin/money/invoices').map(trim),payments:readCol('fin/money/payments').map(trim),costs:readCol('fin/money/costs').map(trim),cos:readCol('fin/money/changeorders').map(trim)};
fs.writeFileSync(out,JSON.stringify(snap));console.log(`packed ${leads.length} leads, ${snap.jobs.length} jobs, ${snap.invoices.length} invoices -> ${out}`);
