'use strict';
const assert=require('node:assert/strict');const THREE=require('three');const rides=require('../public/src/island-rides-3d.js');
assert.deepEqual(Object.keys(rides.RIDES),['carousel','coaster','ferris','bumper','pirate','train']);
for(const id of Object.keys(rides.RIDES)){
 const m=rides.makeScene(THREE,id,{participantCount:1});let meshes=0;m.scene.traverse(o=>{if(o.isMesh)meshes++});assert(meshes>15,id+' needs real geometry');assert(m.camera.isPerspectiveCamera);assert(m.actors.length>=3);assert.equal(m.actors.filter(a=>a.g.visible).length,1);
 const transforms=()=>{const list=[];m.scene.updateMatrixWorld(true);m.scene.traverse(o=>{if(o.isMesh)list.push(...o.matrixWorld.elements)});return list};
 const before=transforms();m.animate(2,1);const after=transforms();assert.notDeepEqual(after,before,id+' has motion');
 m.setSeat(1);m.setColor(1);m.animate(3,.25);
 if(id==='bumper'){for(let i=0;i<100;i++)m.move(1,1,.05);const p=m.move(0,0,0);assert(Math.abs(p.x)<=1&&Math.abs(p.z)<=1);m.peer(1,{x:.5,z:-.5});}
 const group=rides.makeScene(THREE,id,{participantCount:3});assert.equal(group.actors.filter(a=>a.g.visible).length,3);
 console.log('PASS',id,'3D geometry, motion, seats, reduced movement');
}
assert.throws(()=>rides.makeScene(THREE,'invalid'));

for(let i=0;i<3;i++){const m=rides.makeScene(THREE,'bumper',{participantCount:3,isGroup:true,selfIndex:i});const before=m.carState();assert.equal(before[0].x,[-.4,0,.4][i]);assert(before[1].remote&&before[2].remote);m.animate(3,1);assert.deepEqual(m.carState().slice(1),before.slice(1),'remote cars must not run NPC motion');const moved=m.move(0,1,.1);assert.notEqual(moved.z,0);}
console.log('PASS bumper canonical group spawns and non-NPC peers');

const styles=[{hair:'short',color:'#ee8f83',accessory:'none'},{hair:'bob',color:'#7cbad0',accessory:'bow'},{hair:'tuft',color:'#a591c4',accessory:'star'}];
for (const type of Object.keys(rides.RIDES)) {
  let reference;
  for (let selfIndex=0;selfIndex<3;selfIndex++) {
    const model=rides.makeScene(THREE,type,{participantCount:3,isGroup:true,selfIndex,appearances:styles});
    model.animate(1,1);
    model.scene.updateMatrixWorld(true);
    const seats=model.actors.map(({g})=>({slot:g.userData.seatIndex,appearance:g.userData.appearance,
      position:g.getWorldPosition(new THREE.Vector3()).toArray().map(v=>Math.round(v*10000))})).sort((a,b)=>a.slot-b.slot);
    assert.deepEqual(seats.map(({appearance})=>appearance),styles);
    if (reference) assert.deepEqual(seats,reference,type+' seat mapping must match on each peer');
    else reference=seats;
  }
}
assert.deepEqual(rides.safeAppearance({hair:'bad',color:'url(injected)',accessory:'bad'}),styles[0]);
assert.equal(rides.timelineStep(1000,5000,.1,false),1200);
assert.equal(rides.timelineStep(1000,5000,.1,true),1100);
assert.equal(rides.timelineStep(2000,1500,.1,false),2000);
console.log('PASS shared ride seat consistency, anonymous appearance allowlist and bounded timing catch-up');

{const m=rides.makeScene(THREE,'bumper',{participantCount:3,isGroup:true,selfIndex:0});for(let i=0;i<200;i++)m.move(1,0,.05);const [a,b]=m.carState();assert(Math.hypot((a.x-b.x)*5,(a.z-b.z)*4)>=1.299,'player car should stop at soft collision distance');assert(a.x<-.25,'car should not pass through peer');console.log('PASS bumper soft collision stops crossing remote car');}
