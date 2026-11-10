const {test,expect,chromium}=require('@playwright/test');
const {spawn}=require('node:child_process');
const net=require('node:net');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');

test.use({trace:process.env.ZHUYIN_ROOM_TRACE ? 'retain-on-failure' : 'off', actionTimeout:20000, navigationTimeout:25000});

const parentKey='synthetic-parent-key-for-local-tests';
const project=path.resolve(__dirname,'../..');
const types=['carousel','coaster','ferris','bumper','pirate','train'];
let server, origin, serverLog = '';
const logServer = (chunk) => { serverLog = (serverLog+String(chunk)).slice(-6000); };

async function ephemeralPort() {
  const listener=net.createServer();
  await new Promise(resolve=>listener.listen(0,'127.0.0.1',resolve));
  const port=listener.address().port;
  await new Promise(resolve=>listener.close(resolve));
  return port;
}

test.beforeAll(async()=>{
  const port=await ephemeralPort();
  origin=`http://127.0.0.1:${port}`;
  const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'zhuyin-browser-room-'));
  const persist=path.join(fixture,'state');
  for (const entry of ['src','public','wrangler.room-test.jsonc']) {
    fs.cpSync(path.join(project,entry),path.join(fixture,entry),{recursive:true});
  }
  const cli=path.join(project,'node_modules','wrangler','bin','wrangler.js');
  server=spawn(process.execPath,[cli,'dev','--config','wrangler.room-test.jsonc','--local','--ip','127.0.0.1','--port',String(port),
    '--persist-to',persist,'--var','ROOM_PARENT_KEY:'+parentKey],{cwd:fixture,windowsHide:true,
    env:{...process.env,WRANGLER_SEND_METRICS:'false'},stdio:['ignore','pipe','pipe']});
  server.stderr.on('data',logServer);
  server.stdout.on('data',logServer);
  await expect.poll(async()=>{
    if(server.exitCode !== null) throw new Error('Local Wrangler exited');
    try {return (await fetch(origin+'/src/version.js')).ok;}catch(_){return false;}
  },{timeout:45000}).toBe(true);
});

test.afterAll(async()=>{
  if(!server || server.exitCode !== null)return;
  if(process.platform==='win32') {
    const kill=spawn('taskkill.exe',['/PID',String(server.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'});
    await new Promise(resolve=>kill.once('exit',resolve));
  } else server.kill();
});

async function launch(context, tickets) {
  const page=await context.newPage(), packets=[];
  page.on('websocket',(ws)=>{
    if(!ws.url().includes('/api/rooms/'))return;
    ws.on('framereceived',({payload})=>{
      try {
        const data=JSON.parse(String(payload));
        if(['welcome','snapshot','ride_started','bumper_state','ride_ended'].includes(data.type)) packets.push(data);
        if(packets.length>2000)packets.shift();
      }catch(_){}
    });
  });
  await page.goto(origin);
  await page.locator('[data-child="child-1"]').click();
  await page.evaluate(async (count)=>{
    const ledger=await TicketLedger.open();
    try {
      for(let i=0;i<count;i++){
        const mode='room-test-'+i;
        const round=(await ledger.getOrCreateRound('child-1',{mode,questionKey:mode,question:{item:mode},correctId:'a'})).round;
        await ledger.answer('child-1',{mode,roundId:round.id,attemptId:crypto.randomUUID(),expectedAttemptCount:0,optionId:'a'});
      }
    } finally {ledger.close();}
  },tickets);
  await page.locator('[data-go="island3DView"]').click();
  await expect(page.locator('.island3d-canvas')).toBeVisible();
  await page.locator('[data-3d-quality]').selectOption('low');
  return {page,packets};
}

async function enterRoom(page, invite) {
  await page.locator('[data-room-open]').click();
  await page.locator('input[name="parentKey"]').fill(parentKey);
  if(invite) await page.locator('input[name="invite"]').fill(invite);
  await page.locator(`[data-room-form] button[value="${invite?'join':'create'}"]`).click();
  await expect(page.locator('[data-room-status]')).toContainText('已連線',{timeout:20000}).catch(async (error)=>{
    const message=await page.locator('[data-room-error]').textContent().catch(()=>null);
    throw new Error((message || '房間未達到已連線狀態'),{cause:error});
  });
}

async function balance(page) {
  return page.evaluate(async()=>{
    const ledger=await TicketLedger.open();
    try{
      const s=await ledger.get('child-1');
      return {balance:s.balance,debits:s.transactions.filter(t=>t.type==='ride_debit').length,
        charges:s.transactions.filter(t=>t.type==='ride_started').length};
    }finally{ledger.close();}
  });
}

test('real private WebSocket room: two then three browsers, six shared rides and isolated tickets',async({browser},testInfo)=>{
  test.setTimeout(400000);
  const edge=process.env.ZHUYIN_ROOM_EDGE ? await chromium.launch({
    executablePath:process.env.ZHUYIN_ROOM_EDGE,args:['--enable-unsafe-swiftshader']
  }) : null;
  const config={viewport:{width:680,height:600},serviceWorkers:'block'};
  const contexts=[
    await browser.newContext(config),await browser.newContext(config),
    await (edge || browser).newContext(config),await browser.newContext(config)
  ];
  try {
    const host=await launch(contexts[0],8);
    const guest=await launch(contexts[1],9);
    await enterRoom(host.page);
    const invite=await host.page.locator('input[name="share"]').inputValue();
    await enterRoom(guest.page,invite);
    await expect(host.page.locator('[data-room-count]')).toContainText('2／3');
    const two=host.packets.filter(p=>p.type==='snapshot').at(-1);
    expect(two.players.filter(p=>p.connected)).toHaveLength(2);
    const third=await launch(contexts[2],10);
    await test.step('第三位加入',()=>enterRoom(third.page,invite));
    const players=[host,guest,third];
    for(const p of players) {
      await expect(p.page.locator('[data-room-count]')).toContainText('3／3');
      await expect(p.page.locator('.island3d-peer-label')).toHaveCount(2);
    }
    const extra=await contexts[3].newPage();
    await extra.goto(origin);
    const [roomId,inviteToken]=invite.split('.');
    const refusal=await extra.evaluate(async body=>(await fetch('/api/rooms/join',{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)
    })).status,{roomId,inviteToken,parentKey});
    expect(refusal).toBe(409);
    const thirdId=third.packets.find(p=>p.type==='welcome').selfId;
    await third.page.locator('.island3d-viewport').focus();
    await third.page.keyboard.down('d');
    try {
      await expect.poll(()=>host.packets.some(packet=>packet.players?.some(p=>p.sessionId===thirdId&&p.x>.75)),{timeout:10000}).toBe(true);
    }finally{await third.page.keyboard.up('d');}
    const hostId=host.packets.find(p=>p.type==='welcome').selfId;
    await test.step('不依賴移動封包的揮手',async()=>{
      await third.page.evaluate(()=>{
        window.originalRoomSend=WebSocket.prototype.send;
        WebSocket.prototype.send=function(payload) {
          if(typeof payload==='string' && JSON.parse(payload).type==='move') return;
          return window.originalRoomSend.call(this,payload);
        };
      });
      try {
        await third.page.locator('[data-room-wave]').click();
        await expect.poll(()=>guest.packets.some(packet=>packet.players?.some(p=>p.sessionId===thirdId&&p.action==='wave'))).toBe(true);
      } finally {
        await third.page.evaluate(()=>{WebSocket.prototype.send=window.originalRoomSend; delete window.originalRoomSend;});
      }
    });

    async function ride(type, participants) {
      await host.page.locator('select[name="ride"]').selectOption(type);
      await host.page.locator('[data-room-offer]').click();
      await Promise.all(participants.map(p=>p.page.locator('[data-room-ready]').click()));
      await expect(host.page.locator('[data-room-offer-info]')).toContainText(`${participants.length} 位已準備`);
      await host.page.locator('[data-room-start]').click();
      await Promise.all(participants.map((p,i)=>expect(p.page.locator('#ride3d [data-ride3d="skip"]'),`${type} participant ${i+1}`).toBeVisible({timeout:18000})));
      if(type==='bumper'){
        await host.page.locator('#ride3d [data-ride3d="wave"]').focus();
        await host.page.keyboard.down('ArrowRight');
        try {await expect.poll(()=>guest.packets.some(p=>p.type==='bumper_state'&&p.sessionId===hostId&&p.x>-.35),{timeout:10000}).toBe(true);}
        finally {await host.page.keyboard.up('ArrowRight');}
      }
      for(const p of participants){
        await p.page.locator('#ride3d [data-ride3d="skip"]').click();
        await p.page.locator('#ride3d [data-ride3d="close"]').click();
        await expect(p.page.locator('.island3d-canvas')).toBeVisible();
      }
      await expect(host.page.locator('[data-room-offer]')).toBeVisible();
    }

    await ride('carousel',[host,guest]);
    expect(await balance(third.page)).toEqual({balance:10,debits:0,charges:0});
    for(const type of types) await test.step('三人同乘 '+type,()=>ride(type,players));
    for(const [i,p] of players.entries()) {
      const consumed=i===2 ? 6 : 7;
      expect(await balance(p.page)).toEqual({balance:8+i-consumed,debits:consumed,charges:consumed});
      expect(p.packets.filter(q=>q.type==='ride_started').some(q=>q.participants.length===3)).toBe(true);
    }
    await host.page.locator('[data-room-end]').click();
    await expect(guest.page.locator('[data-room-status]')).toContainText('單人探索');
    await expect(third.page.locator('[data-room-status]')).toContainText('單人探索');
  } finally {
    const safeLog=serverLog.replaceAll(parentKey,'[redacted]').replace(/(\/api\/rooms\/)[\w-]{20,}/g,'$1[room]');
    await testInfo.attach('local-worker', {body:safeLog,contentType:'text/plain'});
    await Promise.allSettled(contexts.map(context=>context.close()));
    await edge?.close();
  }
});
