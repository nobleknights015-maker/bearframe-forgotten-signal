// Aeon Circuit side-view battle renderer: pure visual consumer of immutable rpg-combat states.
// The existing Ghost Signal renderer owns EXPLORATION; this canvas is battle-only.
// No third-party art or combat math. Until production sheets arrive, draw clearly marked
// schematic diagnostic units rather than pretending they are final character sprites.
import {BATTLE_VIEW,sideViewSlots,validateBattleArtManifest,battleAnimationFrame,sideViewPose,battleActionTimeline,battleClipDuration,battleSpriteBounds} from './rpg-sideview-layout.js';

const COL={bg:'#0b0d12',floor:'#20252b',wall:'#171c22',steel:'#46505a',red:'#ff3b30',
  text:'#dcd6d8',ally:'#a6c9d0',echo:'#91a8ae',foe:'#b26e6b',glow:'#f2bd75'};
const BIOME_PALETTE={
  stasis:{skyTop:'#08111c',skyBot:'#132638',wall:'#14212e',trim:'#2e556e',floor:'#192734',grid:'#223648',accent:'#72e0ee'},
  rootway:{skyTop:'#081412',skyBot:'#142d26',wall:'#12241f',trim:'#3d7252',floor:'#182a20',grid:'#233c2d',accent:'#82e896'},
  relay:{skyTop:'#0b101b',skyBot:'#1b263a',wall:'#161f2e',trim:'#4a607a',floor:'#1b2330',grid:'#263142',accent:'#92d6ea'},
  lantern:{skyTop:'#16121b',skyBot:'#2d2122',wall:'#241b1e',trim:'#8c663a',floor:'#252024',grid:'#362d30',accent:'#f8cb7c'},
  sky:{skyTop:'#12253e',skyBot:'#3b5e7c',wall:'#253d56',trim:'#7ea4c0',floor:'#293949',grid:'#384d62',accent:'#ffe2a8'},
  archive:{skyTop:'#090c18',skyBot:'#182038',wall:'#13182a',trim:'#52628c',floor:'#161c2d',grid:'#202840',accent:'#98bfff'},
  cathedral:{skyTop:'#0b0916',skyBot:'#221834',wall:'#181226',trim:'#7a528a',floor:'#191628',grid:'#27213d',accent:'#e2a8ff'}
};
const get=(battle,key)=>[...battle.party,...battle.enemies]
  .find(u=>u.side+':'+u.id===key);
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.max(0,Math.round(w)),Math.max(0,Math.round(h)));};
export function createSideViewBattleScene(manifest={},options={}) {
  const art=validateBattleArtManifest(manifest);
  const envName=options?.environment||'stasis';
  const pal=BIOME_PALETTE[envName]||BIOME_PALETTE.stasis;
  const canvas=document.createElement('canvas');
  canvas.id='rpg-sideview-field';canvas.width=BATTLE_VIEW.width;canvas.height=BATTLE_VIEW.height;
  canvas.setAttribute('role','img');
  canvas.setAttribute('aria-label','Side-view battle field: allies on the left, enemies on the right');
  canvas.setAttribute('data-testid','rpg-sideview-battle');
  canvas.style.cssText='display:block;max-width:100%;width:calc(var(--u) * 416);height:calc(var(--u) * 116);margin:auto;image-rendering:pixelated;border:calc(var(--u) * 1) solid #46505a;background:#0b0d12;flex-shrink:0';
  const c=canvas.getContext('2d',{alpha:false});
  c.imageSmoothingEnabled=false;
  const images={};
  for(const [key,spec] of Object.entries(art)){
    const img=new Image();images[key]={image:img,loaded:false};
    img.onload=()=>{images[key].loaded=img.naturalWidth>=spec.frameWidth*Math.max(...Object.values(spec.animations).map(x=>x.frames))&&
      img.naturalHeight>=spec.frameHeight*(Math.max(...Object.values(spec.animations).map(x=>x.row))+1);};
    img.onerror=()=>{images[key].loaded=false;};
    img.src=new URL('../../'+spec.src,import.meta.url).href;
  }
  let state=null,activeKey=null,cue=null,queue=[],started=performance.now(),isRunning=false,frameToken=null,terminalUntil=0;
  const lastHp=new Map(),popups=[];
  const poseClocks=new Map();
  function poseElapsed(key,pose,t,cueWhen=null){
    const prior=poseClocks.get(key);
    if(!prior||prior.pose!==pose||prior.cueWhen!==cueWhen){
      poseClocks.set(key,{pose,cueWhen,since:cueWhen===null?t:cueWhen});
    }
    return Math.max(0,t-poseClocks.get(key).since);
  }
  const elapsed=()=>Math.max(0,(performance.now()-started)/1000);
  function background(t) {
    if(typeof c.createLinearGradient==='function'){
      const sky=c.createLinearGradient(0,0,0,54);
      sky.addColorStop(0,pal.skyTop);sky.addColorStop(1,pal.skyBot);
      c.fillStyle=sky;c.fillRect(0,0,416,55);
    }else{
      rect(c,0,0,416,28,pal.skyTop);rect(c,0,28,416,27,pal.skyBot);
    }
    for(let x=0;x<416;x+=48){
      const bh=14+((x*7)%26);
      rect(c,x+4,50-bh,22,bh,pal.wall);
      rect(c,x+8,50-bh+4,12,2,pal.trim);
      if(envName==='lantern'||envName==='rootway'){
        rect(c,x+34,12,2,18,'#2c2420');
        rect(c,x+32,30,6,6,pal.accent);
      } else {
        rect(c,x+32,16,3,34,pal.trim);
      }
    }
    rect(c,0,49,416,3,pal.trim);
    rect(c,0,52,416,64,pal.floor);
    for(let y=58;y<116;y+=14){rect(c,0,y,416,1,pal.grid);}
    for(let x=0;x<416;x+=36){
      rect(c,x,53,1,63,pal.grid);
      if(envName==='rootway'&&x%72===0){rect(c,x+6,60,12,2,'#46885c');}
    }
    for(let i=0;i<14;i++){
      const mx=(i*31+Math.round(t*6*(i%2?1:-1))+416)%416;
      const my=(i*19+Math.round(Math.sin(t*1.5+i)*4)+52)%52;
      c.fillStyle=pal.accent;c.globalAlpha=.45+.35*Math.sin(t*2+i);
      c.fillRect(mx,my,1,1);
    }
    c.globalAlpha=1;
    rect(c,206,56,2,56,pal.trim);
    rect(c,3,4,410,1,COL.steel);
    rect(c,3,111,410,1,COL.steel);
    rect(c,4,13,34,1,pal.accent);
    rect(c,379,13,32,1,COL.red);
    if((t*3|0)%2===0){rect(c,206,7,2,2,pal.accent);}
    c.textAlign='center';
    c.font='6px monospace';c.fillStyle='#9eb2bf';
    c.fillText('ALLY LINE',104,14);c.fillText('HOSTILE LINE',328,14);
    c.fillStyle=pal.accent;
    c.fillText(`SECTOR // ${envName.toUpperCase()}`,208,13);
  }
  function schematic(slot,unit,t,pose,selected){
    const {x,y,side,index}=slot;
    const phase=Math.round(Math.sin(t*5+index)*1);
    let offset=0;
    if(['attack','ranged','overload'].includes(pose))offset=side==='party'?12:-12;
    if(pose==='hit')offset=(Math.floor(t*34)%2?2:-2);
    const X=x+offset,Y=y+phase;
    const isFoe=side==='enemy';
    const bright=isFoe?COL.foe:index===1?COL.echo:COL.ally;
    rect(c,X-16,Y-2,31,3,'#090b0d');
    c.save();
    c.translate(Math.round(X),Math.round(Y));
    if(isFoe)c.scale(-1,1);
    rect(c,-9,-34,20,17,'#101418');
    rect(c,-7,-46,15,13,bright);
    rect(c,-5,-43,10,5,'#101418');
    rect(c,1,-42,4,2,COL.red);
    rect(c,-12,-35,23,21,bright);
    rect(c,-7,-32,14,7,'#202a30');
    rect(c,-3,-29,8,3,isFoe?COL.red:'#b9e2eb');
    rect(c,-13,-34,4,18,'#71828d');
    rect(c,9,-34,4,18,'#71828d');
    if(['attack','ranged','overload'].includes(pose)){
      rect(c,10,-34,15,4,isFoe?'#f2bd75':'#dcd6d8');
      rect(c,22,-36,4,8,COL.red);
    } else if(pose==='guard'){
      rect(c,8,-37,11,24,'#8eabb2');rect(c,10,-34,6,18,'#3d555c');
    }
    rect(c,-9,-14,7,14,'#66737b');rect(c,3,-14,7,14,'#66737b');
    rect(c,-11,-3,10,3,'#222a30');rect(c,3,-3,10,3,'#222a30');
    if(unit.hp<=0){c.fillStyle='#0c0d10';c.globalAlpha=.6;c.fillRect(-14,-47,30,48);}
    c.restore();
    c.textAlign='center';c.font='6px monospace';c.fillStyle=selected?COL.red:COL.text;
    c.fillText((unit.name||unit.id).toUpperCase().slice(0,15),x,Math.min(115,y+8));
  }
  function sheet(slot,spec,unit,t,pose,selected){
    const record=images[slot.key];
    if(!record?.loaded)return false;
    const cueStart=cue&&!['idle','down','victory'].includes(pose)&&(cue.actor===slot.key||cue.target===slot.key)?
      cue.when+(pose==='hit'?cue.releaseAt:0):null;
    const actionTime=poseElapsed(slot.key,pose,t,cueStart);
    const frame=battleAnimationFrame(spec,pose,actionTime);
    const {width,height}=battleSpriteBounds(slot,spec);
    let nudge=0;
    const clearance=Math.max(0,Math.floor((slot.cellWidth-width)/2));
    if(['attack','ranged','overload'].includes(pose))nudge=(slot.side==='party'?1:-1)*Math.min(12,clearance);
    if(pose==='hit')nudge=(Math.floor(t*24)%2?1:-1)*Math.min(2,clearance);
    rect(c,Math.round(slot.x+nudge)-15,Math.round(slot.y)-3,30,4,'rgba(4,7,11,0.58)');
    if(unit.guard&&typeof c.strokeRect==='function'){
      c.strokeStyle='#72e0ee';c.lineWidth=1;
      c.strokeRect(Math.round(slot.x+nudge)-14,Math.round(slot.y)-height+2,28,height-4);
    }
    if(unit.chargeTarget&&typeof c.strokeRect==='function'){
      c.strokeStyle=(Math.floor(t*8)%2)?'#ff3b30':'#f2bd75';c.lineWidth=1;
      c.strokeRect(Math.round(slot.x+nudge)-17,Math.round(slot.y)-height,34,height);
    }
    c.save();
    c.translate(Math.round(slot.x+nudge),Math.round(slot.y));
    if(slot.side==='enemy')c.scale(-1,1);
    c.drawImage(record.image,frame.x,frame.y,frame.width,frame.height,
      -Math.floor(width/2),-height,width,height);
    c.restore();
    c.textAlign='center';c.font='6px monospace';c.fillStyle=selected?COL.glow:COL.text;
    c.fillText((unit.name||unit.id).toUpperCase().slice(0,15),slot.x,Math.min(115,slot.y+8));
    return true;
  }
  function cues(slots,t){
    if(!cue)return;
    const age=t-cue.when;
    if(age<0||age>cue.duration||age<cue.releaseAt)return;
    const target=slots.find(x=>x.key===cue.target);
    const from=slots.find(x=>x.key===cue.actor);
    const spread=Math.round(age*10);
    if(target&&(cue.kind==='attack'||cue.kind==='pulse'||cue.kind==='overload')){
      const col=cue.kind==='pulse'?'#a8e9ff':cue.kind==='overload'?COL.red:COL.glow;
      rect(c,target.x-15-spread,target.y-39-spread,30+spread*2,2,col);
      rect(c,target.x-15-spread,target.y-39-spread,2,37+spread*2,col);
      rect(c,target.x+14+spread,target.y-39-spread,2,37+spread*2,col);
    }
    if(from&&cue.kind==='guard')rect(c,from.x-23,from.y-57,46,3,COL.glow);
    if(target&&(cue.kind==='repair'||cue.kind==='item')){
      for(let i=0;i<5;i++)rect(c,target.x-17+i*8,target.y-44+Math.sin(age*9+i)*7,3,3,'#7dffb0');
    }
    if(from&&cue.kind==='charge'){
      rect(c,from.x-16,from.y-56,32,2,COL.red);
      rect(c,from.x-12,from.y-60,24,2,COL.glow);
    }
  }
  function drawPopups(t){
    for(let i=popups.length-1;i>=0;i--){
      const p=popups[i],age=t-p.born;
      if(age>0.95){popups.splice(i,1);continue;}
      const y=p.y-Math.round(age*18);
      c.font='bold 8px monospace';c.textAlign='center';
      c.fillStyle='#06080c';c.fillText(p.text,p.x+1,y+1);
      c.fillStyle=p.color;c.fillText(p.text,p.x,y);
    }
  }
  function draw(now){
    const t=(now-started)/1000;
    background(t);
    if(!state)return;
    cue=queue.find(entry=>t>=entry.when&&t-entry.when<entry.duration)||null;
    if(!cue&&queue.length&&t>queue[queue.length-1].when+queue[queue.length-1].duration)queue=[];
    const slots=sideViewSlots(state);
    for(const slot of slots){
      const resolvedUnit=get(state,slot.key);
      const pending=queue.length>0&&t<queue.at(-1).when+queue.at(-1).duration;
      const fatalCue=resolvedUnit.hp<=0?queue.findLast(entry=>
        entry.target===slot.key&&['attack','pulse','overload','ranged'].includes(entry.kind)):null;
      const awaitingImpact=fatalCue&&t<fatalCue.when+fatalCue.releaseAt;
      const unit=awaitingImpact?{...resolvedUnit,hp:1}:resolvedUnit;
      const visualStatus=pending?'active':state.status;
      const active=activeKey===slot.key;
      if(active&&unit.hp>0){rect(c,slot.x-18,slot.y+2,36,2,pal.accent);}
      const delta=cue?t-cue.when:1e5;
      const pose=sideViewPose(unit,slot.side,visualStatus,cue,delta,
        cue?.actorDuration??.34,cue?.reactionDuration??.42,cue?.releaseAt??0);
      if(!(art[slot.key]&&sheet(slot,art[slot.key],unit,t,pose,active)))
        schematic(slot,unit,t,pose,active);
      const fill=Math.round(30*Math.max(0,unit.hp)/unit.maxHp);
      rect(c,slot.x-15,slot.y-52,30,3,'#070809');
      rect(c,slot.x-15,slot.y-52,fill,2,unit.hp>unit.maxHp*.35?'#7dffb0':'#ff3b30');
    }
    cues(slots,t);
    drawPopups(t);
    c.fillStyle='#dcd6d8';c.font='7px monospace';c.textAlign='center';
    c.fillText('VS',210,44);
    c.fillStyle='#97949c';c.font='6px monospace';
    const bound=slots.every(slot=>images[slot.key]?.loaded);
    c.fillText(bound?'SIDE-VIEW // TACTICAL LINK':'SIDE-VIEW QA — ART UNBOUND',208,21);
  }
  function tick(now) {
    if(!isRunning)return;
    if(canvas.isConnected&&!canvas.closest('.hidden'))draw(now);
    frameToken=requestAnimationFrame(tick);
  }
  function start(){
    if(isRunning)return;
    isRunning=true;frameToken=requestAnimationFrame(tick);
  }
  function stop(){isRunning=false;if(frameToken!==null)cancelAnimationFrame(frameToken);frameToken=null;}
  return Object.freeze({
    canvas,
    setBattle(battle,actor){
      if(!state)poseClocks.clear();
      if(battle.status==='active')terminalUntil=0;
      else if(state?.status!==battle.status){
        const end=Math.max(elapsed(),...queue.map(entry=>entry.when+entry.duration));
        terminalUntil=end;
        for(const slot of sideViewSlots(battle)){
          const unit=get(battle,slot.key);
          const name=unit.hp<=0?'down':
            (battle.status==='victory'&&slot.side==='party')||
            (battle.status==='defeat'&&slot.side==='enemy')?'victory':null;
          if(!name)continue;
          const impact=queue.findLast(entry=>entry.target===slot.key&&
            ['attack','pulse','overload','ranged'].includes(entry.kind));
          const begins=name==='down'&&impact?impact.when+impact.releaseAt:end;
          terminalUntil=Math.max(terminalUntil,begins+battleClipDuration(art[slot.key]?.animations[name],.42));
        }
      }
      if(state){
        const slots=sideViewSlots(battle);
        for(const slot of slots){
          const unit=get(battle,slot.key);
          const prev=lastHp.get(slot.key);
          if(unit&&prev!==undefined&&unit.hp!==prev){
            const diff=unit.hp-prev;
            popups.push({
              text:(diff>0?'+':'')+diff,
              x:slot.x,
              y:slot.y-42,
              color:diff>0?'#7dffb0':'#ffcf70',
              born:elapsed()
            });
          }
          if(unit)lastHp.set(slot.key,unit.hp);
        }
      }else{
        for(const unit of [...battle.party,...battle.enemies])
          lastHp.set(unit.side+':'+unit.id,unit.hp);
      }
      state=battle;activeKey=actor;
      canvas.setAttribute('aria-label','Side-view battle: '+battle.party.length+
        ' allied frames left, '+battle.enemies.length+' enemies right');
      draw(performance.now());start();
    },
    playActions(actions){
      if(!Array.isArray(actions))throw new TypeError('Expected ordered combat actions');
      options?.onActions?.(actions);
      const now=elapsed();
      queue=queue.filter(entry=>entry.when+entry.duration>now);
      const last=queue.at(-1);
      const begin=Math.max(now,last?last.when+last.duration+.04:now);
      queue.push(...battleActionTimeline(actions,art,begin));
    },
    get presentationRemainingSeconds(){
      const last=queue.at(-1);
      return Math.max(0,terminalUntil-elapsed(),last?last.when+last.duration-elapsed():0);
    },
    get isPresenting(){return this.presentationRemainingSeconds>0;},
    get layout(){return state?sideViewSlots(state):[];},
    stop
  });
}
