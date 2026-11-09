const assert=require('node:assert/strict');
const W=require('../public/src/island-world.js');
const valid=p=>W.isWalkable(p.x,p.y);
function clear(a,b) { const d=Math.hypot(b.x-a.x,b.y-a.y), n=Math.max(1,Math.ceil(d/2)); for(let i=0;i<=n;i++) assert(valid({x:a.x+(b.x-a.x)*i/n,y:a.y+(b.y-a.y)*i/n}),`unsafe path segment ${JSON.stringify([a,b])}`); }
assert.deepEqual([W.WIDTH,W.HEIGHT,W.GRID,W.RADIUS],[1200,800,40,14]);
assert(valid(W.spawn));
for(const p of [null,{}, {x:NaN,y:100},{x:Infinity,y:4},{x:-1e100,y:1e100}])assert(valid(W.safePosition(p)));
assert(!W.isWalkable(0,0)); assert(!W.isWalkable(1190,790));
for(const o of W.obstacles) {
  assert(!W.isWalkable(o.x+o.w/2,o.y+o.h/2),o.id);
  const recovered=W.safePosition({x:o.x+o.w/2,y:o.y+o.h/2}); assert(valid(recovered),o.id);
}
const blocked=W.move({x:220,y:300},0,-250); assert(valid(blocked)); assert(blocked.y>=254,'must not tunnel through the house');
const water=W.move({x:380,y:540},-500,0); assert(valid(water));assert(water.x>=334,'must not tunnel through water');
const edge=W.move(W.spawn,100000,-100000);assert(valid(edge));
assert.deepEqual(W.move(W.spawn,NaN,2),W.spawn);
for(const target of W.entrances) {
  assert(valid(target),target.id); assert(target.label&&target.view&&target.objectId);
  const p=W.findPath(W.spawn,target);assert(p.length,target.id);let prev=W.spawn;
  for(const next of p){clear(prev,next);prev=next}assert.deepEqual(prev,{x:target.x,y:target.y});
  assert.deepEqual(W.findPath(W.spawn,target),p,'path must be deterministic');
}
const route=W.findPath({x:220,y:300},{x:220,y:60});assert(route.length>2,'path must go around house');
let prev={x:220,y:300};for(const next of route){clear(prev,next);
 const dx=next.x-prev.x,dy=next.y-prev.y;
 if(Math.abs(dx)===40&&Math.abs(dy)===40){assert(valid({x:prev.x+dx,y:prev.y}));assert(valid({x:prev.x,y:prev.y+dy}));}
 prev=next;
}
for(const npc of W.npcWaypoints){assert(npc.id&&npc.view&&npc.points.length>=2);for(const p of npc.points)assert(valid(p),npc.id);for(let i=1;i<npc.points.length;i++)clear(npc.points[i-1],npc.points[i]);assert(!W.obstacles.some(o=>o.id===npc.id),'NPC must not block navigation');}
assert.deepEqual(W.findPath({x:NaN,y:1},W.spawn),[]);
assert.deepEqual(W.findPath(W.spawn,W.spawn),[]);
console.log('PASS island boundaries, swept movement, obstacles, safe restore, deterministic A*, entrances and nonblocking NPC waypoints');
