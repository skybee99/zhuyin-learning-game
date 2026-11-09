/* Original island geometry. Pure world coordinates; no DOM, storage or network. */
(function (root) {
  'use strict';
  const WIDTH = 1200, HEIGHT = 800, GRID = 40, RADIUS = 14;
  const bounds = Object.freeze({left:40, top:40, right:1160, bottom:760});
  const spawn = Object.freeze({x:620, y:420});
  const entrances = [
    {id:'village',label:'學習動物村',x:220,y:300,view:'cardsView',kind:'learning',objectId:'village'},
    {id:'carousel',label:'旋轉木馬',x:820,y:300,view:'ridesView',kind:'ride',objectId:'carousel'},
    {id:'coaster',label:'雲霄飛車',x:1020,y:300,view:'ridesView',kind:'ride',objectId:'coaster'},
    {id:'garden',label:'動物花園',x:1020,y:460,view:'collectionView',kind:'garden',objectId:'garden'}
  ];
  const obstacles = [
    {id:'village',x:140,y:120,w:180,h:120,kind:'house',label:'學習動物村',view:'cardsView',entrance:{x:220,y:300}},
    {id:'carousel',x:740,y:120,w:160,h:120,kind:'ride',label:'旋轉木馬',view:'ridesView',entrance:{x:820,y:300}},
    {id:'coaster',x:960,y:120,w:160,h:120,kind:'ride',label:'雲霄飛車',view:'ridesView',entrance:{x:1020,y:300}},
    {id:'garden',x:960,y:520,w:160,h:120,kind:'house',label:'動物花園',view:'collectionView',entrance:{x:1020,y:460}},
    {id:'pond',x:160,y:500,w:160,h:100,kind:'water',label:'水池'},
    {id:'tree-a',x:90,y:320,w:60,h:60,kind:'tree',label:'樹'},
    {id:'tree-b',x:620,y:610,w:60,h:60,kind:'tree',label:'樹'},
    {id:'tree-c',x:1100,y:360,w:60,h:60,kind:'tree',label:'樹'}
  ];
  const npcWaypoints = [
    {id:'rabbit',label:'小兔子',view:'cardsView',points:[{x:380,y:300},{x:420,y:300}]},
    {id:'owl',label:'貓頭鷹',view:'learnView',points:[{x:460,y:180},{x:500,y:180}]},
    {id:'fox',label:'小狐狸',view:'spellView',points:[{x:500,y:340},{x:540,y:340}]},
    {id:'panda',label:'小熊貓',view:'wordView',points:[{x:740,y:420},{x:780,y:420}]},
    {id:'dog',label:'小狗',view:'listenView',points:[{x:500,y:500},{x:540,y:500}]}
  ];
  // Occupancy uses a circular character footprint against each rectangular object.
  const finitePoint = p => !!p && Number.isFinite(p.x) && Number.isFinite(p.y);
  function isWalkable(x, y) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || x-RADIUS<bounds.left || x+RADIUS>bounds.right || y-RADIUS<bounds.top || y+RADIUS>bounds.bottom) return false;
    return !obstacles.some(o => {
      const nx=Math.max(o.x,Math.min(x,o.x+o.w)), ny=Math.max(o.y,Math.min(y,o.y+o.h));
      return (x-nx)**2+(y-ny)**2 <= RADIUS**2;
    });
  }
  const dist2=(a,b)=>(a.x-b.x)**2+(a.y-b.y)**2;
  // Sampling at no more than 4 units prevents sweeping through a thin obstacle.
  function lineClear(a,b) {
    const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/4));
    for(let i=0;i<=n;i++) if(!isWalkable(a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n)) return false;
    return true;
  }
  const cols=WIDTH/GRID, rows=HEIGHT/GRID;
  const point=(x,y)=>({x:x*GRID+GRID/2,y:y*GRID+GRID/2});
  function nearestGrid(p, requireLine) {
    let best=null,score=Infinity;
    for(let y=0;y<rows;y++) for(let x=0;x<cols;x++) {
      const q=point(x,y),d=dist2(p,q);
      if(d<score && isWalkable(q.x,q.y) && (!requireLine || lineClear(p,q))) { best={x,y,p:q};score=d; }
    }
    return best;
  }
  function safePosition(p) {
    if (!finitePoint(p)) return {...spawn};
    if (isWalkable(p.x,p.y)) return {x:p.x,y:p.y};
    // Clamp malicious or stale coordinates before finding a nearby valid grid point.
    const bounded={x:Math.max(bounds.left,Math.min(bounds.right,p.x)),y:Math.max(bounds.top,Math.min(bounds.bottom,p.y))};
    return nearestGrid(bounded,false)?.p || {...spawn};
  }
  function move(p, dx, dy) {
    let pos=safePosition(p);
    if (!Number.isFinite(dx)||!Number.isFinite(dy)) return pos;
    dx=Math.max(-WIDTH*2,Math.min(WIDTH*2,dx));dy=Math.max(-HEIGHT*2,Math.min(HEIGHT*2,dy));
    const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/4)), sx=dx/steps, sy=dy/steps;
    for(let i=0;i<steps;i++) {
      if(isWalkable(pos.x+sx,pos.y)) pos.x+=sx;
      if(isWalkable(pos.x,pos.y+sy)) pos.y+=sy;
    }
    return pos;
  }
  function findPath(from, to) {
    if (!finitePoint(from)||!finitePoint(to)) return [];
    const a=safePosition(from),b=safePosition(to);
    if (lineClear(a,b)) return dist2(a,b)<1e-10 ? [] : [b];
    const start=nearestGrid(a,true),goal=nearestGrid(b,true);
    if (!start||!goal) return [];
    const key=(x,y)=>y*cols+x, startKey=key(start.x,start.y), goalKey=key(goal.x,goal.y);
    const h=(x,y)=>{const dx=Math.abs(x-goal.x),dy=Math.abs(y-goal.y);return Math.max(dx,dy)+(Math.SQRT2-1)*Math.min(dx,dy);};
    const queue=[{x:start.x,y:start.y,g:0,f:h(start.x,start.y)}],cost=new Map([[startKey,0]]),prev=new Map();
    const dirs=[[1,0],[0,1],[-1,0],[0,-1],[1,1],[-1,1],[-1,-1],[1,-1]];
    let found=false;
    while(queue.length) {
      queue.sort((u,v)=>u.f-v.f||u.g-v.g||u.y-v.y||u.x-v.x);
      const u=queue.shift(),uk=key(u.x,u.y); if(u.g!==cost.get(uk))continue;
      if(uk===goalKey){found=true;break;}
      for(const [dx,dy] of dirs){const x=u.x+dx,y=u.y+dy;if(x<0||y<0||x>=cols||y>=rows)continue;
        const p=point(x,y),up=point(u.x,u.y);if(!isWalkable(p.x,p.y))continue;
        if(dx&&dy){const p1=point(u.x+dx,u.y),p2=point(u.x,u.y+dy);if(!isWalkable(p1.x,p1.y)||!isWalkable(p2.x,p2.y))continue;}
        if(!lineClear(up,p))continue;
        const k=key(x,y),g=u.g+(dx&&dy?Math.SQRT2:1);if(g >= (cost.get(k)??Infinity)-1e-10)continue;
        cost.set(k,g);prev.set(k,uk);queue.push({x,y,g,f:g+h(x,y)});
      }
    }
    if(!found)return [];
    const path=[];for(let k=goalKey;;k=prev.get(k)){path.push(point(k%cols,Math.floor(k/cols)));if(k===startKey)break;}
    path.reverse();
    if(dist2(a,path[0])<1e-10)path.shift();
    if(!path.length || dist2(path[path.length-1],b)>1e-10)path.push(b);
    return path;
  }
  const api=Object.freeze({WIDTH,HEIGHT,GRID,RADIUS,bounds,spawn,obstacles,entrances,npcWaypoints,isWalkable,move,findPath,safePosition});
  root.IslandWorld=api;
  if(typeof module==='object'&&module.exports)module.exports=api;
})(globalThis);
