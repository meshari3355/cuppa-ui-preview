import {chromium} from 'playwright';
import fs from 'node:fs';
import http from 'node:http';
import assert from 'node:assert/strict';
const root=process.env.PREVIEW_ROOT||'.';
const server=http.createServer((req,res)=>{let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(name==='/')name='/index.html';if(name.includes('..')){res.writeHead(400);return res.end()}try{res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':name.endsWith('.json')?'application/json':'text/html');res.end(fs.readFileSync(root+name))}catch{res.writeHead(404);res.end()}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch();const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
const nav=JSON.parse(fs.readFileSync(root+'/navigation.json','utf8'));
const misses={};
for(const lang of ['en','bn','ar']){
 for(const item of [{id:'home'},...nav]){
  const id=item.id||item.path.replace('.php','');
  await page.goto(base+'/#'+encodeURIComponent(id));
  await page.locator('[data-language="'+lang+'"]').click();
  await page.waitForTimeout(30);
  assert.equal(await page.locator('html').getAttribute('lang'),lang);
  assert.equal(await page.locator('html').getAttribute('dir'),lang==='ar'?'rtl':'ltr');
  if(lang!=='ar'){
   const remaining=await page.evaluate(()=>CuppaI18n.missing(document.querySelector('main')));
   if(remaining.length)misses[lang+':'+id]=remaining;
  }
 }
}
await page.goto(base+'/#inventory');
await page.locator('[data-language="ar"]').click();
const field=page.locator('input[type=number]').first();
await field.fill('123.5');await page.locator('[data-language="bn"]').click();assert.equal(await field.inputValue(),'123.5');
await page.locator('[data-language="ar"]').click();assert.equal(await field.inputValue(),'123.5');
assert.match(await page.locator('main').innerText(),/بيانات الجرد/);
for(const width of [390,820,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),true)}
await browser.close();server.close();
console.log(JSON.stringify({routes:nav.length+1,languages:3,errors,missing:misses},null,2));
assert.equal(errors.length,0);
assert.equal(Object.keys(misses).length,0,'Untranslated visible UI text');
