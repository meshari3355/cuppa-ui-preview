import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:8080');
await page.waitForSelector('.module-tile');
assert.equal(await page.locator('.module-tile').count(),45);
const catalog=JSON.parse(fs.readFileSync('navigation.json','utf8'));
for(const item of catalog){
 await page.locator('#navigation a[data-open="'+item.id+'"]').click();
 await page.waitForSelector('#screen h1');
 assert.ok((await page.locator('#screen h1').textContent()).length>0,item.id);
}
await page.getByRole('button',{name:'واجهة العامل',exact:true}).click();
assert.equal(await page.locator('.module-tile').count(),8);
assert.equal(await page.locator('.kpi').count(),0);
await page.locator('#navigation a[data-open="daily_closing"]').click();
await page.locator('#sampleForm input').first().fill('100');
await page.getByRole('button',{name:'إرسال تجريبي',exact:true}).click();
assert.ok((await page.locator('#toast').textContent()).includes('لم'));
await page.getByRole('button',{name:'واجهة المدير',exact:true}).click();
await page.locator('#navigation a[data-open="product_costing"]').click();
await page.getByRole('button',{name:'تعديل سريع',exact:true}).first().click();
assert.equal(await page.locator('#demoDialog').isVisible(),true);
await page.getByRole('button',{name:'إلغاء',exact:true}).click();
await page.locator('#sbSearch').fill('لا يوجد هذا النص');
assert.equal(await page.locator('#noResult').isVisible(),true);
await page.getByRole('button',{name:'واجهة المدير',exact:true}).click();
await page.getByRole('button',{name:'EN',exact:true}).click();
assert.equal(await page.locator('html').getAttribute('dir'),'ltr');
await page.getByRole('button',{name:'BN',exact:true}).click();
assert.equal(await page.locator('html').getAttribute('lang'),'bn');
await page.getByRole('button',{name:'AR',exact:true}).click();
await page.screenshot({path:'manager-desktop.png',fullPage:true});
await page.getByRole('button',{name:'واجهة العامل',exact:true}).click();
await page.screenshot({path:'worker-desktop.png',fullPage:true});
await page.setViewportSize({width:390,height:844});
await page.getByRole('button',{name:'فتح القائمة',exact:true}).click();
assert.equal(await page.locator('#sbNav').evaluate(e=>e.classList.contains('open')),true);
await page.locator('#navigation a[data-open="inventory"]').click();
assert.equal(await page.locator('#sbNav').evaluate(e=>e.classList.contains('open')),false);
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await page.screenshot({path:'worker-mobile.png',fullPage:true});

for(const role of ['manager','worker']){
 await page.locator('[data-role="'+role+'"]').click();
 for(const [width,height] of [[1440,900],[1366,768],[1194,834],[1024,768],[820,1180],[768,1024],[390,844],[320,640]]){
  await page.setViewportSize({width,height});
  await page.waitForTimeout(300);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),role+' viewport overflow '+width);
  assert.ok(await page.locator('#sbMain').evaluate(e=>e.scrollWidth<=e.clientWidth+1),role+' main overflow '+width);
  for(const card of await page.locator('.kpi,.panel,.module-tile').all()){
   const box=await card.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width+1,role+' card bounds '+width);
  }
  if(width<=1100){
   await page.locator('.tb-toggle').click();
   await page.waitForTimeout(300);
   const box=await page.locator('#sbNav').boundingBox();
   assert.ok(box.x>=8&&box.x+box.width<=width-8&&box.y>0&&box.y+box.height<=height-8,'floating drawer bounds '+width);
   await page.keyboard.press('Escape');
   assert.equal(await page.locator('.tb-toggle').getAttribute('aria-expanded'),'false');
   await page.locator('.tb-toggle').click();
   await page.locator('#navigation a').first().click();
   assert.equal(await page.locator('.tb-toggle').getAttribute('aria-expanded'),'false');
   await page.locator('[data-role="'+role+'"]').click();
  } else {
   const box=await page.locator('#sbNav').boundingBox();
   assert.ok(box.x>=8&&box.x+box.width<=width-8&&box.y+box.height<=height-8,'floating desktop bounds');
  }
 }
}
await page.setViewportSize({width:820,height:1180});
await page.locator('[data-role="manager"]').click();
await page.screenshot({path:'manager-ipad.png',fullPage:true});
await page.locator('.tb-toggle').click();
await page.setViewportSize({width:1440,height:900});
await page.waitForTimeout(300);
assert.equal(await page.locator('#sbOverlay').isVisible(),false);
await page.getByRole('button',{name:'EN',exact:true}).click();
assert.ok((await page.locator('#sbNav').boundingBox()).x<40,'LTR floating sidebar');
await page.getByRole('button',{name:'AR',exact:true}).click();

assert.deepEqual(errors,[]);
await browser.close();
console.log('PASS all 45 routes, both roles, demo forms, product dialog, search, languages, mobile navigation and overflow.');
