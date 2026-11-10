const {test,expect}=require('@playwright/test');const esbuild=require('esbuild');const path=require('path');const fs=require('fs');
const three=esbuild.buildSync({stdin:{contents:"export * from 'three'",resolveDir:path.resolve(__dirname,'../..'),loader:'js'},bundle:true,write:false,minify:true,platform:'browser',format:'iife',globalName:'THREE',target:['safari16','chrome110']}).outputFiles[0].text;
const source=fs.readFileSync(path.resolve(__dirname,'../../public/src/island-rides-3d.js'),'utf8');
const ledgerSource=fs.readFileSync(path.resolve(__dirname,'../../public/src/ticket-ledger.js'),'utf8');
test.use({viewport:{width:900,height:900}});test.setTimeout(60000);
for(const type of ['carousel','coaster','ferris','bumper','pirate','train'])test(`${type}: actual WebGL, confirm, single debit, complete`,async({page})=>{
 await page.goto('/offline.html');await page.setContent('<main id="ride" style="width:700px"></main><style>.ride3d-canvas{height:350px;width:700px}.ride3d canvas{width:100%;height:100%}</style>');
 await page.addScriptTag({content:three});await page.addScriptTag({content:ledgerSource});await page.addScriptTag({content:source});
 await page.evaluate(async type=>{
  window.db=await TicketLedger.open({dbName:'ride-e2e-'+crypto.randomUUID()});
  const q=(await db.getOrCreateRound('child-1',{mode:'test',questionKey:'test:'+type,question:{prompt:'x',options:['a','b']},correctId:'a'})).round;
  await db.answer('child-1',{mode:'test',roundId:q.id,attemptId:crypto.randomUUID(),expectedAttemptCount:0,optionId:'a'});
  window.ride=IslandRides3D.open({type,container:document.querySelector('#ride'),childId:'child-1',ledger:db,settings:{soundOn:false},onClose:details=>window.__exit=details});
 },type);
 await expect(page.locator('.ride3d-canvas canvas')).toBeVisible();
 expect(await page.evaluate(()=>Boolean(document.querySelector('canvas').getContext('webgl2')))).toBe(true);
 if(type==='carousel')await page.locator('[data-ride3d-animal]').selectOption('bear');
 if(type==='train')await page.locator('[data-ride3d-station]').selectOption('garden');
 if(type==='ferris'){const download=page.waitForEvent('download');await page.locator('[data-ride3d="card"]').click();expect((await download).suggestedFilename()).toBe('island-scenic-card.png');}
 await page.locator('[data-ride3d-seat]').selectOption('1');await page.locator('[data-ride3d-color]').selectOption('2');
 await page.locator('[data-ride3d="start"]').click();
 await expect(page.locator('[data-ride3d="skip"]')).toBeVisible({timeout:12000});
 const s=await page.evaluate(()=>db.get('child-1'));expect(s.balance).toBe(0);expect(s.transactions.filter(x=>x.type==='ride_debit')).toHaveLength(1);
 await page.locator('[data-ride3d="pause"]').click();await expect(page.locator('[data-ride3d="pause"]')).toHaveText('繼續');
 await page.locator('[data-ride3d="pause"]').click();
 if(type==='bumper'){await page.locator('[data-drive="right"]').dispatchEvent('pointerdown',{pointerId:1});await page.locator('[data-drive="right"]').dispatchEvent('pointerup',{pointerId:1});}
 await page.locator('[data-ride3d="wave"]').click();await page.locator('[data-ride3d="skip"]').click();
 await expect.poll(async()=>{const s=await page.evaluate(()=>db.get('child-1'));return Object.values(s.rides)[0].status}).toBe('completed');
 await expect(page.locator('.ride3d-stickers')).toContainText({carousel:'旋轉木馬',coaster:'雲霄飛車',ferris:'摩天輪',bumper:'碰碰車',pirate:'海盜船',train:'環島小火車'}[type]);
 await page.locator('[data-ride3d="close"]').click();expect((await page.evaluate(()=>db.get('child-1'))).balance).toBe(0);
 await expect.poll(()=>page.evaluate(()=>window.__exit)).toEqual({type,completed:true,exitId:type==='train'?'garden':type});
});
for(const type of ['carousel','coaster','ferris','bumper','pirate','train'])test(`${type}: reserve and paint interruption refund`,async({page})=>{
 await page.goto('/offline.html');await page.setContent('<main id="ride" style="width:700px"></main><style>.ride3d-canvas{height:350px;width:700px}.ride3d canvas{width:100%;height:100%}</style>');
 await page.addScriptTag({content:three});await page.addScriptTag({content:ledgerSource});await page.addScriptTag({content:source});
 await page.evaluate(async type=>{window.db=await TicketLedger.open({dbName:'ride-cancel-'+crypto.randomUUID()});const q=(await db.getOrCreateRound('child-1',{mode:'test',questionKey:'test:'+type,question:{prompt:'x',options:['a','b']},correctId:'a'})).round;await db.answer('child-1',{mode:'test',roundId:q.id,attemptId:crypto.randomUUID(),expectedAttemptCount:0,optionId:'a'});},type);
 for(const mode of ['reserve','paint']){
  await page.evaluate(({type,mode})=>{
   window.entered=false;window.gate=new Promise(resolve=>window.release=resolve);
   const api={reserveRide:async(...a)=>{const r=await db.reserveRide(...a);if(mode==='reserve'){window.entered=true;await gate;}return r},markRidePainted:async(...a)=>{const r=await db.markRidePainted(...a);if(mode==='paint'){window.entered=true;await gate;}return r},startRide:(...a)=>db.startRide(...a),cancelRide:(...a)=>db.cancelRide(...a),completeRide:(...a)=>db.completeRide(...a)};
   window.ride=IslandRides3D.open({type,container:document.querySelector('#ride'),childId:'child-1',ledger:api,settings:{soundOn:false}});
  },{type,mode});
  await page.locator('[data-ride3d="start"]').click();await expect.poll(()=>page.evaluate(()=>window.entered)).toBe(true);
  await page.evaluate(()=>{window.ride.close();window.release();});
  await expect.poll(async()=>(await page.evaluate(()=>db.get('child-1'))).balance).toBe(1);
  const st=await page.evaluate(()=>db.get('child-1'));expect(Object.values(st.rides).at(-1).status).toBe('refunded');
 }
});
for(const type of ['carousel','coaster','ferris','bumper','pirate','train'])test(`${type}: group reuses opt-in reservation without second charge`,async({page})=>{
 await page.goto('/offline.html');await page.setContent('<main id="ride" style="width:700px"></main><style>.ride3d-canvas{height:350px;width:700px}.ride3d canvas{width:100%;height:100%}</style>');
 await page.addScriptTag({content:three});await page.addScriptTag({content:ledgerSource});await page.addScriptTag({content:source});
 await page.evaluate(async type=>{window.db=await TicketLedger.open({dbName:'ride-group-'+crypto.randomUUID()});const q=(await db.getOrCreateRound('child-1',{mode:'test',questionKey:'test:'+type,question:{prompt:'x',options:['a','b']},correctId:'a'})).round;await db.answer('child-1',{mode:'test',roundId:q.id,attemptId:crypto.randomUUID(),expectedAttemptCount:0,optionId:'a'});window.op=crypto.randomUUID();await db.reserveRide('child-1',{operationId:op,ride:type,startPolicy:TicketLedger.PAINT_ACK_POLICY});window.ride=IslandRides3D.open({type,container:document.querySelector('#ride'),childId:'child-1',ledger:db,settings:{soundOn:false},group:{operationId:op,startsAt:Date.now()+250,participants:['p1','p2','p3'],selfId:'p1',sessionRideId:'synthetic-session',onBumperMove:()=>{}}});},type);
 await expect(page.locator('[data-ride3d="skip"]')).toBeVisible({timeout:10000});
 const s=await page.evaluate(()=>db.get('child-1'));const op=await page.evaluate(()=>window.op);expect(s.balance).toBe(0);expect(s.transactions.filter(t=>t.type==='ride_debit'&&t.operationId===op)).toHaveLength(1);
 expect(await page.evaluate(()=>window.ride.getState().sessionRideId)).toBe('synthetic-session');
 if(type==='bumper'){expect(await page.evaluate(()=>ride.setBumperPeer('p2',{x:.4,z:-.4}))).toBe(true);expect(await page.evaluate(()=>ride.setBumperPeer('unknown',{x:0,z:0}))).toBe(false);}
 await page.locator('[data-ride3d="skip"]').click();await expect.poll(async()=>{const s=await page.evaluate(()=>db.get('child-1'));return Object.values(s.rides)[0].status}).toBe('completed');
});


test('same-panel retry uses new operation only after a confirmed pre-start refund',async({page})=>{
 await page.goto('/offline.html');await page.setContent('<main id="ride" style="width:700px"></main><style>.ride3d-canvas{height:350px;width:700px}</style>');
 await page.addScriptTag({content:three});await page.addScriptTag({content:ledgerSource});await page.addScriptTag({content:source});
 await page.evaluate(async()=>{window.db=await TicketLedger.open({dbName:'ride-retry-'+crypto.randomUUID()});const q=(await db.getOrCreateRound('child-1',{mode:'test',questionKey:'test:q',question:{prompt:'x',options:['a','b']},correctId:'a'})).round;await db.answer('child-1',{mode:'test',roundId:q.id,attemptId:crypto.randomUUID(),expectedAttemptCount:0,optionId:'a'});let fail=true;const api={reserveRide:(...a)=>db.reserveRide(...a),markRidePainted:(...a)=>{if(fail){fail=false;return Promise.reject(Error('synthetic paint failure'));}return db.markRidePainted(...a)},startRide:(...a)=>db.startRide(...a),cancelRide:(...a)=>db.cancelRide(...a),completeRide:(...a)=>db.completeRide(...a),get:(...a)=>db.get(...a)};window.ride=IslandRides3D.open({type:'carousel',container:document.querySelector('#ride'),childId:'child-1',ledger:api,settings:{soundOn:false}});});
 await page.locator('[data-ride3d="start"]').click();await expect(page.locator('.ride3d-status')).toContainText('無法開始');await expect.poll(async()=>(await page.evaluate(()=>db.get('child-1'))).balance).toBe(1);
 const before=await page.evaluate(async()=>Object.keys((await db.get('child-1')).rides));await page.locator('[data-ride3d="start"]').click();await expect(page.locator('[data-ride3d="skip"]')).toBeVisible();
 const after=await page.evaluate(()=>db.get('child-1'));expect(Object.keys(after.rides)).toHaveLength(2);expect(Object.keys(after.rides)).toContain(before[0]);expect(after.balance).toBe(0);
});

test('completion failure is explicit and same operation can be safely retried',async({page})=>{
 await page.goto('/offline.html');await page.setContent('<main id="ride" style="width:700px"></main><style>.ride3d-canvas{height:350px;width:700px}</style>');
 await page.addScriptTag({content:three});await page.addScriptTag({content:ledgerSource});await page.addScriptTag({content:source});
 await page.evaluate(async()=>{window.db=await TicketLedger.open({dbName:'ride-finish-'+crypto.randomUUID()});const q=(await db.getOrCreateRound('child-1',{mode:'test',questionKey:'test:q',question:{prompt:'x',options:['a','b']},correctId:'a'})).round;await db.answer('child-1',{mode:'test',roundId:q.id,attemptId:crypto.randomUUID(),expectedAttemptCount:0,optionId:'a'});let fail=true;const api={reserveRide:(...a)=>db.reserveRide(...a),markRidePainted:(...a)=>db.markRidePainted(...a),startRide:(...a)=>db.startRide(...a),cancelRide:(...a)=>db.cancelRide(...a),completeRide:(...a)=>{if(fail){fail=false;return Promise.reject(Error('synthetic complete failure'));}return db.completeRide(...a)},get:(...a)=>db.get(...a)};window.ride=IslandRides3D.open({type:'train',container:document.querySelector('#ride'),childId:'child-1',ledger:api,settings:{soundOn:false},onClose:x=>window.__finishExit=x});});
 await page.locator('[data-ride3d="start"]').click();await expect(page.locator('[data-ride3d="skip"]')).toBeVisible();await page.locator('[data-ride3d="skip"]').click();
 await expect(page.locator('.ride3d-status')).toContainText('尚未確認');await expect(page.locator('[data-ride3d="retry-complete"]')).toBeVisible();const pending=await page.evaluate(()=>db.get('child-1'));expect(Object.values(pending.rides)[0].status).toBe('started');
 await page.locator('[data-ride3d="retry-complete"]').click();await expect(page.locator('.ride3d-status')).toContainText('抵達');await page.locator('[data-ride3d="close"]').click();
 await expect.poll(()=>page.evaluate(()=>window.__finishExit)).toEqual({type:'train',completed:true,exitId:'plaza'});const done=await page.evaluate(()=>db.get('child-1'));expect(done.balance).toBe(0);expect(done.transactions.filter(t=>t.type==='ride_debit')).toHaveLength(1);expect(Object.values(done.rides)[0].status).toBe('completed');
});


test('group bumper sends assigned spawn and stops at remote car with focused button',async({page})=>{
 await page.goto('/offline.html');await page.setContent('<main id="ride" style="width:700px"></main><style>.ride3d-canvas{height:350px;width:700px}</style>');await page.addScriptTag({content:three});await page.addScriptTag({content:ledgerSource});await page.addScriptTag({content:source});
 await page.evaluate(async()=>{window.db=await TicketLedger.open({dbName:'bumper-motion-'+crypto.randomUUID()});const q=(await db.getOrCreateRound('child-1',{mode:'test',questionKey:'test:q',question:{prompt:'x',options:['a','b']},correctId:'a'})).round;await db.answer('child-1',{mode:'test',roundId:q.id,attemptId:crypto.randomUUID(),expectedAttemptCount:0,optionId:'a'});const op=crypto.randomUUID();await db.reserveRide('child-1',{operationId:op,ride:'bumper',startPolicy:TicketLedger.PAINT_ACK_POLICY});window.points=[];window.ride=IslandRides3D.open({type:'bumper',container:document.querySelector('#ride'),childId:'child-1',ledger:db,settings:{soundOn:false},group:{operationId:op,startsAt:Date.now()+100,participants:['p1','p2','p3'],selfId:'p1',sessionRideId:'synthetic-session',onBumperMove:p=>window.points.push(p)}});});
 await expect(page.locator('[data-ride3d="wave"]')).toBeVisible();await expect.poll(()=>page.evaluate(()=>window.points.length)).toBeGreaterThan(0);const first=await page.evaluate(()=>window.points[0]);expect(first.x).toBeCloseTo(-.4,2);expect(first.z).toBeCloseTo(0,2);
 await page.locator('[data-ride3d="wave"]').focus();await page.keyboard.down('ArrowRight');await page.waitForTimeout(1100);await page.keyboard.up('ArrowRight');const pts=await page.evaluate(()=>window.points);expect(Math.max(...pts.map(p=>p.x))).toBeGreaterThan(-.38);expect(Math.max(...pts.map(p=>p.x))).toBeLessThan(-.249);
});
