export function tokens(text){return (String(text).toLowerCase().match(/[a-z0-9]+/g)||[]).filter(x=>!['the','for','how','what','and','with','from','find','manual','guide','using','number','technical','support','can','you','does','into','this','that','have','about','help'].includes(x)&&x.length>1)}
export function rankProducts(db,query,manufacturer=''){
 const ts=tokens(query),compact=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
 return db.products.filter(p=>!manufacturer||p.manufacturer===manufacturer).map(p=>{const name=p.model_name+' '+(p.model_number||'')+' '+(p.aliases||[]).join(' '),n=tokens(name),hay=tokens(p.manufacturer+' '+name);let score=ts.reduce((s,t)=>s+(hay.includes(t)?(n.includes(t)?5:1):0),0);if(p.model_number&&compact(query).includes(compact(p.model_number)))score+=30; const modelTokens=n.filter(t=>/\d/.test(t));if(modelTokens.length&&ts.some(t=>/\d/.test(t))&&!modelTokens.some(t=>ts.includes(t)))score-=12;return {product:p,score}}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,30);
}
export function rankDocuments(db,query,manufacturer=''){
 const ps=rankProducts(db,query,manufacturer),weights=new Map(ps.map(x=>[x.product.id,x.score])),scores=new Map();
 for(const r of db.product_documents){if(weights.has(r.product_id))scores.set(r.document_id,Math.max(scores.get(r.document_id)||0,weights.get(r.product_id)))}
 const ts=tokens(query),specific=ts.filter(t=>/\d/.test(t));return db.documents.filter(d=>(!manufacturer||d.manufacturer===manufacturer)&&(!specific.length||specific.some(t=>tokens(d.title+' '+d.url).includes(t)))).map(d=>{let score=(scores.get(d.id)||0)+ts.reduce((s,t)=>s+(tokens(d.title).includes(t)?2:0),0);if(/program/.test(query.toLowerCase())&&/program/.test((d.title+' '+d.document_type).toLowerCase()))score+=score?8:0;return {...d,score}}).filter(d=>d.score>2).sort((a,b)=>b.score-a.score).slice(0,10);
}
