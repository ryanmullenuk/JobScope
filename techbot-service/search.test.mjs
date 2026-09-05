import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {rankDocuments,rankProducts} from './lib/search.js';
const db=JSON.parse(readFileSync(new URL('./lib/catalogue.json',import.meta.url)));
test('Advent XT2 does not retrieve the different Advent xt programming guide',()=>{const docs=rankDocuments(db,'Find Advent XT2 programming manual','Legrand Tynetec');assert.ok(docs.length);assert.ok(docs.every(d=>/xt2/i.test(d.title+' '+d.url)))});
test('Ei3016 query finds the exact model',()=>{const found=rankProducts(db,'Aico Ei3016');assert.ok(found[0].product.model_name.includes('Ei3016'))});
test('Manufacturer filter never crosses brands',()=>{assert.ok(rankDocuments(db,'programming manual','Tunstall').every(d=>d.manufacturer==='Tunstall'))});
test('Database references are valid and unique',()=>{const p=new Set(db.products.map(p=>p.id)),d=new Set(db.documents.map(d=>d.id));assert.equal(p.size,db.products.length);assert.equal(d.size,db.documents.length);assert.ok(db.product_documents.every(r=>p.has(r.product_id)&&d.has(r.document_id)))});
