import test from 'node:test';
import assert from 'node:assert/strict';
import {createLabMission,createLabMap,LAB_POLICY,LAB_TILE} from '../public/js/engine/rpg-lab-mission.js';
import {securityAt} from '../public/js/engine/area-policy.js';

test('lab uses actual native 32px Ghost Signal mission API and exactly four-cardinal traversal',()=>{
  const m=createLabMission(),map=m.buildMap();
  assert.equal(LAB_TILE,32);
  assert.deepEqual({w:map.w,h:map.h},{w:28,h:17});
  assert.equal(map.grid.length,map.w*map.h);
  assert.equal(map.grid[Math.floor(m.start.y/32)*map.w+Math.floor(m.start.x/32)],2);
  for(const fn of ['buildMap','entities','onStart','update','onScan','label','interact','objectives','objective','doorOpen','blocked'])
    assert.equal(typeof m[fn],'function',fn);
  assert.ok(m.drones[0].zone && m.drones[0].waypoints.length>=4);
  for(const [x,y] of m.drones[0].waypoints)
    assert.equal(map.grid[y*map.w+x],2,'Sentry waypoint must be traversable floor');
});

test('safe staging, security perimeter and authored encounter policy have exact edges',()=>{
  assert.equal(securityAt(LAB_POLICY,14*32,8*32).mode,'normal');
  assert.equal(securityAt(LAB_POLICY,15*32,8*32).mode,'stealth');
  assert.equal(securityAt(LAB_POLICY,26*32,8*32).mode,'normal');
  assert.equal(securityAt(LAB_POLICY,15*32,14*32).mode,'normal');
  assert.equal(securityAt(LAB_POLICY,16*32,6*32).onDetection,'encounter');
});

test('staging, salvage, optional security relay and hiding alcove remain reachable',()=>{
  const m=createLabMission(),map=createLabMap(),solids=new Set();
  for(const p of m.props)if(p.solid)
    for(let y=p.y;y<p.y+(p.h||1);y++)for(let x=p.x;x<p.x+(p.w||1);x++)solids.add(y*map.w+x);
  for(const e of m.entities())if(e.solid)solids.add(e.ty*map.w+e.tx);
  const start=[Math.floor(m.start.x/32),Math.floor(m.start.y/32)],seen=new Set([start[1]*map.w+start[0]]),q=[start];
  for(let i=0;i<q.length;i++)for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]){
    const nx=q[i][0]+dx,ny=q[i][1]+dy,k=ny*map.w+nx;
    if(nx<0||ny<0||nx>=map.w||ny>=map.h||seen.has(k)||map.grid[k]!==2||solids.has(k))continue;
    seen.add(k);q.push([nx,ny]);
  }
  for(const id of ['archive','salvage','recharge','alcove','relay']){
    const e=m.entities().find(e=>e.id===id);
    assert.ok(e,id+' missing');
    assert.ok([[0,0],[-1,0],[1,0],[0,-1],[0,1]].some(([dx,dy])=>seen.has((e.ty+dy)*map.w+(e.tx+dx))),
      id+' is unreachable for player interaction');
  }
});

test('mission hooks preserve authored objective flow without adding canonical content',()=>{
  const observed=[],m=createLabMission({
    onUpdate:(g,dt)=>observed.push(['update',dt]),
    onInteract:(e)=>observed.push(['interact',e.id])
  });
  const game={flags:{},toast(){},player:{},touchMode(){return false;}};
  m.onStart(game);m.update(game,.02);m.interact({id:'archive'},game);
  assert.equal(m.objectives(game)[0].done,false);
  game.flags.labArchive=true;game.flags.labEntered=true;game.flags.labResolved=true;
  assert.ok(m.objectives(game).every(e=>e.done || /salvage/i.test(e.t)));
  assert.match(m.ending().title,/TEST SECTOR/);
  assert.deepEqual(observed,[['update',.02],['interact','archive']]);
});

test('lamps sit on perimeter walls and props do not block sentry patrol or main lane',()=>{
  const m=createLabMission(),map=createLabMap();
  for(const l of m.lamps){
    assert.ok(l.x>=0&&l.y>=0&&l.x<map.w&&l.y<map.h,'Lamp out of bounds');
    assert.equal(map.grid[l.y*map.w+l.x],1,'Lamp at ('+l.x+','+l.y+') must sit on wall perimeter, not floor');
  }
  const solids=new Set();
  for(const p of m.props){
    assert.ok(p.x>=0&&p.y>=0&&p.x+(p.w||1)<=map.w&&p.y+(p.h||1)<=map.h,'Prop out of bounds');
    if(p.solid)
      for(let y=p.y;y<p.y+(p.h||1);y++)for(let x=p.x;x<p.x+(p.w||1);x++){
        assert.equal(map.grid[y*map.w+x],2,'Solid prop at ('+x+','+y+') must be on floor');
        solids.add(y*map.w+x);
      }
  }
  const [sx,sy]=[Math.floor(m.start.x/LAB_TILE),Math.floor(m.start.y/LAB_TILE)];
  assert.equal(solids.has(sy*map.w+sx),false,'Start tile must stay unobstructed');
  for(let x=sx;x<=20;x++)
    assert.equal(solids.has(9*map.w+x),false,'Direct east corridor lane at y=9 must stay clear');
  for(const [wx,wy] of [m.drones[0].start,...m.drones[0].waypoints])
    assert.equal(solids.has(wy*map.w+wx),false,'Sentry waypoint ('+wx+','+wy+') must stay unobstructed');
});

test('objective readout tracks progress cleanly and relay prompt hides after disable',()=>{
  const m=createLabMission();
  const relay=m.entities().find(e=>e.id==='relay');
  const g={flags:{}};
  assert.match(m.objective(g),/archive/i);
  assert.equal(m.label(relay,g),'DISABLE SECURITY RELAY');
  g.flags.labEntered=true;
  assert.match(m.objective(g),/alcove|relay|sentry|scan/i);
  g.flags.labRelay=true;g.flags.labResolved=true;
  assert.equal(m.label(relay,g),null);
  assert.match(m.objective(g),/complete/i);
});

