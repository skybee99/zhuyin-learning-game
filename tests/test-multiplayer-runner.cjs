'use strict';
// Runs isolated local SQLite-backed Durable Objects; never touches deployed configuration.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),net=require('node:net'),assert=require('node:assert/strict');
const {spawn,spawnSync}=require('node:child_process');
const WebSocket=require('ws');
const root=path.resolve(__dirname,'..'), temporary=fs.mkdtempSync(path.join(os.tmpdir(),'zhuyin-room-fixture-'));
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function unusedPort(){const server=net.createServer();await new Promise((resolve,reject)=>server.listen(0,'127.0.0.1',resolve).on('error',reject));const p=server.address().port;await new Promise(resolve=>server.close(resolve));return p;}
async function main(){
  fs.mkdirSync(path.join(temporary,'src'),{recursive:true});fs.mkdirSync(path.join(temporary,'public','src'),{recursive:true});
  fs.copyFileSync(path.join(root,'src','worker.js'),path.join(temporary,'src','worker.js'));
  fs.copyFileSync(path.join(root,'public','src','island-world-3d.js'),path.join(temporary,'public','src','island-world-3d.js'));
  fs.copyFileSync(path.join(root,'wrangler.room-test.jsonc'),path.join(temporary,'wrangler.room-test.jsonc'));
  fs.writeFileSync(path.join(temporary,'public','index.html'),'<!doctype html><title>synthetic fixture</title>');
  const port=await unusedPort(), origin=`http://127.0.0.1:${port}`;
  const bin=path.join(root,'node_modules','wrangler','bin','wrangler.js');
  if(!fs.existsSync(bin))throw new Error('Pinned Wrangler dependency not installed; run npm ci');
  let server, startupLog='';
  function start(){
    const child=spawn(process.execPath,[bin,'dev','--local','--config',path.join(temporary,'wrangler.room-test.jsonc'),'--ip','127.0.0.1','--port',String(port),'--persist-to',path.join(temporary,'state'),'--var','ROOM_PARENT_KEY:synthetic-parent-key-for-local-tests'],{cwd:temporary,env:{...process.env,WRANGLER_SEND_METRICS:'false'},stdio:['ignore','pipe','pipe'],windowsHide:true});
    child.stderr.on('data',chunk=>{startupLog=(startupLog+chunk.toString()).slice(-3000);});child.stdout.on('data',chunk=>{startupLog=(startupLog+chunk.toString()).slice(-3000);});return child;
  }
  async function stop(child){
    if(!child || child.exitCode!==null)return;
    if(process.platform==='win32')spawnSync('taskkill.exe',['/pid',String(child.pid),'/t','/f'],{stdio:'ignore',windowsHide:true});
    else child.kill('SIGTERM');
    const deadline=Date.now()+7000;while(Date.now()<deadline){try{await fetch(origin+'/');await pause(100);}catch{return;}}
    throw new Error('Local fixture did not stop');
  }
  async function ready(child){
    const deadline=Date.now()+90000;
    while(Date.now()<deadline && child.exitCode===null){try{const r=await fetch(origin+'/',{signal:AbortSignal.timeout(1500)});if(r.ok)return;}catch{}await pause(200);}
    throw new Error('Local Wrangler fixture failed to start: '+startupLog);
  }
  async function post(route,body){const r=await fetch(origin+'/api/rooms/'+route,{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)});if(!r.ok)throw new Error('Local restart fixture HTTP '+r.status);return r.json();}
  async function connect(who){
    const ws=new WebSocket(origin.replace(/^http/,'ws')+'/api/rooms/'+who.roomId+'/connect',{headers:{Origin:origin}});
    ws.on('error',()=>{});
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error('Restart fixture auth timeout')),7000);
      ws.once('open',()=>ws.send(JSON.stringify({type:'auth',sessionId:who.sessionId,sessionToken:who.sessionToken})));
      ws.on('message',raw=>{let m;try{m=JSON.parse(raw.toString());}catch{return;}if(m.type==='welcome'){clearTimeout(timer);resolve({ws,welcome:m});}});
      ws.once('close',()=>{clearTimeout(timer);reject(new Error('Restart fixture socket closed before authentication'));});
    });
  }
  try{
    server=start();await ready(server);
    const test=spawn(process.execPath,[path.join(root,'tests','test-multiplayer.mjs')],{cwd:root,env:{...process.env,ROOM_TEST_ORIGIN:origin},stdio:'inherit',windowsHide:true});
    const code=await new Promise((resolve,reject)=>{test.once('error',reject);test.once('exit',resolve);});
    if(code!==0)throw new Error('Local multiplayer test failed with exit '+code);
    const parentKey='synthetic-parent-key-for-local-tests';
    const host=await post('create',{parentKey});
    const guest=await post('join',{parentKey,roomId:host.roomId,inviteToken:host.inviteToken});
    const oldHost=await connect(host),oldGuest=await connect(guest);
    const before=await post('status',{roomId:host.roomId,sessionId:host.sessionId,sessionToken:host.sessionToken});
    assert.equal(before.players.filter(p=>p.connected).length,2);
    await stop(server);oldHost.ws.terminate();oldGuest.ws.terminate();
    server=start();await ready(server);
    const after=await post('status',{roomId:host.roomId,sessionId:host.sessionId,sessionToken:host.sessionToken});
    assert.equal(after.players.length,2);assert.equal(after.players.filter(p=>p.connected).length,0);
    const newHost=await connect(host),newGuest=await connect(guest);
    const resumed=await post('status',{roomId:host.roomId,sessionId:host.sessionId,sessionToken:host.sessionToken});
    assert.equal(resumed.players.filter(p=>p.connected).length,2);
    newHost.ws.terminate();newGuest.ws.terminate();
    console.log('PASS local SQLite room persistence, ghost-seat cleanup and both-seat reconnect after forced Worker process restart');
  }finally{await stop(server);}
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
