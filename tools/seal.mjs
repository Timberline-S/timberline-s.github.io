// Seal a salesman's schedule so only someone with his code can read it.
// Usage: node tools/seal.mjs <code> <plain.json>   -> writes sched/<id>.json and prints the path
import {webcrypto as C} from 'node:crypto';import fs from 'node:fs';import path from 'node:path';
const [code,inp]=process.argv.slice(2);if(!code||!inp){console.error('usage: node tools/seal.mjs <code> <plain.json>');process.exit(1)}
const te=new TextEncoder(),b64=u=>Buffer.from(u).toString('base64');
const plain=fs.readFileSync(inp,'utf8');JSON.parse(plain);
const h=new Uint8Array(await C.subtle.digest('SHA-256',te.encode('tl-field:'+code)));const id=[...h].slice(0,10).map(b=>b.toString(16).padStart(2,'0')).join('');
const salt=C.getRandomValues(new Uint8Array(16)),iv=C.getRandomValues(new Uint8Array(12)),it=150000;
const base=await C.subtle.importKey('raw',te.encode(code),'PBKDF2',false,['deriveKey']);
const key=await C.subtle.deriveKey({name:'PBKDF2',salt,iterations:it,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt']);
const ct=new Uint8Array(await C.subtle.encrypt({name:'AES-GCM',iv},key,te.encode(plain)));
const dir=path.join(path.dirname(new URL(import.meta.url).pathname),'..','sched');fs.mkdirSync(dir,{recursive:true});
const out=path.join(dir,id+'.json');fs.writeFileSync(out,JSON.stringify({v:2,it,salt:b64(salt),iv:b64(iv),ct:b64(ct)}));console.log(path.relative(process.cwd(),out));
