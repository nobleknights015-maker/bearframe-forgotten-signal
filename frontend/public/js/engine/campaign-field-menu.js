// Consolidated Responsive Industrial RPG Navigation Bar & Field Record Menu
// Matches Ghost Signal's CRT industrial visual language while consolidating all 12 RPG functions.
import {rpgMenuModel,RPG_TABS} from './rpg-menu-model.js';
import {createCampaignParty,createParty,equipItem,swapPartyReserve} from './rpg-party.js';
import {CAMPAIGN_GEAR,CAMPAIGN_CONSUMABLES,nextLevelXp,effectiveUnitStats} from './campaign-gear.js';
import {AREA_META,WORLD_EDGES} from './campaign-world-builder.js';
import {SLEEPER_META} from './aeon-v5-bridge.js';

const AEON_ROOT=new URL('../../assets/aeon/',import.meta.url);
const UNIT_PORTRAIT_ID=Object.freeze({
  sleeper_A:'sleeper_A',
  sleeper_B:'sleeper_B',
  sleeper_C:'sleeper_C',
  sleeper_D:'sleeper_D',
  ghostgrid_utility_pica:'pica',
  echo_industrial_maintenance:'rill',
  bearframe_exploration_miya:'miya'
});
const COMPANION_ROLE=Object.freeze({
  ghostgrid_utility_pica:{role:'SUPPORT DRONE',archetype:'Ghost-Grid Utility Frame',accent:'#53e6f2'},
  echo_industrial_maintenance:{role:'ECHO COURIER',archetype:'Industrial Maintenance Frame',accent:'#f2b857'},
  bearframe_exploration_miya:{role:'EXPLORER',archetype:'Bearframe Field Survey Unit',accent:'#3fe3d4'}
});
const $=id=>document.getElementById(id);
const node=(tag,text,cls)=>{
  const n=document.createElement(tag);
  if(text!==undefined)n.textContent=text;
  if(cls)n.className=cls;
  return n;
};
const iconEl=(name)=>{
  const sp=document.createElement('span');
  sp.className=`aeon-ico ico-${name||'menu'}`;
  sp.setAttribute('aria-hidden','true');
  return sp;
};
const button=(label,fn,cls='menu-btn sm')=>{
  const n=node('button',label,cls);
  n.type='button';n.addEventListener('click',fn);return n;
};

export const NAV_GROUPS=Object.freeze([
  Object.freeze({
    id:'party-gear',
    label:'PARTY & GEAR',
    items:Object.freeze([
      Object.freeze({id:'status',label:'Character Status',icon:'status',tab:'status'}),
      Object.freeze({id:'party',label:'Party Management',icon:'party',tab:'party'}),
      Object.freeze({id:'items',label:'Inventory',icon:'inventory',tab:'items'}),
      Object.freeze({id:'equipment',label:'Equipment',icon:'equipment',tab:'equipment'}),
      Object.freeze({id:'skills',label:'Skills & Abilities',icon:'skills',tab:'skills'})
    ])
  }),
  Object.freeze({
    id:'expedition',
    label:'EXPEDITION',
    items:Object.freeze([
      Object.freeze({id:'quests',label:'Quest Journal',icon:'quests',tab:'quests'}),
      Object.freeze({id:'worldmap',label:'World Map',icon:'worldmap',tab:'worldmap'}),
      Object.freeze({id:'dialogue',label:'Dialogue History',icon:'dialogue',tab:'dialogue'})
    ])
  }),
  Object.freeze({
    id:'system',
    label:'SYSTEM',
    items:Object.freeze([
      Object.freeze({id:'save',label:'Save & Load',icon:'saveload',tab:'save'}),
      Object.freeze({id:'settings',label:'Settings',icon:'settings',tab:'settings'}),
      Object.freeze({id:'help',label:'Help & Controls',icon:'help',tab:'help'}),
      Object.freeze({id:'title',label:'Return to Title',icon:'exit',tab:'title'})
    ])
  })
]);

const ALL_NAV_ITEMS=NAV_GROUPS.flatMap(g=>g.items);

const SKILL_CATALOG=Object.freeze({
  strike:{name:'STRIKE',ep:0,scope:'1 ENEMY',desc:'Direct chassis impact delivering reliable kinetic force.'},
  pulse:{name:'ARC PULSE',ep:4,scope:'1 ENEMY',desc:'Focused electromagnetic discharge; destabilizes audit drones and shielded frames.'},
  repair:{name:'FIELD REPAIR',ep:5,scope:'1 ALLY',desc:'Deploys patch current to restore an ally\'s structural integrity.'},
  guard:{name:'BRACE GUARD',ep:0,scope:'SELF',desc:'Hardens outer plating (-50% damage until next turn) and recovers +4 EP.'},
  scan:{name:'TELEMETRY SCAN',ep:2,scope:'1 ENEMY',desc:'Reads hostile circuit cadence, revealing exact integrity and weak points.'}
});

const REGION_COLOR=Object.freeze({
  'Stasis Hollow':'#72dce8',
  'Rootway Ruins':'#78c896',
  'Waterworks & Relays':'#5cb9d6',
  'Lantern Shelf':'#f2bd75',
  'Sky-Rail Viaduct':'#e8946e',
  'Survey Wetland':'#63d9b4',
  'Old Archive':'#98b6e8',
  'Quarantine Spine':'#e06c75',
  'Control Cathedral':'#b68be8',
  'Dawn Overlook':'#ffd38a'
});

const VIEW_ICON=Object.fromEntries(ALL_NAV_ITEMS.map(item=>[item.tab,item.icon]));

export function mountCampaignFieldMenu({
  game,ui,journal,touchMode,questJournal=null,onOpenLog=null,audio=null,
  sfx=null,settings=null,store=null,syncSettings=null,refreshTouch=null,
  worldSpec=null,getDialogueLog=null,getReducedMotion=null,toggleReducedMotion=null,
  onReloadCheckpoint=null,onReturnTitle=null
}){
  if(!game||!ui||!journal||typeof journal.readWorld!=='function'||
     typeof journal.writeJournal!=='function')
    throw new TypeError('Campaign field menu requires existing game and journal');

  const stage=$('stage');
  const hud=$('hud');

  // 1. Unified RPG Modal Shell (#rpg-lab-menu)
  const shell=node('div',undefined,'overlay hidden');
  shell.id='rpg-lab-menu';shell.style.zIndex='18';
  const panel=node('section',undefined,'panel case campaign-record-panel');
  panel.setAttribute('role','dialog');
  panel.setAttribute('aria-modal','true');
  panel.setAttribute('aria-label','Aeon Circuit field record');
  shell.append(panel);stage.append(shell);

  // 2. Transparent Click-Outside Backdrop + Expandable Industrial Dropdown Drawer
  const backdrop=node('div',undefined,'campaign-nav-backdrop hidden');
  backdrop.id='campaign-nav-backdrop';
  const drawer=node('nav',undefined,'campaign-nav-drawer hidden');
  drawer.id='campaign-nav-drawer';
  drawer.setAttribute('aria-label','Campaign navigation menu');
  drawer.setAttribute('data-testid','campaign-nav-drawer');
  stage.append(backdrop,drawer);

  // 3. Compact Top-Right Consolidated Menu Trigger inside #hud
  const navBar=node('div',undefined,'campaign-nav-bar');
  navBar.id='campaign-nav-bar';
  navBar.setAttribute('data-testid','campaign-nav-bar');

  const entry=document.createElement('button');
  entry.id='campaign-field-menu';
  entry.type='button';
  entry.className='campaign-nav-toggle';
  entry.setAttribute('aria-label','Open campaign navigation menu');
  entry.setAttribute('aria-haspopup','menu');
  entry.setAttribute('aria-expanded','false');
  entry.setAttribute('data-testid','campaign-nav-toggle');
  const entryLabel=node('span','MENU','campaign-nav-label');
  const entryCaret=node('span','▾','campaign-nav-caret');
  entry.append(iconEl('menu'),entryLabel,entryCaret);
  navBar.append(entry);
  hud.append(navBar);

  // Mark body so legacy scattered corner buttons hide cleanly while campaign is mounted
  document.body?.classList?.add('aeon-nav-consolidated');

  let opened=false,drawerOpen=false,stopped=false,tab='status',selectedIdx=0,selectedMapId=null;
  const anyOpen=()=>!stopped&&(opened||drawerOpen)&&game.mode==='rpgmenu';
  const modalVisible=()=>!stopped&&game.mode==='rpgmenu'&&opened;

  function syncToggleState(){
    entry.setAttribute('aria-expanded',String(drawerOpen));
    entry.classList.toggle('open',drawerOpen||opened);
    entryCaret.textContent=drawerOpen?'▴':'▾';
  }

  function syncBarVisibility(){
    if(stopped)return;
    const hideMode=game.mode==='battle'||game.mode==='dialog'||game.mode==='choice'||
      game.mode==='title'||game.mode==='ending'||game.mode==='terminal';
    navBar.classList.toggle('hidden',hideMode||opened);
    if(hideMode&&(drawerOpen||opened))close(false);
  }

  function buildDrawer(){
    drawer.replaceChildren();
    const head=node('div',undefined,'campaign-nav-drawer-head');
    const areaId=game.m?.id||'A00';
    const areaMeta=AREA_META[areaId];
    const titleSpan=node('span',`${areaId} · ${(areaMeta?.region||'BEARFRAME').toUpperCase()}`,'campaign-nav-sector');
    const closeBtn=node('button','✕','campaign-nav-close');
    closeBtn.type='button';
    closeBtn.setAttribute('aria-label','Close navigation menu');
    closeBtn.addEventListener('click',()=>close(true));
    head.append(titleSpan,closeBtn);
    drawer.append(head);

    const groupsWrap=node('div',undefined,'campaign-nav-groups');
    for(const group of NAV_GROUPS){
      const sec=node('section',undefined,'campaign-nav-group');
      sec.append(node('div',group.label,'campaign-nav-group-title'));
      const list=node('div',undefined,'campaign-nav-group-list');
      for(const item of group.items){
        const btn=document.createElement('button');
        btn.type='button';
        btn.className='campaign-nav-item'+(tab===item.tab&&opened?' active':'');
        btn.setAttribute('data-nav-id',item.id);
        btn.setAttribute('data-testid',`nav-item-${item.id}`);
        btn.append(iconEl(item.icon),node('span',item.label,'campaign-nav-item-text'));
        btn.addEventListener('click',()=>{
          sfx?.blip?.();
          openSection(item.tab);
        });
        list.append(btn);
      }
      sec.append(list);
      groupsWrap.append(sec);
    }
    drawer.append(groupsWrap);
  }

  function close(restorePlay=true){
    if(!opened&&!drawerOpen)return false;
    opened=false;drawerOpen=false;
    shell.classList.add('hidden');
    drawer.classList.add('hidden');
    backdrop.classList.add('hidden');
    syncToggleState();
    syncBarVisibility();
    if(restorePlay&&game.mode==='rpgmenu'){
      game.mode='play';
      ui.show('touch',!!touchMode?.());
    }
    return true;
  }

  function openDropdown(){
    if(stopped||!journal.readJournal())return false;
    if(drawerOpen)return close(true);
    if(game.mode!=='play'&&game.mode!=='rpgmenu')return false;
    opened=false;
    shell.classList.add('hidden');
    drawerOpen=true;
    game.mode='rpgmenu';
    ui.show('touch',false);
    buildDrawer();
    backdrop.classList.remove('hidden');
    drawer.classList.remove('hidden');
    syncToggleState();
    syncBarVisibility();
    sfx?.blip?.();
    drawer.querySelector('.campaign-nav-item')?.focus();
    return true;
  }

  function openSection(nextTab=tab){
    if(stopped||!journal.readJournal())return false;
    if(game.mode!=='play'&&game.mode!=='rpgmenu')return false;
    tab=nextTab||'status';
    selectedIdx=0;
    drawerOpen=false;
    drawer.classList.add('hidden');
    backdrop.classList.add('hidden');
    opened=true;
    game.mode='rpgmenu';
    ui.show('touch',false);
    shell.classList.remove('hidden');
    syncToggleState();
    syncBarVisibility();
    render();
    return true;
  }

  // Backwards-compatible open(): opens the RPG panel directly (used by KeyM & tests)
  function open(){
    if(stopped||opened||game.mode!=='play'||!journal.readJournal())return false;
    return openSection(tab);
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
    if(!modalVisible())return;
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
    listing.style.cssText='white-space:pre-wrap;font-size:max(12px,calc(var(--u)*9))';
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
    return `QUIET CYCLE PHASE: ${qc}/4  ·  RILL TRUST: ${rillTrust}  ·  MIYA TRUST: ${miyaTrust}  ·  PROOFS: ${proofs}/3`;
  }

  function iconForItem(itemId){
    if(CAMPAIGN_CONSUMABLES[itemId])return 'consumable';
    const gear=CAMPAIGN_GEAR[itemId];
    if(gear)return gear.slot==='weapon'?'weapon':gear.slot==='armor'?'armor':'accessory';
    return 'keyitem';
  }

  function buildActionPanel(world,idx){
    const wrap=node('div',undefined,'btn-row campaign-action-row');
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
        const deltas=[
          def.attack?`+${def.attack} ATK`:'',
          def.defense?`+${def.defense} DEF`:'',
          def.speed?`+${def.speed} SPD`:''
        ].filter(Boolean).join(' ');
        const b=document.createElement('button');
        b.type='button';b.className='menu-btn sm campaign-ico-btn';
        b.append(iconEl(def.slot),document.createTextNode(` EQUIP ${def.label.toUpperCase()}${deltas?' ('+deltas+')':''}`));
        b.addEventListener('click',()=>{
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
      const keys=Object.keys(world.inventory||{}).sort((a,b)=>a.localeCompare(b));
      const itemId=keys[idx];
      const def=itemId?CAMPAIGN_CONSUMABLES[itemId]:null;
      if(!def)return wrap;
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

  function renderWorldMapView(){
    const record=journal.readJournal();
    const currentId=game.m?.id||record?.mapId||'A00';
    const visitedSet=new Set([currentId,...Object.keys(record?.maps||{})]);
    const mapSpecById=new Map((worldSpec?.maps||[]).map(m=>[m.id,m]));
    if(!selectedMapId||!AREA_META[selectedMapId])selectedMapId=currentId;

    const wrap=node('div',undefined,'campaign-worldmap-wrap');
    const svgNS='http://www.w3.org/2000/svg';
    const svg=document.createElementNS(svgNS,'svg');
    svg.setAttribute('viewBox','0 0 360 156');
    svg.setAttribute('class','campaign-worldmap-svg');
    svg.setAttribute('role','img');
    svg.setAttribute('aria-label','Bearframe 29-sector regional map');

    // Subtle coordinate grid
    for(let gx=30;gx<360;gx+=30){
      const l=document.createElementNS(svgNS,'line');
      l.setAttribute('x1',gx);l.setAttribute('y1',0);l.setAttribute('x2',gx);l.setAttribute('y2',156);
      l.setAttribute('stroke','rgba(114,220,232,0.08)');l.setAttribute('stroke-width','1');
      svg.appendChild(l);
    }
    for(let gy=26;gy<156;gy+=26){
      const l=document.createElementNS(svgNS,'line');
      l.setAttribute('x1',0);l.setAttribute('y1',gy);l.setAttribute('x2',360);l.setAttribute('y2',gy);
      l.setAttribute('stroke','rgba(114,220,232,0.08)');l.setAttribute('stroke-width','1');
      svg.appendChild(l);
    }

    const posFor=id=>{
      const m=AREA_META[id];
      return {x:Math.round((m?.mx??50)*3.32+14),y:Math.round((m?.my??50)*1.32+12)};
    };

    // Connecting transit edges
    for(const [a,b] of WORLD_EDGES){
      const pa=posFor(a),pb=posFor(b);
      const seen=visitedSet.has(a)||visitedSet.has(b);
      const line=document.createElementNS(svgNS,'line');
      line.setAttribute('x1',pa.x);line.setAttribute('y1',pa.y);
      line.setAttribute('x2',pb.x);line.setAttribute('y2',pb.y);
      line.setAttribute('stroke',seen?'rgba(114,220,232,0.55)':'rgba(90,112,134,0.28)');
      line.setAttribute('stroke-width',seen?'1.6':'1');
      svg.appendChild(line);
    }

    const detailBox=node('div',undefined,'campaign-worldmap-detail');
    const renderNodeDetail=(id)=>{
      const meta=AREA_META[id]||{region:'Unknown',palette:'stasis_cryo',arch:'chamber'};
      const spec=mapSpecById.get(id);
      const isCurrent=id===currentId;
      const isVisited=visitedSet.has(id);
      const neighbors=WORLD_EDGES.filter(([a,b])=>a===id||b===id).map(([a,b])=>a===id?b:a);
      detailBox.replaceChildren();
      const title=node('div',`${id} — ${(spec?.name||meta.region).toUpperCase()}`,'campaign-wm-title');
      const status=node('div',
        `REGION: ${meta.region}  ·  STATUS: ${isCurrent?'CURRENT POSITION':isVisited?'DISCOVERED':'UNCHARTED'}  ·  SAVE RELAY: ${spec?.saveTerminal?'YES':'NO'}`,
        'fine');
      const routes=node('div',`LINKED SECTORS: ${neighbors.join(', ')||'NONE'}  ·  DISCOVERED: ${visitedSet.size}/29`,'fine');
      detailBox.append(title,status,routes);
    };

    // 29 clickable sector nodes
    for(const id of Object.keys(AREA_META)){
      const meta=AREA_META[id];
      const {x,y}=posFor(id);
      const isCurrent=id===currentId;
      const isVisited=visitedSet.has(id);
      const isSelected=id===selectedMapId;
      const col=REGION_COLOR[meta.region]||'#72dce8';

      const g=document.createElementNS(svgNS,'g');
      g.setAttribute('class','campaign-wm-node');
      g.setAttribute('tabindex','0');
      g.setAttribute('role','button');
      g.setAttribute('aria-label',`${id} ${mapSpecById.get(id)?.name||meta.region}`);
      g.style.cursor='pointer';

      if(isCurrent){
        const halo=document.createElementNS(svgNS,'rect');
        halo.setAttribute('x',x-6);halo.setAttribute('y',y-6);
        halo.setAttribute('width',12);halo.setAttribute('height',12);
        halo.setAttribute('fill','none');
        halo.setAttribute('stroke','#f2bd75');
        halo.setAttribute('stroke-width','1.5');
        g.appendChild(halo);
      }

      const sq=document.createElementNS(svgNS,'rect');
      sq.setAttribute('x',x-3.5);sq.setAttribute('y',y-3.5);
      sq.setAttribute('width',7);sq.setAttribute('height',7);
      sq.setAttribute('fill',isCurrent?'#f2bd75':isVisited?col:'#1a2533');
      sq.setAttribute('stroke',isSelected?'#ffffff':col);
      sq.setAttribute('stroke-width',isSelected?'1.8':'1');
      g.appendChild(sq);

      if(isCurrent||isSelected||['A00','A09','A15','A24','A28'].includes(id)){
        const txt=document.createElementNS(svgNS,'text');
        txt.setAttribute('x',x);txt.setAttribute('y',y-6);
        txt.setAttribute('text-anchor','middle');
        txt.setAttribute('fill',isCurrent?'#f2bd75':'#cfe0ea');
        txt.setAttribute('font-size','6');
        txt.setAttribute('font-family','monospace');
        txt.textContent=id;
        g.appendChild(txt);
      }

      const select=()=>{selectedMapId=id;sfx?.blip?.();render();};
      g.addEventListener('click',select);
      g.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();select();}});
      svg.appendChild(g);
    }

    renderNodeDetail(selectedMapId);
    wrap.append(svg,detailBox);
    panel.append(wrap);
  }

  function renderDialogueHistoryView(){
    const entries=typeof getDialogueLog==='function'?[...getDialogueLog()].reverse():[];
    const list=node('ul',undefined,'campaign-log-list');
    if(!entries.length){
      const empty=node('li','No field transmissions recorded yet.','campaign-log-row');
      list.append(empty);
    }else{
      for(const item of entries){
        const li=node('li',undefined,'campaign-log-row');
        li.append(
          node('div',`${item.speaker||'SYSTEM'} · ${item.sceneId||'FIELD'}${item.at?' · '+item.at:''}`,'campaign-log-speaker'),
          node('div',item.text||'')
        );
        list.append(li);
      }
    }
    panel.append(list);
    if(onOpenLog&&!entries.length){
      panel.append(button('OPEN FULL LOG MODAL',()=>{close(true);onOpenLog();}));
    }
  }

  function renderSettingsView(){
    const box=node('div',undefined,'campaign-settings-grid');

    // Volume
    const volRow=node('div',undefined,'campaign-setting-row');
    const curVol=Math.round(((settings?.volume)??0.7)*100);
    const volLabel=node('span',`MASTER VOLUME (${curVol}%)`,'campaign-setting-label');
    const slider=document.createElement('input');
    slider.type='range';slider.min='0';slider.max='100';slider.step='5';
    slider.value=String(curVol);
    slider.className='campaign-range';
    slider.setAttribute('aria-label','Master Volume');
    slider.addEventListener('input',e=>{
      const val=Number(e.target.value);
      volLabel.textContent=`MASTER VOLUME (${val}%)`;
      if(settings){
        settings.volume=val/100;
        sfx?.init?.();sfx?.setVolume?.(settings.volume);sfx?.blip?.();
        store?.saveSettings?.(settings);
        syncSettings?.();
      }
    });
    volRow.append(volLabel,slider);
    box.append(volRow);

    // Light Flicker
    const flickRow=node('div',undefined,'campaign-setting-row');
    flickRow.append(node('span','ATMOSPHERIC LIGHT FLICKER','campaign-setting-label'));
    flickRow.append(button(settings?.flicker===false?'REDUCED':'ON',()=>{
      if(settings){
        settings.flicker=!settings.flicker;
        store?.saveSettings?.(settings);syncSettings?.();
      }
      sfx?.blip?.();render();
    }));
    box.append(flickRow);

    // Touch Controls
    const touchRow=node('div',undefined,'campaign-setting-row');
    touchRow.append(node('span','TOUCH CONTROLS','campaign-setting-label'));
    touchRow.append(button((settings?.touch||'auto').toUpperCase(),()=>{
      if(settings){
        settings.touch={auto:'on',on:'off',off:'auto'}[settings.touch]||'auto';
        store?.saveSettings?.(settings);syncSettings?.();refreshTouch?.();
      }
      sfx?.blip?.();render();
    }));
    box.append(touchRow);

    // Reduced Motion
    const motionRow=node('div',undefined,'campaign-setting-row');
    const isReduced=typeof getReducedMotion==='function'?getReducedMotion():document.body?.classList?.contains('reduced-motion');
    motionRow.append(node('span','REDUCED MOTION','campaign-setting-label'));
    motionRow.append(button(isReduced?'ON':'OFF',()=>{
      if(typeof toggleReducedMotion==='function')toggleReducedMotion();
      else document.body?.classList?.toggle('reduced-motion');
      render();
    }));
    box.append(motionRow);

    panel.append(box);
  }

  function renderHelpView(){
    const grid=node('div',undefined,'campaign-help-grid');
    const sections=[
      {
        title:'KEYBOARD',
        lines:[
          'WASD / Arrows — Move Sleeper',
          'E / Space — Interact, Open Doors, Advance Text',
          'F — Toggle Lamp Light',
          'Q — Telemetry Scan Pulse',
          'M — Open Field Record',
          'ESC — Close Menu / Back'
        ]
      },
      {
        title:'TOUCH SCREEN',
        lines:[
          'Left D-Pad — 4-Direction Exploration',
          'USE — Interact with NPCs, Consoles & Doors',
          'LIGHT / SCAN — Toggle Lamp & Area Scan',
          'Top-Right MENU ▾ — Expand Full Navigation',
          'Tap Outside / ✕ — Return to Exploration'
        ]
      },
      {
        title:'CONTROLLER & COMBAT',
        lines:[
          'Left Stick / D-Pad — Move & Navigate Menus',
          'A — Confirm / Interact · B — Cancel / Back',
          'X — Telemetry Scan · Y — Toggle Light',
          'Combat: Strike, Pulse (vs Machines), Repair, Guard',
          'Save Terminals restore full HP/EP & unlock Relay Transit'
        ]
      }
    ];
    for(const sec of sections){
      const card=node('div',undefined,'campaign-help-card');
      card.append(node('div',sec.title,'campaign-help-title'));
      const ul=node('ul',undefined,'campaign-help-list');
      for(const l of sec.lines)ul.append(node('li',l));
      card.append(ul);
      grid.append(card);
    }
    panel.append(grid);
  }

  function renderReturnTitleView(){
    const wrap=node('div',undefined,'campaign-title-exit');
    wrap.append(
      node('p','Save your current sector position and expedition journal before returning to the Aeon Circuit title screen?','fine')
    );
    const row=node('div',undefined,'btn-row');
    row.append(
      button('SAVE & RETURN TO TITLE',()=>{
        const ok=journal.saveField(game.m.id,game.snapshot());
        if(!ok){ui.toast('CAMPAIGN SAVE FAILED — REMAIN HERE',3);return;}
        audio?.saveTerminal?.();
        if(typeof onReturnTitle==='function')onReturnTitle();
        else location.assign(new URL('campaign.html',location.href).href);
      },'menu-btn'),
      button('RETURN TO MENU',()=>{tab='status';render();})
    );
    wrap.append(row);
    panel.append(wrap);
  }

  function render(){
    if(!modalVisible())return;
    const world=journal.readWorld();
    const staged=questJournal?.project(world.flags)||{};
    const menuWorld={...world,quests:{...staged,...world.quests}};
    const isCoreTab=RPG_TABS.includes(tab);
    const model=isCoreTab?rpgMenuModel(menuWorld,tab,journal.inspect()):null;
    if(model&&selectedIdx>=model.rows.length)selectedIdx=0;

    panel.replaceChildren();
    const header=node('div',undefined,'case-head');
    const titleWrap=node('h2',undefined,'campaign-panel-title');
    const VIEW_TITLES={
      worldmap:'FIELD RECORD // WORLD MAP',
      dialogue:'FIELD RECORD // DIALOGUE HISTORY',
      settings:'FIELD RECORD // SETTINGS',
      help:'FIELD RECORD // HELP & CONTROLS',
      title:'FIELD RECORD // RETURN TO TITLE'
    };
    const labelText=isCoreTab?model.title:(VIEW_TITLES[tab]||('FIELD RECORD // '+tab.toUpperCase()));
    titleWrap.append(iconEl(VIEW_ICON[tab]||'menu'),document.createTextNode(' '+labelText));
    const headActions=node('div',undefined,'btn-row');
    headActions.append(
      button('MENU ▾',openDropdown),
      button('CLOSE',()=>close(true))
    );
    header.append(titleWrap,headActions);
    panel.append(header);

    // Quick horizontal tab strip (preserves exact RPG_TABS labels for full compatibility)
    const tabs=node('div',undefined,'btn-row campaign-tab-strip');
    const allTabs=[
      ...RPG_TABS.map(id=>({id,label:id.toUpperCase()})),
      {id:'worldmap',label:'WORLD MAP'},
      {id:'dialogue',label:'LOG'},
      {id:'settings',label:'SETTINGS'},
      {id:'help',label:'HELP'},
      {id:'title',label:'TITLE'}
    ];
    for(const t of allTabs){
      const b=button(t.label,()=>{tab=t.id;selectedIdx=0;sfx?.blip?.();render();});
      if(tab===t.id)b.classList.add('active');
      tabs.append(b);
    }
    panel.append(tabs);

    // Non-core extended views
    if(tab==='worldmap'){renderWorldMapView();panel.querySelector('.case-head button:last-child')?.focus();return;}
    if(tab==='dialogue'){renderDialogueHistoryView();panel.querySelector('.case-head button:last-child')?.focus();return;}
    if(tab==='settings'){renderSettingsView();panel.querySelector('.case-head button:last-child')?.focus();return;}
    if(tab==='help'){renderHelpView();panel.querySelector('.case-head button:last-child')?.focus();return;}
    if(tab==='title'){renderReturnTitleView();panel.querySelector('.campaign-title-exit button')?.focus();return;}

    // Enriched core RPG views
    if(tab==='status'){
      const m0=world.party?.[0];
      const xp=world.progression?.xp||0;
      const nxt=nextLevelXp(m0?.level||1);
      panel.append(node('p',`XP: ${xp} / NEXT LV: ${nxt}  ·  CALLSIGN: ${(world.stats?.callsign||'SLEEPER').toUpperCase()}  ·  SECTOR: ${game.m?.id||'A00'}`,'fine'));
    }else if(tab==='quests'){
      panel.append(node('p',quietCycleInfo(world),'fine'));
    }

    // Build enriched detail strings for skills, status, equipment, and items
    const detailForRow=(row,idx)=>{
      if(tab==='status'){
        const m=world.party?.[idx];
        if(!m)return row.detail;
        const eff=effectiveUnitStats(m,world.equipment);
        return `${row.detail}\nLINEAGE: ${(m.lineage||'sleeper').toUpperCase()}  ·  ATK ${eff.attack}  ·  DEF ${eff.defense}  ·  SPD ${eff.speed}`;
      }
      if(tab==='skills'){
        const m=world.party?.[idx];
        const list=Array.isArray(m?.skills)&&m.skills.length?m.skills:['strike'];
        const full=['strike',...list.filter(s=>s!=='strike')];
        return full.map(id=>{
          const sk=SKILL_CATALOG[id]||{name:id.toUpperCase(),ep:0,scope:'SINGLE',desc:'Registered chassis routine.'};
          return `${sk.name}  [${sk.ep} EP · ${sk.scope}]\n  ${sk.desc}`;
        }).join('\n\n');
      }
      if(tab==='items'){
        const keys=Object.keys(world.inventory||{}).sort((a,b)=>a.localeCompare(b));
        const itemId=keys[idx];
        const c=itemId&&CAMPAIGN_CONSUMABLES[itemId];
        const g=itemId&&CAMPAIGN_GEAR[itemId];
        if(c)return `${c.label.toUpperCase()}\n${row.detail}\n${c.desc}`;
        if(g)return `${g.label.toUpperCase()} (${g.slot.toUpperCase()})\n${row.detail}\nATK +${g.attack} · DEF +${g.defense} · SPD +${g.speed}`;
      }
      return row.detail;
    };

    const buildUnitHeader=(idx)=>{
      if(!['status','party','equipment','skills'].includes(tab))return null;
      const m=world.party?.[idx];
      if(!m)return null;
      const pid=UNIT_PORTRAIT_ID[m.artId];
      const meta=SLEEPER_META[m.artId]||COMPANION_ROLE[m.artId]||{role:(m.lineage||'UNIT').toUpperCase(),archetype:'',accent:'#72dce8'};
      const card=node('div',undefined,'campaign-unit-header');
      card.style.setProperty('--unit-accent',meta.accent||'#72dce8');
      if(pid){
        const img=document.createElement('img');
        img.className='campaign-unit-portrait';
        img.src=new URL('portraits/'+pid+'.png',AEON_ROOT).href;
        img.alt=(m.name||m.id)+' portrait';
        img.onerror=()=>{img.style.display='none';};
        card.append(img);
      }
      const info=node('div',undefined,'campaign-unit-meta');
      const displayName=m.id==='sleeper'&&world.stats?.callsign
        ? `${world.stats.callsign.toUpperCase()} (${meta.code||m.name||'SLEEPER'})`
        : (m.name||m.id).toUpperCase();
      info.append(node('div',displayName,'campaign-unit-name'));
      info.append(node('div',`${meta.role}${meta.archetype?' · '+meta.archetype:''}`,'campaign-unit-role'));
      info.append(node('div',`LV ${m.level||1}  ·  HP ${m.hp}/${m.maxHp}  ·  EP ${m.ep??0}/${m.maxEp??0}`,'campaign-unit-vitals'));
      card.append(info);
      return card;
    };

    const body=node('div',undefined,'case-body');
    const list=node('ul',undefined,'campaign-record-list');
    const detail=node('pre',detailForRow(model.rows[selectedIdx]||model.rows[0],selectedIdx));
    detail.className='campaign-record-detail';
    const rightCol=node('div',undefined,'campaign-record-right');
    let unitSlot=buildUnitHeader(selectedIdx);
    if(unitSlot)rightCol.append(unitSlot);
    rightCol.append(detail);
    let actionSlot=buildActionPanel(world,selectedIdx);
    rightCol.append(actionSlot);

    const invKeys=tab==='items'?Object.keys(world.inventory||{}).sort((a,b)=>a.localeCompare(b)):[];
    model.rows.forEach((row,idx)=>{
      const item=node('li');
      const b=document.createElement('button');
      b.type='button';b.className='case-item';
      if(tab==='items'&&invKeys[idx])b.append(iconEl(iconForItem(invKeys[idx])),document.createTextNode(' '));
      b.append(document.createTextNode(row.name));
      if(idx===selectedIdx)b.classList.add('active');
      b.addEventListener('click',()=>{
        selectedIdx=idx;
        list.querySelectorAll('.case-item').forEach(el=>el.classList.remove('active'));
        b.classList.add('active');
        const nextUnit=buildUnitHeader(idx);
        if(unitSlot&&nextUnit){unitSlot.replaceWith(nextUnit);unitSlot=nextUnit;}
        else if(unitSlot&&!nextUnit){unitSlot.remove();unitSlot=null;}
        else if(!unitSlot&&nextUnit){rightCol.prepend(nextUnit);unitSlot=nextUnit;}
        detail.textContent=detailForRow(row,idx);
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
      const saveRow=node('div',undefined,'btn-row');
      saveRow.append(button('SAVE CAMPAIGN RECORD',()=>{
        const ok=journal.saveField(game.m.id,game.snapshot());
        if(ok)audio?.saveTerminal?.();
        ui.toast(ok?'CAMPAIGN FIELD RECORD SAVED':'CAMPAIGN SAVE FAILED',3);
        if(ok)render();
      }));
      if(typeof onReloadCheckpoint==='function'&&journal.inspect().hasSave){
        saveRow.append(button('RELOAD LAST CHECKPOINT',()=>{
          const ok=onReloadCheckpoint();
          if(ok){close(true);ui.toast('CHECKPOINT RESTORED',2);}
          else ui.toast('NO SAVED CHECKPOINT AVAILABLE',2.5);
        }));
      }
      panel.append(saveRow);
    }
    panel.querySelector('.case-head button:last-child')?.focus();
  }

  function keydown(event){
    if(stopped)return;
    if(event.code==='KeyM'&&game.mode==='play'&&!event.repeat){
      if(open())event.preventDefault();return;
    }
    if(!anyOpen())return;
    if(event.code==='Escape'){
      event.preventDefault();close(true);return;
    }
    if(event.code==='ArrowUp'||event.code==='ArrowDown'){
      const activeContainer=drawerOpen?drawer:shell;
      const buttons=[...activeContainer.querySelectorAll('button')].filter(b=>!b.disabled&&b.getClientRects().length);
      if(!buttons.length)return;
      event.preventDefault();
      const i=buttons.indexOf(document.activeElement);
      const shift=event.code==='ArrowUp'?-1:1;
      buttons[i<0?0:(i+shift+buttons.length)%buttons.length].focus();
    }
  }

  const previousResume=game.onResume;
  const resume=()=>{if(!close(true))previousResume?.();};
  game.onResume=resume;
  entry.addEventListener('click',openDropdown);
  backdrop.addEventListener('click',()=>close(true));
  document.addEventListener('keydown',keydown);
  const visTimer=typeof setInterval==='function'?setInterval(syncBarVisibility,180):null;
  syncBarVisibility();

  return Object.freeze({
    open,
    openDropdown,
    openSection,
    close:()=>close(true),
    inspect:()=>({
      opened:anyOpen(),
      modalOpen:modalVisible(),
      drawerOpen,
      tab,
      loaded:!!journal.readJournal(),
      navItemCount:ALL_NAV_ITEMS.length
    }),
    stop(){
      if(stopped)return;
      if(anyOpen())close(true);
      stopped=true;
      if(visTimer!==null&&typeof clearInterval==='function')clearInterval(visTimer);
      document.removeEventListener('keydown',keydown);
      document.body?.classList?.remove('aeon-nav-consolidated');
      navBar.remove();drawer.remove();backdrop.remove();shell.remove();
      if(game.onResume===resume)game.onResume=previousResume;
    }
  });
}
