/* Original procedural low-poly ride scenes; all ticket operations use TicketLedger. */
(function (root) {
  'use strict';
  const RIDES = Object.freeze({
    carousel:{label:'旋轉木馬',duration:19000}, coaster:{label:'雲霄飛車',duration:22000},
    ferris:{label:'摩天輪',duration:25000}, bumper:{label:'碰碰車',duration:25000},
    pirate:{label:'海盜船',duration:21000}, train:{label:'環島小火車',duration:30000}
  });
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const allowedHair=['short','bob','tuft'], allowedColors=['#ee8f83','#7cbad0','#a591c4','#e8b95e'], allowedAccessory=['none','bow','star'];
  function safeAppearance(a){return {hair:allowedHair.includes(a?.hair)?a.hair:'short',color:allowedColors.includes(a?.color)?a.color:allowedColors[0],accessory:allowedAccessory.includes(a?.accessory)?a.accessory:'none'};}
  // Catch up at no more than twice normal speed after a local pause; reduced motion stays at normal speed.
  function timelineStep(elapsed,target,dt,reduced){const advance=Math.max(0,dt)*1000;return elapsed+Math.min(Math.max(0,target-elapsed),advance*(reduced?1:2));}
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function makeScene(T,type,options={}) {
    if(!RIDES[type])throw new Error('未知設施');
    const scene=new T.Scene();scene.background=new T.Color(0xbbe8ec);
    const camera=new T.PerspectiveCamera(40,1,.1,180);camera.position.set(11,11,16);camera.lookAt(0,2,0);
    scene.add(new T.HemisphereLight(0xffffff,0x70916f,2));const sun=new T.DirectionalLight(0xfff2dc,2);sun.position.set(4,12,5);scene.add(sun);
    const mat=(color)=>new T.MeshStandardMaterial({color,roughness:.85});
    const box=(w,h,d,color,x=0,y=0,z=0,parent=scene)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat(color));m.position.set(x,y,z);parent.add(m);return m;};
    const cyl=(r1,r2,h,color,x=0,y=0,z=0,parent=scene)=>{const m=new T.Mesh(new T.CylinderGeometry(r1,r2,h,12),mat(color));m.position.set(x,y,z);parent.add(m);return m;};
    const sphere=(r,color,x,y,z,parent=scene)=>{const m=new T.Mesh(new T.SphereGeometry(r,10,7),mat(color));m.position.set(x,y,z);parent.add(m);return m;};
    box(23,.3,18,0x88c985,0,-.3,0);for(let i=0;i<8;i++){const a=i*Math.PI/4;const x=Math.cos(a)*9,z=Math.sin(a)*7; cyl(.22,.32,1.3,0x89674e,x,.65,z);sphere(.85,0x69aa70,x,1.8,z);}
    const actors=[], animalHeads=[];const participantCount=clamp(Number(options.participantCount)||1,1,3);const selfIndex=Number.isInteger(options.selfIndex)?clamp(options.selfIndex,0,participantCount-1):0;
    function actor(parent,x,y,z,color=0xe58c87){const g=new T.Group();parent.add(g);g.position.set(x,y,z);box(.45,.55,.28,color,0,.35,0,g);sphere(.27,0xffdbb8,0,.85,0,g);const arm=box(.15,.45,.15,0xffdbb8,.33,.45,0,g);actors.push({g,arm});return g;}
    const rootGroup=new T.Group();scene.add(rootGroup);let animate=()=>{},peer=()=>{},move=()=>{},carState=()=>[];
    if(type==='carousel'){
      cyl(4.5,4.5,.35,0xe7ac7c,0,.15,0);cyl(.2,.2,4.7,0xc78e5f,0,2.4,0);const top=cyl(.3,4.9,1.4,0xef9b88,0,5.2,0);top.rotation.y=Math.PI/12;
      const ring=new T.Group();ring.position.y=.4;scene.add(ring);const horses=[];
      for(let i=0;i<6;i++){const a=i*Math.PI/3,g=new T.Group();g.position.set(Math.cos(a)*3,0,Math.sin(a)*3);ring.add(g);cyl(.06,.06,4.2,0xf4d18b,0,2.1,0,g);box(.8,.45,.35,0xffffff,0,1.1,0,g);const head=sphere(.3,0xfff5e3,.4,1.45,0,g);const ear1=sphere(.13,0xfff5e3,.35,1.72,.16,g),ear2=sphere(.13,0xfff5e3,.35,1.72,-.16,g);animalHeads.push({head,ear1,ear2});if(i<3)actor(g,0,1.3,0,[0xe58c87,0x83b5cf,0xb89bd2][i]);horses.push(g);}
      animate=(t,m)=>{ring.rotation.y=t*.7;horses.forEach((g,i)=>g.position.y=.2+Math.sin(t*2+i)*(.18*m));};
    } else if(type==='ferris'){
      box(.35,6,.35,0x9c806c,-.5,3,0);box(.35,6,.35,0x9c806c,.5,3,0);const wheel=new T.Group();wheel.position.y=6;scene.add(wheel);
      const torus=new T.Mesh(new T.TorusGeometry(4,.12,8,24),mat(0xe99d80));wheel.add(torus);const pods=[];
      for(let i=0;i<8;i++){const a=i*Math.PI/4;const spoke=box(.12,4,.12,0xffdf9b,Math.cos(a)*2,Math.sin(a)*2,0,wheel);spoke.rotation.z=a-Math.PI/2;const pod=new T.Group();pod.position.set(Math.cos(a)*4,Math.sin(a)*4,0);wheel.add(pod);box(1,.25,.8,0x82bdd0,0,-.55,0,pod);box(.12,.8,.12,0xffffff,-.42,-.1,0,pod);box(.12,.8,.12,0xffffff,.42,-.1,0,pod);if(i<3)actor(pod,0,-.4,0,[0xe58c87,0x83b5cf,0xb89bd2][i]);pods.push(pod);}
      animate=t=>{wheel.rotation.z=t*.2;pods.forEach(p=>p.rotation.z=-wheel.rotation.z);camera.position.set(12,11+Math.sin(t*.2)*2,16);camera.lookAt(0,4,0);};
    } else if(type==='pirate'){
      const pivot=new T.Group();pivot.position.y=5;scene.add(pivot);for(const x of [-2.7,2.7]){const leg=box(.25,5.8,.25,0xb88a63,x,2.9,0);leg.rotation.z=x<0?-.15:.15;}
      for(const x of [-2.4,2.4])box(.12,4,.12,0xe9cb99,x,-2,0,pivot);box(5,.8,1.5,0x995e4d,0,-4,0,pivot);box(4,.2,1.1,0xe7b97e,0,-3.45,0,pivot);for(let i=0;i<3;i++)actor(pivot,-1.2+i*1.2,-3.4,0,[0xe58c87,0x83b5cf,0xb89bd2][i]);
      animate=(t,m)=>{pivot.rotation.z=Math.sin(t*1.1)*.38*m;};
    } else if(type==='bumper'){
      box(12,.25,10,0xd8ccae,0,0,0);for(const [x,z,w,d] of [[0,-5,12,.2],[0,5,12,.2],[-6,0,.2,10],[6,0,.2,10]])box(w,.45,d,0xefb99b,x,.35,z);
      const cars=[],slots=[selfIndex,...[0,1,2].filter(i=>i!==selfIndex)];for(let i=0;i<3;i++){const car=new T.Group();scene.add(car);car.position.set(-2+slots[i]*2,.3,0);car.userData.remote=!!options.isGroup&&i>0&&i<participantCount;box(1.3,.4,1, [0xe99287,0x81bcd0,0xe6c46e][i],0,.2,0,car);actor(car,0,.35,0,[0xe58c87,0x83b5cf,0xb89bd2][i]);cars.push(car);}
      carState=()=>cars.map(c=>({x:c.position.x/5,z:c.position.z/4,remote:!!c.userData.remote}));
      const velocity={x:0,z:0};move=(dx,dz,dt)=>{velocity.x=dx;velocity.z=dz;cars[0].position.x=clamp(cars[0].position.x+dx*dt*2,-5,5);cars[0].position.z=clamp(cars[0].position.z+dz*dt*2,-4,4);for(const other of cars.slice(1)){let x=cars[0].position.x-other.position.x,z=cars[0].position.z-other.position.z,d=Math.hypot(x,z);if(d<1.3){if(d<.001){x=1;z=0;d=1;}cars[0].position.x=clamp(other.position.x+x/d*1.3,-5,5);cars[0].position.z=clamp(other.position.z+z/d*1.3,-4,4);}}if(dx||dz)cars[0].rotation.y=Math.atan2(dx,dz);return {x:cars[0].position.x/5,z:cars[0].position.z/4};};
      peer=(i,p)=>{const c=cars[i];if(c&&p){c.userData.remote=true;c.position.x=clamp(p.x,-1,1)*5;c.position.z=clamp(p.z,-1,1)*4;}};
      animate=t=>{for(let i=1;i<3;i++)if(!cars[i].userData.remote){cars[i].position.x=Math.cos(t*.4+i*2)*3;cars[i].position.z=Math.sin(t*.4+i*2)*2.5;}};
    } else {
      const train=type==='train', radius=train?6:5;
      const curve=new T.CatmullRomCurve3(Array.from({length:24},(_,i)=>{const a=i*Math.PI*2/24;return new T.Vector3(Math.cos(a)*radius,train?.35:1.5+1.1*Math.sin(a*2),Math.sin(a)*(train?4:4.5));}),true);
      const track=new T.Mesh(new T.TubeGeometry(curve,96,.08,6,true),mat(train?0x9b745b:0xc78266));scene.add(track);
      const cars=[];const count=train?3:1;for(let i=0;i<count;i++){const g=new T.Group();scene.add(g);box(train?1.5:1.8,.65,1,train?0xc77d68:0x7eb9cf,0,.5,0,g);for(let j=0;j<(train?1:3);j++)actor(g,(j-1)*.5,.8,0,[0xe58c87,0x83b5cf,0xb89bd2][train?i:j]);cars.push(g);}
      animate=t=>{cars.forEach((car,i)=>{let u=((t/(train?30:22))-i*.035)%1;if(u<0)u+=1;const p=curve.getPointAt(u),tan=curve.getTangentAt(u);car.position.copy(p);car.rotation.y=Math.atan2(tan.x,tan.z);});if(!train){const p=cars[0].position;camera.position.set(p.x+10,8,p.z+12);camera.lookAt(p.x,2,p.z);}};
    }
    // Seat order is the server participant order; actor 0 is this device's player.
    const orderedSlots=[selfIndex,...Array.from({length:participantCount},(_,i)=>i).filter(i=>i!==selfIndex)];
    const originalSlots=actors.map(a=>({parent:a.g.parent,position:a.g.position.clone()}));
    if(options.isGroup&&type!=='bumper')actors.slice(0,participantCount).forEach((a,i)=>{const slot=originalSlots[orderedSlots[i]];slot.parent.add(a.g);a.g.position.copy(slot.position);});
    actors.forEach((a,i)=>{a.g.visible=i<participantCount;a.g.userData.seatIndex=orderedSlots[i]??i;});
    const appearances=Array.isArray(options.appearances)?options.appearances:[];
    actors.slice(0,participantCount).forEach((a,i)=>{const ap=safeAppearance(appearances[orderedSlots[i]]);a.g.userData.appearance=ap;
      a.g.children[0]?.material?.color?.set(ap.color);
      const hair=sphere(.27,0x4a3840,0,1.03,-.035,a.g);hair.scale.set(1,ap.hair==='bob'?.6:.35,.95);
      if(ap.hair==='tuft')sphere(.1,0x4a3840,.12,1.2,0,a.g);
      if(ap.accessory!=='none')sphere(.09,ap.accessory==='star'?0xffd15a:0xf48da6,.18,1.18,0,a.g);
    });
    animate(.15,1);
    function setSeat(index){const target=actors[index];if(!target||!actors[0])return;const a=actors[0].g,parent=target.g.parent,pos=target.g.position.clone();parent.add(a);a.position.copy(pos);}
    function setAnimal(kind){const colors={rabbit:0xfff5e3,bear:0xd5a579,frog:0x91cb83,cat:0xecc78d};if(!Object.hasOwn(colors,kind))return;animalHeads.forEach(a=>{for(const part of [a.head,a.ear1,a.ear2])part.material.color.set(colors[kind]);a.ear1.scale.y=a.ear2.scale.y=kind==='rabbit'?2:1;});}
    function setColor(index){const body=actors[0]?.g.children[0];if(body?.material?.color)body.material.color.set([0xe58c87,0x83b5cf,0xe8b95e][index]??0xe58c87);}
    return {scene,camera,animate,move,peer,actors,setSeat,setColor,setAnimal,carState};
  }
  function open(options) {
    const {type,container,childId,ledger,group}=options||{}, cfg=RIDES[type],T=root.THREE;
    if(!cfg||!container||!T||!ledger||typeof childId!=='string')throw new Error('設施無法開啟');
    if(group && (!group.operationId || !group.sessionRideId || !Number.isFinite(group.startsAt)))throw new Error('多人設施資料不完整');
    const members=group&&Array.isArray(group.participants)?group.participants.slice(0,3):[];
    const memberIds=members.map(p=>typeof p==='string'?p:(p?.sessionId||p?.id));
    if(group&&(memberIds.length<2||memberIds.length>3||new Set(memberIds).size!==memberIds.length||memberIds.some(id=>typeof id!=='string'||!id)||!memberIds.includes(group.selfId)))throw new Error('多人座位資料不完整');
    const s={type,container,childId,ledger,group,closed:false,phase:'setup',elapsed:0,last:0,raf:0,reserved:false,started:false,paused:false,interrupted:false,operationId:group?.operationId||null, direction:{x:0,z:0}, peerIndex:new Map(),peerSent:0,station:'plaza',guide:null};
    let model,renderer;
    try {
      container.innerHTML=`<section class="ride3d" aria-label="${cfg.label}"><div class="ride3d-head"><h2>${cfg.label}</h2><button type="button" data-ride3d="close">返回島嶼</button></div><p class="ride3d-status" role="status">${group?'多人同乘已確認，正在準備。':'每次 1 張遊樂券。選好座位後確認開始。'}</p><div class="ride3d-canvas"></div><div class="ride3d-controls">${type==='carousel'?'<label>動物座位 <select data-ride3d-animal><option value="rabbit">兔子</option><option value="bear">小熊</option><option value="frog">青蛙</option><option value="cat">小貓</option></select></label>':''}<label>座位 <select data-ride3d-seat><option value="0">座位 1</option><option value="1">座位 2</option><option value="2">座位 3</option></select></label><label>顏色 <select data-ride3d-color><option value="0">珊瑚紅</option><option value="1">天空藍</option><option value="2">陽光黃</option></select></label>${type==='train'?'<label>下車站 <select data-ride3d-station><option value="plaza">中央廣場站</option><option value="village">學習村站</option><option value="garden">動物花園站</option></select></label>':''}${type==='ferris'?'<button type="button" data-ride3d="card">儲存無人物風景卡</button>':''}<label>音量 <input type="range" min="0" max="1" step="0.1" value="0.3" data-ride3d-volume></label><button type="button" data-ride3d="start">確認票價並開始 🎟️ 1 張</button><button type="button" data-ride3d="pause" hidden>暫停</button><button type="button" data-ride3d="wave" hidden>揮手</button><button type="button" data-ride3d="skip" hidden>跳過並結束</button><button type="button" data-ride3d="retry-complete" hidden>重新確認完成紀錄</button>${type==='bumper'?'<div class="ride3d-drive" aria-label="碰碰車方向控制"><button type="button" data-drive="up">↑</button><button type="button" data-drive="left">←</button><button type="button" data-drive="down">↓</button><button type="button" data-drive="right">→</button></div>':''}</div><p>慢慢玩；可暫停、跳過或返回。開始後不會自動再扣券。</p><p class="ride3d-stickers" aria-live="polite">紀念貼紙：讀取中</p></section>`;
      const canvasBox=container.querySelector('.ride3d-canvas');renderer=new T.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(root.devicePixelRatio||1,2));canvasBox.append(renderer.domElement);
      model=makeScene(T,type,{participantCount:group?members.length:1,isGroup:!!group,selfIndex:group?memberIds.indexOf(group.selfId):0,appearances:group?members.map(p=>typeof p==='object'?p.appearance:null):[options.appearance]});
      if(group){container.querySelector('[data-ride3d-seat]').disabled=true;container.querySelector('[data-ride3d-color]').disabled=true;}
      memberIds.filter(id=>id!==group?.selfId).slice(0,2).forEach((id,i)=>s.peerIndex.set(id,i+1));
      const resize=()=>{const w=Math.max(1,canvasBox.clientWidth),h=Math.max(1,canvasBox.clientHeight);renderer.setSize(w,h,false);model.camera.aspect=w/h;model.camera.updateProjectionMatrix();renderer.render(model.scene,model.camera);};
      s.resize=resize;s.observer=root.ResizeObserver?new ResizeObserver(resize):null;s.observer?.observe(canvasBox);root.addEventListener('resize',resize);resize();
    }catch(e){try{renderer?.dispose();}catch(_){}container.innerHTML='<p role="status">此裝置暫時無法顯示 3D 設施，請返回原來的島嶼。</p>';throw e;}
    const status=text=>{const e=container.querySelector('.ride3d-status');if(e)e.textContent=text;};
    const button=(action)=>container.querySelector(`[data-ride3d="${action}"]`);
    const toggle=()=>{const running=s.phase==='running';for(const x of ['pause','wave','skip'])button(x).hidden=!running;button('retry-complete').hidden=s.phase!=='complete-error';button('start').hidden=s.phase!=='setup'||!!group;button('start').disabled=s.phase!=='setup';button('close').disabled=s.phase==='completing';button('pause').textContent=s.paused?'繼續':'暫停';};
    function visible(){const box=renderer.domElement.getBoundingClientRect();return !s.closed&&!document.hidden&&renderer.domElement.isConnected&&box.width>0&&box.height>0&&box.bottom>0&&box.top<root.innerHeight;}
    function frame(){return new Promise((resolve,reject)=>{let timer;const id=root.requestAnimationFrame(()=>{clearTimeout(timer);if(visible())resolve();else reject(Error('畫面不可見'));});timer=setTimeout(()=>{root.cancelAnimationFrame(id);reject(Error('畫面逾時'));},3000);});}
    async function paint(){renderer.domElement.scrollIntoView({block:'nearest'});await frame();model.animate(.3,reduced()?0.25:1);renderer.render(model.scene,model.camera);await frame();}
    function reduced(){return !!options.settings?.reducedMotion||!!root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;}
    const stationNames={plaza:'中央廣場站',village:'學習村站',garden:'動物花園站'};
    function stopGuide(){if(s.guide){try{root.speechSynthesis?.cancel();}catch(_){}s.guide=null;}}
    function guide(text){if(options.settings?.soundOn===false||!root.SpeechSynthesisUtterance||!root.speechSynthesis)return;try{stopGuide();const u=new SpeechSynthesisUtterance(text);u.lang='zh-TW';s.guide=u;root.speechSynthesis.speak(u);}catch(_){}}
    async function refreshStickers(){try{const data=await ledger.get(childId),complete=new Set(Object.values(data.rides||{}).filter(r=>r.status==='completed'&&RIDES[r.ride]).map(r=>r.ride));const el=container.querySelector('.ride3d-stickers');if(el)el.textContent='紀念貼紙：'+(complete.size?[...complete].map(id=>RIDES[id].label+' ✿').join('、'):'完成設施後可收集');}catch(_){const el=container.querySelector('.ride3d-stickers');if(el)el.textContent='紀念貼紙目前無法讀取。';}}
    function saveScenicCard(){if(type!=='ferris')return;const values=model.actors.map(a=>a.g.visible);try{model.actors.forEach(a=>{a.g.visible=false;});renderer.render(model.scene,model.camera);const data=renderer.domElement.toDataURL('image/png');const link=document.createElement('a');link.href=data;link.download='island-scenic-card.png';link.click();status('已建立無人物風景卡。');}catch(_){status('風景卡無法儲存，請稍後再試。');}finally{model.actors.forEach((a,i)=>{a.g.visible=values[i];});renderer.render(model.scene,model.camera);}}
    function stopSound(){if(!s.sound)return;try{s.sound.osc.stop();s.sound.ctx.close();}catch(_){}s.sound=null;}
    function playSound(){if(s.sound||options.settings?.soundOn===false||options.settings?.rideSoundOn===false)return;try{const C=root.AudioContext||root.webkitAudioContext;if(!C)return;const ctx=new C(),osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.value=type==='train'?196:261.63;gain.gain.value=Number(container.querySelector('[data-ride3d-volume]').value)*.018;osc.connect(gain);gain.connect(ctx.destination);osc.start();s.sound={ctx,osc,gain};}catch(_){}}
    async function start(){
      if(s.phase!=='setup'||s.closed)return;s.phase='busy';toggle();status('正在準備設施…');
      try{
        s.operationId ||= root.crypto.randomUUID();
        const r=await ledger.reserveRide(childId,{operationId:s.operationId,ride:type,startPolicy:root.TicketLedger.PAINT_ACK_POLICY});
        if(r.reservation?.status!=='reserved'){if(!group&&r.reservation?.status==='refunded')s.operationId=null;throw Error('預留失敗');}s.reserved=true;
        if(s.closed||s.interrupted||document.hidden)throw Error('開始前中斷');
        if(group && group.startsAt>Date.now()){const wait=group.startsAt-Date.now();if(wait>15000)throw Error('多人開始時間過遠');await new Promise(resolve=>setTimeout(resolve,wait));}
        if(s.closed||s.interrupted||document.hidden)throw Error('開始前中斷');
        if(group&&type!=='bumper'&&Date.now()-group.startsAt>=cfg.duration-1000)throw Error('多人回合已接近結束');
        await paint();if(s.closed||s.interrupted||!visible())throw Error('開始前中斷');
        const ack=await ledger.markRidePainted(childId,s.operationId);if(ack.reservation?.phase!=='painted'||ack.reservation?.status!=='reserved')throw Error('畫面確認失敗');
        if(s.closed||s.interrupted||!visible())throw Error('開始前中斷');
        const begun=await ledger.startRide(childId,s.operationId);if(begun.reservation?.status!=='started')throw Error('開始失敗');
        s.started=true;s.reserved=false;if(s.closed){await ledger.completeRide(childId,s.operationId);return;}
        s.phase='running';if(group&&type!=='bumper')s.elapsed=clamp(Date.now()-group.startsAt,0,cfg.duration-1000);s.paused=!!s.interrupted||document.hidden;s.last=0;status(s.paused?'已暫停，返回後可繼續。':'旅程開始了！');toggle();if(!s.paused){playSound();s.raf=root.requestAnimationFrame(tick);}
      }catch(_){if(s.reserved&&!s.started){try{const cancelled=await ledger.cancelRide(childId,s.operationId);if(!group&&cancelled.reservation?.status==='refunded')s.operationId=null;}catch(_){/* Preserve operation id until refund is known; lease expiry may recover it. */}}s.reserved=false;if(!s.closed){s.phase='setup';status('無法開始，請確認遊樂券與畫面。');toggle();}}
      finally{options.onBalanceChange?.();}
    }
    async function finish(){if(s.phase!=='running'&&s.phase!=='complete-error')return;s.phase='completing';stopSound();root.cancelAnimationFrame(s.raf);s.raf=0;status('正在確認完成紀錄…');toggle();try{const pending=ledger.completeRide(childId,s.operationId);s.completion=pending;const result=await pending;if(result.reservation?.status!=='completed')throw Error('完成狀態未確認');s.phase='done';if(!s.closed){status(type==='train'?'抵達'+stationNames[s.station]+'！':'旅程完成！');if(type==='train')guide('小火車到站，歡迎來到'+stationNames[s.station]+'。');toggle();await refreshStickers();}}catch(_){s.phase='complete-error';if(!s.closed){status('完成紀錄尚未確認，請重新確認；不會再次扣券。');toggle();}}finally{options.onBalanceChange?.();}}
    function tick(now){s.raf=0;if(s.closed||s.paused||s.phase!=='running'||document.hidden)return;const dt=Math.min((now-(s.last||now))/1000,.05);s.last=now;s.elapsed=group&&type!=='bumper'?timelineStep(s.elapsed,Math.max(0,Date.now()-group.startsAt),dt,reduced()):s.elapsed+dt*1000;model.animate(s.elapsed/1000,reduced()?.25:1);if(type==='bumper'){const p=model.move(s.direction.x,s.direction.z,dt);if(group?.onBumperMove&&now-s.peerSent>100){s.peerSent=now;group.onBumperMove(p);}}renderer.render(model.scene,model.camera);if(s.elapsed>=cfg.duration)finish();else s.raf=root.requestAnimationFrame(tick);}
    container.addEventListener('change',e=>{if(s.phase!=='setup')return;if(e.target.matches('[data-ride3d-station]')&&Object.hasOwn(stationNames,e.target.value))s.station=e.target.value;if(e.target.matches('[data-ride3d-animal]'))model.setAnimal(e.target.value);if(e.target.matches('[data-ride3d-seat]'))model.setSeat(Number(e.target.value));if(e.target.matches('[data-ride3d-color]'))model.setColor(Number(e.target.value));renderer.render(model.scene,model.camera);});
    container.querySelector('[data-ride3d-volume]').addEventListener('input',e=>{if(s.sound)s.sound.gain.gain.value=Number(e.target.value)*.018;});
    const stopDrive=()=>{s.direction={x:0,z:0};};
    const dirs={up:{x:0,z:-1},down:{x:0,z:1},left:{x:-1,z:0},right:{x:1,z:0}};
    const keys={arrowup:'up',w:'up',arrowdown:'down',s:'down',arrowleft:'left',a:'left',arrowright:'right',d:'right'};
    const abort=new AbortController(),signal=abort.signal;s.abort=abort;
    container.addEventListener('click',e=>{const action=e.target.closest('[data-ride3d]')?.dataset.ride3d;if(action==='close')handle.close();if(action==='start')start();if(action==='card')saveScenicCard();if(action==='skip'||action==='retry-complete')finish();if(action==='wave'){model.actors.forEach(a=>a.arm.rotation.z=.8);status('向朋友揮揮手！');}if(action==='pause'&&s.phase==='running'){s.paused=!s.paused;s.last=0;toggle();if(s.paused){stopSound();root.cancelAnimationFrame(s.raf);s.raf=0;stopDrive();}else {playSound();s.raf=root.requestAnimationFrame(tick);}}}, {signal});
    container.addEventListener('pointerdown',e=>{const d=e.target.closest('[data-drive]');if(!d)return;e.preventDefault();s.direction={...dirs[d.dataset.drive]};d.setPointerCapture(e.pointerId);},{signal});
    container.addEventListener('pointerup',stopDrive,{signal});container.addEventListener('pointercancel',stopDrive,{signal});
    document.addEventListener('keydown',e=>{if(type!=='bumper'||s.phase!=='running'||e.target.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"])'))return;const k=keys[e.key.toLowerCase()];if(k){e.preventDefault();s.direction={...dirs[k]};}},{signal});
    document.addEventListener('keyup',e=>{if(keys[e.key.toLowerCase()])stopDrive();},{signal});
    document.addEventListener('visibilitychange',()=>{if(document.hidden){stopGuide();stopSound();s.interrupted=true;if(s.phase==='running'){s.paused=true;root.cancelAnimationFrame(s.raf);s.raf=0;stopDrive();toggle();status('旅程已暫停。');}}},{signal});
    renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();stopSound();s.interrupted=true;if(s.phase==='running'){s.paused=true;root.cancelAnimationFrame(s.raf);s.raf=0;toggle();}status('3D 畫面中斷，請返回島嶼。');},{signal});
    const handle={async close(){if(s.closed)return;s.closed=true;s.interrupted=true;stopGuide();stopSound();root.cancelAnimationFrame(s.raf);abort.abort();s.observer?.disconnect();root.removeEventListener('resize',s.resize);const arrived=s.phase==='done';let completed=arrived;model.scene.traverse(o=>{o.geometry?.dispose();if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());}});renderer.dispose();container.replaceChildren();if(s.reserved&&!s.started){try{await ledger.cancelRide(childId,s.operationId);}catch(_){}options.onBalanceChange?.();}else if(!completed&&s.completion){try{const result=await s.completion;completed=result.reservation?.status==='completed';}catch(_){} }options.onClose?.({type,completed,exitId:type==='train'&&arrived?s.station:type});},setBumperPeer(id,p){const i=s.peerIndex.get(id);if(type!=='bumper'||!i||!p||!Number.isFinite(p.x)||!Number.isFinite(p.z))return false;model.peer(i,p);return true;},getState(){return {type,phase:s.phase,elapsed:s.elapsed,operationId:s.operationId,paused:s.paused,sessionRideId:group?.sessionRideId||null};}};
    toggle();refreshStickers();if(type==='train')guide('環島小火車準備出發，會經過學習村和動物花園。');if(group)start();return handle;
  }
  root.IslandRides3D=Object.freeze({RIDES,open,makeScene,safeAppearance,timelineStep});
  if(typeof module==='object'&&module.exports)module.exports=root.IslandRides3D;
})(globalThis);
