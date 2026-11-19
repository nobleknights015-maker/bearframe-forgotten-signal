// Campaign field record: reuse Ghost Signal menu styling and the tested
// reusable RPG menu/party models. Reads and mutates only via durable campaign journal.
import {rpgMenuModel,RPG_TABS} from './rpg-menu-model.js';
import {createCampaignParty,createParty,equipItem,swapPartyReserve} from './rpg-party.js';
import {CAMPAIGN_GEAR,CAMPAIGN_CONSUMABLES,nextLevelXp} from './campaign-gear.js';

const $=id=>document.getElementById(id);
const node=(tag,text,cls)=>{
  const n=document.createElement(tag);
  if(text!==undefined)n.textContent=text;
  if(cls)n.className=cls;
  return n;
};
const button=(label,fn)=>{
  const n=node('button',label,'menu-btn sm');
  n.type='button';n.addEventListener('click',fn);return n;
};

export function mountCampaignFieldMenu({game,ui,journal,touchMode,questJournal=null,onOpenLog=null,audio=null}){
  if(!game||!ui||!journal||typeof journal.readWorld!=='function'||
     typeof journal.writeJournal!=='function')
    throw new TypeError('Campaign field menu requires existing game and journal');
  const shell=node('div',undefined,'overlay hidden');
  shell.id='rpg-lab-menu';shell.style.zIndex='16';
  const panel=node('section',undefined,'panel case');
  panel.setAttribute('role','dialog');
  panel.setAttribute('aria-modal','true');
  panel.setAttribute('aria-label','Aeon Circuit field record');
  shell.append(panel);$('stage').append(shell);
  const entry=node('button','RPG','pix-btn');
  entry.id='campaign-field-menu';entry.type='button';
  entry.setAttribute('aria-label','Open campaign field record');
  entry.style.right='calc(var(--u) * 62)';
  entry.style.width='calc(var(--u) * 31)';
  entry.style.fontSize='calc(var(--u) * 6)';
  $('hud').append(entry);
  const objHud=document.querySelector?.('.hud-obj');
  if(objHud)objHud.style.right='calc(var(--u) * 98)';

  let opened=false,stopped=false,tab='status',selectedIdx=0;
  const visible=()=>!stopped&&game.mode==='rpgmenu'&&opened;
  function close(){
    if(!visible())return false;
    opened=false;game.mode='play';shell.classList.add('hidden');
    ui.show('touch',!!touchMode?.());
    return true;
  }
  function open(){
    if(stopped||opened||game.mode!=='play'||!journal.readJournal())return false;
    opened=true;game.mode='rpgmenu';ui.show('touch',false);
    shell.classList.remove('hidden');render();return true;
  }
  function persistParty(nextWorld){
    const record=journal.readJournal(),field=game.snapshot();
    if(!record||record.battle||record.mapId!==game.m?.id||
       field.mission!==record.mapId)return false;
    return journal.writeJournal({...record,mapId:record.mapId,
      maps:{...record.maps,[record.mapId]:field},
      field,world:nextWorld});
  }
  function formation(){
    if(!visible())return;
    const world=journal.readWorld();
    panel.replaceChildren(node('h2','FORMATION // ACTIVE & RESERVE'));
    const back=button('BACK',render);
    const active=world.activeParty;
    if(!Array.isArray(active)){
      panel.append(node('p','FORMATION NOT STAGED FOR THIS CAMPAIGN RECORD','fine'),back);
      back.focus();return;
    }
    let party;
    try{
      party=createCampaignParty({members:world.party,active,
        inventory:world.inventory,equipment:world.equipment});
    }catch(_){
      panel.append(node('p','FORMATION RECORD REQUIRES REVIEW','fine'),back);
      back.focus();return;
    }
    const listing=node('pre',[...active.map((id,i)=>(i+1)+'. '+(world.party.find(u=>u.id===id)?.name||id)),
      ...world.party.filter(u=>!active.includes(u.id)).map(u=>'R. '+(u.name||u.id))].join('\n'));
    listing.style.cssText='white-space:pre-wrap;font-size:calc(var(--u)*9)';
    panel.append(listing);
    const row=node('div',undefined,'btn-row');row.style.flexWrap='wrap';
    const reserves=world.party.filter(u=>!active.includes(u.id));
    for(const reserve of reserves)for(const id of active){
      const member=world.party.find(u=>u.id===id);
      row.append(button('SWAP '+(member?.name||id)+' / '+(reserve.name||reserve.id),()=>{
        try{
          const next=swapPartyReserve(party,id,reserve.id);
          if(!persistParty({...world,activeParty:[...next.active]})){
            ui.toast('FORMATION CHANGE NOT SAVED',3);return;
          }
          audio?.puzzleSolve?.();
          ui.toast('FORMATION RECORDED',2);
          formation();
        }catch(error){ui.toast('FORMATION REJECTED — '+error.message,3);}
      }));
    }
    row.append(back);panel.append(row);
    row.querySelector('button')?.focus();
  }
  function quietCycleInfo(world){
    const flags=world.flags||{};
    const qc=flags.sleepers_power_stable?4:flags.exception_rule_found?3:
      flags.air_exchange_restored?2:flags.quiet_cycle_phase_1?1:0;
    const rillTrust=(flags.trust_rill_1?1:0)+(flags.trust_rill_2?1:0);
    const miyaTrust=(flags.trust_miya_1?1:0)+(flags.miya_marker_corrected?1:0);
    const proofs=['proof_witness','proof_structure','proof_route'].filter(f=>flags[f]).length;
    return `QUIET CYCLE PHASE: ${qc}/4  |  RILL TRUST: ${rillTrust}  |  MIYA TRUST: ${miyaTrust}  |  PROOFS: ${proofs}/3`;
  }
  function buildActionPanel(world,idx){
    const wrap=node('div',undefined,'btn-row');
    wrap.style.cssText='flex-wrap:wrap;margin-top:calc(var(--u)*2)';
    if(tab==='equipment'){
      const member=world.party?.[idx];
      if(!member)return wrap;
      const partyModel=createParty({
        members:world.party,
        active:world.activeParty||world.party.map(u=>u.id),
        inventory:world.inventory||{},
        equipment:world.equipment||{},
        ...(Array.isArray(world.activeParty)?{mode:'campaign'}:{})
      });
      for(const [itemId,count] of Object.entries(world.inventory||{})){
        const def=CAMPAIGN_GEAR[itemId];
        if(!def||!(count>0))continue;
        if(def.allowedLineages&&!def.allowedLineages.includes(member.lineage))continue;
        if(world.equipment?.[member.id]?.[def.slot]===itemId)continue;
        const b=button(`EQUIP ${def.label.toUpperCase()} (${def.slot.toUpperCase()})`,()=>{
          try{
            const next=equipItem(partyModel,member.id,def.slot,itemId,CAMPAIGN_GEAR);
            const updated={...world,inventory:{...next.inventory},equipment:{...next.equipment}};
            if(!persistParty(updated)){ui.toast('EQUIPMENT SAVE FAILED',3);return;}
            audio?.puzzleSolve?.();
            ui.toast(`${member.name||member.id} EQUIPPED ${def.label.toUpperCase()}`,2);
            render();
          }catch(error){ui.toast('EQUIP REJECTED — '+error.message,3);}
        });
        wrap.append(b);
      }
    }else if(tab==='items'){
      const keys=Object.keys(world.inventory||{}).filter(k=>CAMPAIGN_CONSUMABLES[k]&&world.inventory[k]>0);
      const itemId=keys[idx];
      if(!itemId)return wrap;
      const def=CAMPAIGN_CONSUMABLES[itemId];
      for(const m of world.party||[]){
        const needs=(m.hp<m.maxHp)||(def.healEp>0&&(m.ep||0)<(m.maxEp||0));
        const b=button(`USE ON ${m.name||m.id} (${m.hp}/${m.maxHp})`,()=>{
          const next=structuredClone(world);
          next.inventory[itemId]--;
          if(next.inventory[itemId]<=0)delete next.inventory[itemId];
          const u=next.party.find(x=>x.id===m.id);
          u.hp=Math.min(u.maxHp,u.hp+def.healHp);
          if(def.healEp>0&&u.maxEp>0)u.ep=Math.min(u.maxEp,(u.ep||0)+def.healEp);
          if(!persistParty(next)){ui.toast('ITEM USE SAVE FAILED',3);return;}
          audio?.battleRepair?.();
          ui.toast(`${m.name||m.id} RESTORED (+${def.healHp} HP)`,2);
          render();
        });
        b.disabled=!needs;
        wrap.append(b);
      }
    }
    return wrap;
  }
  function render(){
    if(!visible())return;
    const world=journal.readWorld();
    const staged=questJournal?.project(world.flags)||{};
    const menuWorld={...world,quests:{...staged,...world.quests}};
    const model=rpgMenuModel(menuWorld,tab,journal.inspect());
    if(selectedIdx>=model.rows.length)selectedIdx=0;
    panel.replaceChildren();
    const header=node('div',undefined,'case-head');
    const headActions=node('div',undefined,'btn-row');
    if(onOpenLog)headActions.append(button('DIALOGUE LOG',()=>{close();onOpenLog();}));
    headActions.append(button('CLOSE',close));
    header.append(node('h2',model.title),headActions);
    panel.append(header);
    const tabs=node('div',undefined,'btn-row');tabs.style.flexWrap='wrap';
    for(const id of RPG_TABS){
      const b=button(id.toUpperCase(),()=>{tab=id;selectedIdx=0;render();});
      if(tab===id)b.classList.add('active');
      tabs.append(b);
    }
    panel.append(tabs);
    if(tab==='status'){
      const m0=world.party?.[0];
      const xp=world.progression?.xp||0;
      const nxt=nextLevelXp(m0?.level||1);
      const bar=node('p',`XP: ${xp} / NEXT LV: ${nxt}  |  CALLSIGN: ${(world.stats?.callsign||'SLEEPER').toUpperCase()}`,'fine');
      panel.append(bar);
    }else if(tab==='quests'){
      panel.append(node('p',quietCycleInfo(world),'fine'));
    }
    const body=node('div',undefined,'case-body');
    const list=node('ul');
    list.style.cssText='list-style:none;width:42%;overflow:auto;max-height:calc(var(--u)*112)';
    const detail=node('pre',model.rows[selectedIdx]?.detail||model.rows[0].detail);
    detail.style.cssText='white-space:pre-wrap;overflow:auto;flex:1;font-size:calc(var(--u)*9)';
    const rightCol=node('div');
    rightCol.style.cssText='display:flex;flex-direction:column;flex:1;overflow:auto';
    rightCol.append(detail);
    let actionSlot=buildActionPanel(world,selectedIdx);
    rightCol.append(actionSlot);
    model.rows.forEach((row,idx)=>{
      const item=node('li'),b=node('button',row.name,'case-item');
      b.type='button';
      if(idx===selectedIdx)b.classList.add('active');
      b.addEventListener('click',()=>{
        selectedIdx=idx;
        detail.textContent=row.detail;
        const fresh=buildActionPanel(world,selectedIdx);
        actionSlot.replaceWith(fresh);
        actionSlot=fresh;
      });
      item.append(b);list.append(item);
    });
    body.append(list,rightCol);panel.append(body);
    if(tab==='party'&&Array.isArray(world.activeParty)&&world.party.length>1)
      panel.append(button('FORMATION / RESERVE',formation));
    if(tab==='save'){
      panel.append(button('SAVE CAMPAIGN RECORD',()=>{
        const ok=journal.saveField(game.m.id,game.snapshot());
        if(ok)audio?.saveTerminal?.();
        ui.toast(ok?'CAMPAIGN FIELD RECORD SAVED':'CAMPAIGN SAVE FAILED',3);
        if(ok)render();
      }));
    }
    panel.querySelector('.case-head button:last-child')?.focus();
  }
  function keydown(event){
    if(stopped)return;
    if(event.code==='KeyM'&&game.mode==='play'&&!event.repeat){
      if(open())event.preventDefault();return;
    }
    if(!visible())return;
    if(event.code==='Escape'){
      event.preventDefault();close();return;
    }
    if(event.code==='ArrowUp'||event.code==='ArrowDown'){
      const buttons=[...shell.querySelectorAll('button')].filter(b=>!b.disabled&&b.getClientRects().length);
      if(!buttons.length)return;
      event.preventDefault();
      const i=buttons.indexOf(document.activeElement);
      const shift=event.code==='ArrowUp'?-1:1;
      buttons[i<0?0:(i+shift+buttons.length)%buttons.length].focus();
    }
  }
  const previousResume=game.onResume;
  const resume=()=>{if(!close())previousResume?.();};
  game.onResume=resume;
  entry.addEventListener('click',open);
  document.addEventListener('keydown',keydown);
  return Object.freeze({
    open,close,
    inspect:()=>({opened:visible(),tab,loaded:!!journal.readJournal()}),
    stop(){
      if(stopped)return;
      if(visible())close();
      stopped=true;
      document.removeEventListener('keydown',keydown);
      entry.remove();shell.remove();
      if(game.onResume===resume)game.onResume=previousResume;
    }
  });
}
