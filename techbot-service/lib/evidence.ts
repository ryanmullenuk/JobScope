import { extractText, getDocumentProxy } from 'unpdf';
import catalogue from './catalogue.json' with { type: 'json' };
import {rankDocuments,tokens} from './search.js';
export const db=catalogue;
export type Evidence={id:string,title:string,url:string,manufacturer:string,document_type:string,page?:number,text:string};
export const domains=['tunstall.co.uk','tynetec.co.uk','aico.co.uk','appello.co.uk','chiptech.uk','chiptech.com','everon.net','careium.com','careium.co.uk','chubb.co.uk','campaigns.chubb.co.uk','paxton-access.com','videxuk.com','came.com'];
export function official(url:string){try{const u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password&&(!u.port||u.port==='443')&&domains.some(h=>u.hostname===h||u.hostname.endsWith('.'+h))}catch{return false}}
const known=new Set(db.documents.map(d=>d.url));const cache=new Map<string,{time:number,pages:string[]}>();
export async function readPDF(url:string){
 if(!known.has(url)||!official(url))throw Error('Document is outside the approved library');
 const hit=cache.get(url);if(hit&&Date.now()-hit.time<3600000)return hit.pages;
 let current=url,response:Response|undefined;
 for(let i=0;i<5;i++){if(!official(current))throw Error('Unapproved redirect');response=await fetch(current,{redirect:'manual',signal:AbortSignal.timeout(12000)});if(response.status>=300&&response.status<400){current=new URL(response.headers.get('location')||'',current).href;continue}break}
 if(!response?.ok)throw Error('PDF unavailable');
 if(Number(response.headers.get('content-length'))>16000000)throw Error('PDF too large');
 const reader=response.body!.getReader();const chunks:Uint8Array[]=[];let size=0;
 while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>16000000){await reader.cancel();throw Error('PDF too large')}chunks.push(part.value)}
 const data=new Uint8Array(size);let offset=0;for(const c of chunks){data.set(c,offset);offset+=c.length}if(new TextDecoder().decode(data.slice(0,5))!=='%PDF-')throw Error('Not a PDF');
 const pdf=await getDocumentProxy(data);try{if(pdf.numPages>200)throw Error('Manual exceeds interactive page limit');const result=await extractText(pdf,{mergePages:false});const pages=result.text;if(cache.size>=12)cache.delete(cache.keys().next().value!);cache.set(url,{time:Date.now(),pages});return pages}finally{await pdf.loadingTask.destroy()}
}
export async function gather(question:string,manufacturer:string){
 const docs=rankDocuments(db,question,manufacturer).slice(0,6),evidence:Evidence[]=[];const queryTokens=tokens(question);
 await Promise.all(docs.slice(0,4).map(async(d:any)=>{if(!/\.pdf(?:$|\?)/i.test(d.url)||!official(d.url))return;try{const pages=await readPDF(d.url);const ranked=pages.map((text,page)=>({text,page:page+1,score:queryTokens.reduce((s:number,t:string)=>s+(text.toLowerCase().includes(t)?Math.log(1+pages.length/(1+pages.filter(p=>p.toLowerCase().includes(t)).length)):0),0)})).filter(p=>p.score>0).sort((a,b)=>b.score-a.score).slice(0,3);for(const p of ranked)evidence.push({id:d.id+'-p'+p.page,title:d.title,url:d.url,manufacturer:d.manufacturer,document_type:d.document_type,page:p.page,text:p.text.slice(0,12000)})}catch{}}));
 for(const d of docs)if(!evidence.some(e=>e.url===d.url))evidence.push({id:d.id,title:d.title,url:d.url,manufacturer:d.manufacturer,document_type:d.document_type,text:'CATALOGUE METADATA ONLY. Document contents have not been read. Do not derive instructions from the title.'});
 return evidence;
}
