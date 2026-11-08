import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:8080');
await page.waitForSelector('.module-tile');
const catalog=JSON.parse(fs.readFileSync('navigation.json','utf8'));
assert.equal(await page.locator('.module-tile').count(),45);
for(const item of catalog){
 await page.locator('#navigation a[data-open="'+item.id+'"]').click();
 await page.waitForSelector('#screen h1');
 assert.ok((await page.locator('#screen h1').textContent()).length>0,item.id);
 const tabs=await page.locator('[data-section]').allTextContents();
 for(const tab of tabs){
  await page.locator('[data-section]').filter({hasText:tab}).first().click();
  assert.ok(await page.locator('.page-panel,.product-card').count(),item.id+' '+tab);
  assert.ok(await page.locator('#sbMain').evaluate(e=>e.scrollWidth<=e.clientWidth+1),item.id+' overflow');
 }
 if(await page.locator('.page-more').count()){
  await page.locator('.page-more summary').click();
  assert.ok(await page.locator('.page-tool-grid .page-action').first().isVisible());
  await page.locator('.page-tool-grid .page-action').first().click();
  assert.equal(await page.locator('#demoDialog').isVisible(),true);
  await page.getByRole('button',{name:'إلغاء',exact:true}).click();
 }
}
await page.locator('[data-role="worker"]').click();
assert.equal(await page.locator('.module-tile').count(),8);
assert.equal(await page.locator('.kpi').count(),0);
await page.locator('#navigation a[data-open="daily_closing"]').click();
await page.locator('#sampleForm input').first().fill('2026-11-08');
await page.locator('#sampleForm button[type=submit]').click();
assert.ok((await page.locator('#toast').textContent()).includes('لم'));
await page.locator('[data-role="manager"]').click();
await page.screenshot({path:'manager-desktop.png',fullPage:true});
await page.locator('#navigation a[data-open="product_costing"]').click();
await page.locator('[data-section]').first().click();
await page.locator('.product-card [data-action="تعديل سريع"]').first().click();
assert.equal(await page.locator('#demoDialog').isVisible(),true);
await page.getByRole('button',{name:'إلغاء',exact:true}).click();
for(const [width,height] of [[1440,900],[1024,768],[820,1180],[390,844],[320,640]]){
 await page.setViewportSize({width,height});
 for(const id of ['product_costing','inventory','daily_closing','review_invoices','settings','messages','branch_contracts']){
  if(width<=1100)await page.locator('.tb-toggle').click();
  await page.locator('#navigation a[data-open="'+id+'"]').click();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),id+' viewport '+width);
  assert.ok(await page.locator('#sbMain').evaluate(e=>e.scrollWidth<=e.clientWidth+1),id+' content '+width);
 }
 if(width===820)await page.screenshot({path:'manager-ipad.png',fullPage:true});
}
await page.locator('[data-role="worker"]').click();
await page.screenshot({path:'worker-mobile.png',fullPage:true});
await page.setViewportSize({width:1440,height:900});
await page.screenshot({path:'worker-desktop.png',fullPage:true});
await page.getByRole('button',{name:'EN',exact:true}).click();
assert.equal(await page.locator('html').getAttribute('dir'),'ltr');
await page.getByRole('button',{name:'AR',exact:true}).click();
assert.deepEqual(errors,[]);
await browser.close();
console.log('PASS 45 routes, every page section, original-name action dialogs, sample form, both roles and responsive layouts.');
