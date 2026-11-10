'use strict';
// Bounded, synthetic Chrome measurement of the local 3D island. No production network or user profile.
// Usage: node scripts/measure-island-3d.cjs --seconds=900 --output=path.json [--port=49140]
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');
const os = require('node:os');
const { performance } = require('node:perf_hooks');
const root = path.resolve(__dirname, '..');
const readArg = (key, fallback) => process.argv.find(x => x.startsWith('--'+key+'='))?.slice(key.length+3) ?? fallback;
const seconds = Number(readArg('seconds', '900'));
const specifiedPort = readArg('port', '');
const output = path.resolve(readArg('output', `island-3d-measure-${new Date().toISOString().replace(/[:.]/g,'-')}.json`));
if (!Number.isFinite(seconds) || seconds < 1 || seconds > 86400 || (specifiedPort && (!/^\d+$/.test(specifiedPort) || +specifiedPort < 1024 || +specifiedPort > 65535))) {
  console.error('Invalid --seconds (1–86400) or --port (1024–65535).'); process.exit(2);
}
if (fs.existsSync(output)) { console.error('Output already exists; choose a new file.'); process.exit(2); }
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function freePort() {
  const server=net.createServer(); server.listen(0,'127.0.0.1'); await once(server,'listening');
  const port=server.address().port; await new Promise(resolve=>server.close(resolve)); return port;
}
function quantile(sorted,p) { if (!sorted.length) return null; const i=(sorted.length-1)*p,lo=Math.floor(i),hi=Math.ceil(i); return sorted[lo]+(sorted[hi]-sorted[lo])*(i-lo); }
async function main() {
  const result={schemaVersion:1,scope:'synthetic local headless Chrome; page requestAnimationFrame, not proven GPU presentation or Apple-device FPS',requestedSeconds:seconds,startedAt:new Date().toISOString(),status:'RUNNING',environment:{platform:process.platform,release:os.release(),architecture:process.arch,logicalCpuCount:os.cpus().length,totalMemoryBytes:os.totalmem(),viewport:{width:1280,height:900},deviceScaleFactor:1},errors:[],samples:[]};
  result.environment.selectedQuality='low';
  let server,browser,context,page,session,stop=false,stopReason=null;
  const interrupt=signal=>{stop=true;stopReason=signal;};
  process.once('SIGINT',()=>interrupt('SIGINT')); process.once('SIGTERM',()=>interrupt('SIGTERM'));
  try {
    const port=specifiedPort?Number(specifiedPort):await freePort();
    server=spawn(process.execPath,[path.join(root,'tests','serve-local.cjs')],{cwd:root,env:{...process.env,ZHUYIN_TEST_PORT:String(port)},stdio:['ignore','pipe','pipe'],windowsHide:true});
    let serverError='',serverReady=false;server.stderr.on('data',d=>{serverError=(serverError+d.toString()).slice(-2000)});server.stdout.on('data',d=>{if(d.toString().includes('Test server ready'))serverReady=true;});
    const origin=`http://127.0.0.1:${port}`,deadline=Date.now()+20000;
    while(Date.now()<deadline){if(server.exitCode!==null)throw Error('Static server exited: '+serverError);if(serverReady){try{const r=await fetch(origin+'/');if(r.ok)break;}catch(_){}}await pause(150);}
    if(Date.now()>=deadline)throw Error('Static server did not start');
    const chrome=process.env.CHROME_PATH || (process.platform==='win32'?'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe':undefined);
    if(chrome && !fs.existsSync(chrome)) throw Error('Chrome not found; set CHROME_PATH.');
    browser=await chromium.launch({headless:true,...(chrome?{executablePath:chrome}:{}),args:['--enable-unsafe-swiftshader']});
    result.environment.browserVersion=browser.version();
    context=await browser.newContext({viewport:result.environment.viewport,deviceScaleFactor:1});
    await context.addInitScript(()=>{
      const mon=window.__islandMeasure={running:false,intervals:[],last:0,contexts:0,loss:0,restored:0,draws:0,drawHooks:0,visibleChanges:[],canvasReplacements:0};
      document.addEventListener('visibilitychange',()=>mon.visibleChanges.push({time:performance.now(),state:document.visibilityState}));
      const original=HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext=function(type,...args){const ctx=original.call(this,type,...args);if(type==='webgl2'&&ctx&&!this.__measuredContext){this.__measuredContext=true;mon.contexts++;this.addEventListener('webglcontextlost',()=>mon.loss++);this.addEventListener('webglcontextrestored',()=>mon.restored++);}return ctx;};
      const proto=window.WebGL2RenderingContext?.prototype;
      if(proto) for(const name of ['drawArrays','drawElements','drawArraysInstanced','drawElementsInstanced']) { const fn=proto[name];if(typeof fn==='function')try{proto[name]=function(...a){if(mon.running)mon.draws++;return fn.apply(this,a)};if(proto[name]!==fn)mon.drawHooks++;}catch(_){} }
      window.__measureBegin=()=>{mon.running=true;mon.intervals=[];mon.last=0;mon.draws=0;mon.start=performance.now();mon.canvas=document.querySelector('.island3d-canvas');function tick(t){if(!mon.running)return;if(mon.last)mon.intervals.push(t-mon.last);mon.last=t;if(mon.canvas!==document.querySelector('.island3d-canvas')){mon.canvasReplacements++;mon.canvas=document.querySelector('.island3d-canvas');}requestAnimationFrame(tick);}requestAnimationFrame(tick);};
      window.__measureEnd=()=>{mon.running=false;return {intervals:mon.intervals,contexts:mon.contexts,contextLost:mon.loss,contextRestored:mon.restored,canvasReplacements:mon.canvasReplacements,canvasConnected:!!mon.canvas?.isConnected,drawCalls:mon.draws,drawHookCount:mon.drawHooks,visibilityChanges:mon.visibleChanges,documentVisibility:document.visibilityState,webgl2Available:!!mon.canvas?.getContext('webgl2'),elapsedPageMs:performance.now()-mon.start};};
    });
    page=await context.newPage();page.on('pageerror',e=>result.errors.push({kind:'pageerror',message:e.message}));page.on('console',m=>{if(m.type()==='error')result.errors.push({kind:'console',message:m.text().slice(0,500)});});
    await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
    const child=page.locator('[data-child="child-1"]');await child.click();
    await page.locator('#islandView [data-go="island3DView"]').click();
    await page.locator('.island3d-canvas').waitFor({state:'visible',timeout:20000});
    await page.locator('[data-3d-quality]').selectOption('low');
    await page.locator('.island3d-canvas').scrollIntoViewIfNeeded();
    session=await context.newCDPSession(page);await session.send('Performance.enable');
    result.environment.webgl=await page.locator('.island3d-canvas').evaluate(c=>{const gl=c.getContext('webgl2');return gl?{version:gl.getParameter(gl.VERSION),renderer:gl.getParameter(gl.RENDERER),drawingBufferWidth:gl.drawingBufferWidth,drawingBufferHeight:gl.drawingBufferHeight}:null;});
    if(!result.environment.webgl)throw Error('WebGL2 is unavailable');
    await page.evaluate(()=>window.__measureBegin());const begin=performance.now();let nextSample=begin;
    while(!stop&&performance.now()-begin<seconds*1000){
      const now=performance.now();if(now>=nextSample){const metrics=await session.send('Performance.getMetrics');const m=Object.fromEntries(metrics.metrics.map(x=>[x.name,x.value]));result.samples.push({elapsedSeconds:(now-begin)/1000,jsHeapUsedBytes:m.JSHeapUsedSize??null,jsHeapTotalBytes:m.JSHeapTotalSize??null,documents:m.Documents??null,nodes:m.Nodes??null});nextSample=now+10000;}
      await pause(Math.min(1000,Math.max(1,seconds*1000-(performance.now()-begin))));
    }
    result.elapsedSeconds=(performance.now()-begin)/1000;const pageData=await page.evaluate(()=>window.__measureEnd());const frame=pageData.intervals.filter(n=>Number.isFinite(n)&&n>0).sort((a,b)=>a-b);delete pageData.intervals;
    const median=quantile(frame,.5),p95=quantile(frame,.95),p99=quantile(frame,.99),max=frame.length?frame[frame.length-1]:null;
    result.frames={samples:frame.length,medianIntervalMs:median,p95IntervalMs:p95,p99IntervalMs:p99,maxIntervalMs:max,medianFps:median?1000/median:null,fpsAtP95Interval:p95?1000/p95:null,lowestIntervalDerivedFps:max?1000/max:null,definition:'Page rAF callback intervals; not independent display-present or measured GPU frame rate.'};
    result.renderer=pageData;result.status=stop?'INTERRUPTED':'COMPLETED';result.stopReason=stopReason;
  }catch(e){result.status=stop?'INTERRUPTED':'ERROR';result.stopReason=stopReason;result.errors.push({kind:'harness',message:e.message});}
  finally{
    result.finishedAt=new Date().toISOString();try{await session?.detach()}catch(_){}try{await context?.close()}catch(_){}try{await browser?.close()}catch(_){}if(server&&server.exitCode===null)server.kill();
    try{fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({status:result.status,output,elapsedSeconds:result.elapsedSeconds??null,frames:result.frames??null,contextLost:result.renderer?.contextLost??null,errors:result.errors.length},null,2));}catch(e){console.error('Could not write result:',e.message);process.exitCode=1;return;}
    if(result.status!=='COMPLETED')process.exitCode=1;
  }
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
