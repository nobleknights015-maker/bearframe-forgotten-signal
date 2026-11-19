// Aeon Circuit: The Silent Wake — Complete Campaign Runtime Orchestrator.
// Built on the Ghost Signal JRPG engine; preserves original Ghost Signal missions & tests.
import {loadAeonV5,chooseStarter,buildV5WorldSheet,bindV5WorldSheet} from './aeon-v5-bridge.js';
import {createCampaignMissionFactory,campaignEntityAvailable} from './campaign-world.js';
import {createCampaignJournal} from './campaign-journal.js';
import {mountCampaignNarrative} from './campaign-narrative.js';
import {createConnectedFieldTravel} from './connected-field-travel.js';
import {compileCampaignCombatStaging} from './campaign-combat-staging.js';
import {mountCampaignBattle} from './campaign-battle.js';
import {mountCampaignFieldMenu} from './campaign-field-menu.js';
import {compileCampaignQuestJournal} from './campaign-quest-journal.js';
import {loadCampaignEnvironmentArt} from './campaign-environment-art.js';
import {mountCampaignBackupUI} from './campaign-backup-ui.js';
import {createCampaignSecurityRuntime} from './campaign-security-runtime.js';
import {createCampaignAudio} from './campaign-audio.js';
import {createCampaignCinematics,formatCampaignDialogue,formatCampaignSpeaker} from './campaign-cinematics.js';

const ROOT=new URL('../../assets/aeon/',import.meta.url);
const STARTERS=Object.freeze(['sleeper_A','sleeper_B','sleeper_C','sleeper_D']);
const $=id=>document.getElementById(id);

const COMPANION_TEMPLATES=Object.freeze({
  pica:{
    id:'pica',artId:'ghostgrid_utility_pica',lineage:'ghost-grid',name:'Pica',
    hp:26,maxHp:26,ep:16,maxEp:16,attack:7,defense:3,speed:14,
    skills:['pulse','repair','guard'],level:1,xp:0
  },
  rill:{
    id:'rill',artId:'echo_industrial_maintenance',lineage:'echo',name:'Rill',
    hp:42,maxHp:42,ep:20,maxEp:20,attack:10,defense:6,speed:10,
    skills:['repair','guard'],level:2,xp:0
  },
  miya:{
    id:'miya',artId:'bearframe_exploration_miya',lineage:'modern',name:'Miya',
    hp:46,maxHp:46,ep:22,maxEp:22,attack:13,defense:5,speed:16,
    skills:['pulse','repair','guard'],level:3,xp:0
  }
});

async function readPrivate(path){
  const result=await fetch(new URL(path,ROOT),{cache:'no-store'});
  if(!result.ok)throw new Error('Private campaign installation missing: '+path+' (HTTP '+result.status+')');
  return result.json();
}
const saveFor=id=>'bearframe_aeon_campaign_'+id+'_v1';

// Confirmation uses EXISTING industrial Ghost Signal buttons; never native confirm().
function confirmReplacement(id){
  return new Promise(resolve=>{
    const layer=document.createElement('div');layer.className='overlay';layer.id='aeon-confirm';layer.style.zIndex='60';
    const panel=document.createElement('section');panel.className='panel case';panel.setAttribute('role','dialog');
    panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Replace saved campaign');
    const title=document.createElement('h2');title.textContent='REPLACE '+id.replace('_',' ').toUpperCase()+' RECORD?';panel.append(title);
    const close=choice=>{document.removeEventListener('keydown',keys);layer.remove();resolve(choice);};
    const keys=event=>{if(event.code==='Escape'){event.preventDefault();close(false);}else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.code)){
      event.preventDefault();const buttons=[...panel.querySelectorAll('button')];buttons[buttons.indexOf(document.activeElement)===0?1:0].focus();}};
    for(const [text,value] of [['KEEP RECORD',false],['REPLACE RECORD',true]]){
      const b=document.createElement('button');b.className='menu-btn';b.textContent=text;
      b.onclick=()=>close(value);panel.append(b);
    }
    layer.append(panel);$('stage').append(layer);document.addEventListener('keydown',keys);
    panel.querySelector('button')?.focus();
  });
}

export async function mountCampaignGame({game,ui,sfx,touchMode,refreshTouch}){
  const title=$('title');document.title='AEON CIRCUIT: THE SILENT WAKE';
  const h1=title.querySelector('h1');h1.replaceChildren(document.createTextNode('AEON CIRCUIT'),document.createElement('br'));
  const subtitle=document.createElement('span');subtitle.textContent='THE SILENT WAKE';h1.append(subtitle);
  title.querySelector('.kicker').textContent='AEON CIRCUIT // DIRECTOR\'S CUT V2';
  title.querySelector('.fine').textContent='Built on the Ghost Signal JRPG engine. Original Ghost Signal missions remain at /index.html.';
  title.querySelector('.title-art').classList.add('hidden');$('btn-m2').classList.add('hidden');
  $('btn-new').textContent='NEW CAMPAIGN';
  const [manifest,content,worldSpec]=await Promise.all([
    loadAeonV5(),readPrivate('story/campaign.json'),readPrivate('story/opening-world-review-candidate.json')
  ]);
  if(worldSpec?.status!=='authored-blockout-review-candidate'||worldSpec.campaignRevision!==content.revision)
    throw new Error('Campaign layout is absent or does not match the approved story revision');

  const combatStaging=compileCampaignCombatStaging(worldSpec.combat,{worldSpec,content,manifest});
  const questJournal=compileCampaignQuestJournal(content,worldSpec);
  const environmentArt=await loadCampaignEnvironmentArt({
    requireInstalled:worldSpec.requiresEnvironmentArt===true
  });
  const areaCount=worldSpec.maps?.length||0;
  title.querySelector('.sub').textContent=combatStaging
    ? `ACTS 0–9 // ${areaCount} CONNECTED SECTORS · SIDE-VIEW COMBAT`
    : `STORY + EXPLORATION // ${areaCount} CONNECTED SECTORS`;
  title.querySelector('.motto').textContent='"Some sleepers wake to carry orders. Others wake to answer who was left."';

  const hasSave=id=>{try{return localStorage.getItem(saveFor(id)+':A')!==null||
    localStorage.getItem(saveFor(id)+':B')!==null;}catch{return false;}};
  $('btn-continue').disabled=!STARTERS.some(hasSave);
  const backupUI=mountCampaignBackupUI({title,storage:localStorage,content,worldSpec,
    confirmReplacement,hasSave,
    onImported:()=>{$('btn-continue').disabled=!STARTERS.some(hasSave);}
  });

  const followerCache=new Map();
  const getFollowerSheet=artId=>{
    if(!artId)return null;
    if(followerCache.has(artId))return followerCache.get(artId);
    const img=new Image();
    const rec={img,ready:false};
    img.onload=()=>{rec.ready=img.naturalWidth>=144&&img.naturalHeight>=64;};
    img.onerror=()=>{rec.ready=false;};
    img.src=new URL('assets/world/'+artId+'.png',ROOT).href;
    followerCache.set(artId,rec);
    return rec;
  };

  let busy=false,active=null;
  async function begin(continuing){
    if(busy)return;busy=true;
    backupUI.close();
    try{
      sfx.init();game.mode='rpgmenu';
      const starterId=await chooseStarter(manifest,{cancel:true,
        title:continuing?'CONTINUE CAMPAIGN // SELECT SLEEPER':'NEW CAMPAIGN // SELECT SLEEPER',
        description:'Four approved Sleeper chassis identities. Portraits, field sprites, and battle sheets match your choice.',
        enabled:id=>!continuing||hasSave(id)});
      if(!starterId){game.mode='title';return;}
      if(!continuing&&hasSave(starterId)&&!await confirmReplacement(starterId)){
        game.mode='title';return;
      }
      const field=await buildV5WorldSheet(manifest,starterId);
      const journal=createCampaignJournal({storage:localStorage,starterId,content,worldSpec,
        bootstrap:combatStaging?{
          party:combatStaging.roster(starterId),
          activeParty:combatStaging.roster(starterId).slice(0,3).map(x=>x.id),
          inventory:{'repair-kit':2,'coolant-pack':1},
          stats:{callsign:'Kestrel',pronouns:'they/them'},
          progression:{xp:0}
        }:{
          party:[{id:'sleeper',artId:starterId}],
          inventory:{'repair-kit':2},
          stats:{callsign:'Kestrel',pronouns:'they/them'}
        }});
      if(continuing? !journal.load():!journal.newGame())throw new Error('Campaign journal could not be loaded/saved');
      if(combatStaging){
        const savedWorld=journal.readWorld();
        if(savedWorld.party?.[0]?.artId!==starterId)
          throw new Error('Saved campaign portrait differs from starter');
        if(!savedWorld.party?.[0]?.maxHp){
          if(savedWorld.party.length!==1||savedWorld.party[0].id!=='sleeper')
            throw new Error('Old party needs reviewed combat migration');
          savedWorld.party=combatStaging.roster(starterId);
          savedWorld.activeParty=savedWorld.party.slice(0,3).map(x=>x.id);
          savedWorld.progression??={xp:0};
          if(!journal.commitWorld(savedWorld))throw new Error('Combat migration not saved');
        }
      }

      active?.fieldMenu?.stop();active?.combat?.stop();active?.narrative.stop();active?.audio?.stop();active=null;
      let narrative=null,combat=null,traveler=null;
      const narrativeRef={current:null};
      const audio=createCampaignAudio(sfx);

      const commitWorld=next=>{
        const prior=journal.readJournal();if(!prior)return false;
        if(!game.m||!journal.graph.get(game.m.id))return journal.commitWorld(next);
        const snap=game.snapshot();
        const maps={...prior.maps,[game.m.id]:snap};
        return journal.writeJournal({...prior,mapId:game.m.id,maps,field:snap,world:next});
      };

      const cinematics=createCampaignCinematics({
        game,ui,content,sfx,readWorld:journal.readWorld,commitWorld,narrativeRef
      });

      const syncFollowers=()=>{
        const world=journal.readWorld();
        const ids=Array.isArray(world?.activeParty)&&world.activeParty.length
          ? world.activeParty
          : (world?.party||[]).map(u=>u.id);
        const followers=[];
        for(const id of ids){
          if(id==='sleeper')continue;
          const unit=world?.party?.find(u=>u.id===id);
          if(!unit?.artId)continue;
          const rec=getFollowerSheet(unit.artId);
          followers.push({id:unit.id,artId:unit.artId,get sheet(){return rec.ready?rec.img:null;}});
        }
        game.partyFollowers=followers;
      };

      const updateHudArea=(areaId)=>{
        const area=worldSpec.maps.find(m=>m.id===areaId);
        const tag=$('campaign-area-tag');
        if(tag){
          if(area){
            tag.textContent=`${area.id} · ${area.name.toUpperCase()}`;
            tag.classList.remove('hidden');
          }else tag.classList.add('hidden');
        }
        if(areaId)audio.setAreaTheme(areaId);
      };

      const recruitCompanion=(companionId,flagRequired,announce)=>{
        const world=journal.readWorld();
        if(!world||!world.flags?.[flagRequired])return;
        if(world.party.some(u=>u.id===companionId))return;
        const tpl=COMPANION_TEMPLATES[companionId];
        if(!tpl)return;
        const next=structuredClone(world);
        next.party.push({...tpl});
        next.equipment[companionId] ??= companionId==='rill'?{weapon:'echo-clamp'}:{};
        if(Array.isArray(next.activeParty)&&next.activeParty.length<3&&!next.activeParty.includes(companionId)){
          next.activeParty.push(companionId);
        }
        if(commitWorld(next)){
          syncFollowers();
          ui.toast(announce,3);
        }
      };

      const blocked=reason=>{
        if(reason==='completion'){
          const scene=journal.readWorld()?.narrative?.activeScene;
          const mandatory=journal.pendingCombat(scene);
          if(mandatory&&combat?.start(mandatory.encounterId))return;
          ui.toast('PROGRESSION HELD — SAVED ENCOUNTER OUTCOME REQUIRED',4);
        }
        else if(reason==='save')ui.toast('CAMPAIGN SAVE FAILED — RETRY',3);
        else if(reason==='staging')ui.toast('SCENE STAGING REQUIRES AUTHOR REVIEW',3);
        else if(reason==='prerequisite')ui.toast('STORY PREREQUISITE NOT YET MET',2.5);
      };

      narrative=mountCampaignNarrative({
        game,ui,content,
        readWorld:journal.readWorld,
        commitWorld,
        choiceGates:worldSpec.choiceGates||{},
        canComplete:journal.canComplete,
        onBlocked:blocked,
        formatSpeaker:(sp,w)=>formatCampaignSpeaker(sp,w,starterId),
        formatText:(txt,w)=>formatCampaignDialogue(txt,w),
        onShowLine:({sceneId,line,index,total})=>{
          cinematics.updatePortrait(line.speaker,starterId);
          cinematics.showStoryboardShot({sceneId,index,total,areaId:game.m?.id||'A00',starterId});
          cinematics.recordLine({speaker:line.speaker,text:line.text,sceneId});
        },
        onChoicePrompt:({sceneId})=>{
          cinematics.updatePortrait('SYSTEM',starterId);
          sfx.blip();
        },
        onSceneEnd:()=>{
          cinematics.hideStoryboard();
        },
        onComplete:async sceneId=>{
          // Handle Director's Cut milestones, companion joins, Act 2 bridge, Callsign prompt, and Epilogue
          const world=journal.readWorld();
          if(sceneId==='SC-001'&&world&&!world.flags?.callsign_customized){
            const prevMode=game.mode;
            game.mode='rpgmenu';
            const res=await cinematics.promptCallsign(world);
            const updated=journal.readWorld();
            if(updated){
              updated.stats={...(updated.stats||{}),callsign:res.callsign,pronouns:res.pronouns};
              updated.flags={...(updated.flags||{}),callsign_customized:true};
              commitWorld(updated);
            }
            if(game.mode==='rpgmenu')game.mode=prevMode==='battle'?'battle':'play';
          }
          if(sceneId==='SC-006')recruitCompanion('pica','pica_repaired','PICA JOINED SUPPORT ROSTER');
          if(sceneId==='SC-011')recruitCompanion('rill','rill_joined','RILL JOINED THE PARTY');
          if(sceneId==='SC-024')recruitCompanion('miya','miya_joined','MIYA JOINED THE PARTY');
          if(sceneId==='SC-014'){
            const w2=journal.readWorld();
            if(w2&&!w2.flags?.act2_complete){
              w2.flags={...(w2.flags||{}),act2_complete:true};
              commitWorld(w2);
            }
          }
          syncFollowers();
          if(sceneId==='SC-047'){
            cinematics.openEpilogueCredits(journal.readWorld(),game.stats);
          }else{
            ui.toast('FIELD RECORD UPDATED',2);
          }
        }
      });
      narrativeRef.current=narrative;

      const invoke=(trigger,sceneId)=>{
        if(game.mode!=='play'||!trigger)return false;
        if(combat?.startForTrigger(trigger,game.m?.id))return true;
        const running=journal.readWorld()?.narrative?.activeScene;
        if(running){
          const staged=content.scenes.find(s=>s.id===running);
          if(staged?.trigger===trigger)return narrative.resume();
        }
        return narrative.trigger(trigger,{sceneId});
      };

      if(combatStaging){
        combat=mountCampaignBattle({game,ui,journal,staging:combatStaging,
          manifest,starterId,touchMode,audio,
          onSavedVictory:()=>{syncFollowers();narrative.resume();}});
      }

      const fastTravelTo=async targetMapId=>{
        if(!traveler||traveler.busy||game.mode!=='play'||!targetMapId||targetMapId===game.m?.id)return false;
        const targetMission=await factory.missionFor(targetMapId);
        const prior=journal.readJournal();
        if(!prior)return false;
        const nextSnap=prior.maps?.[targetMapId]||{mission:targetMapId,player:{...targetMission.start}};
        const updated={...prior,mapId:targetMapId,field:nextSnap,
          world:{...prior.world,location:{mapId:targetMapId,x:targetMission.start.x,y:targetMission.start.y,facing:targetMission.start.dir}}};
        if(!journal.writeJournal(updated))return false;
        game.start(targetMission,prior.maps?.[targetMapId]?.mission===targetMapId?prior.maps[targetMapId]:null);
        syncFollowers();
        updateHudArea(targetMapId);
        audio.saveTerminal();
        ui.toast('RELAY TRANSIT TO '+targetMapId,2);
        return true;
      };

      const playSideDialogue=(dialogueRows,flagToSet,toastMsg)=>{
        if(!dialogueRows.length)return false;
        const lines=dialogueRows.map(d=>({
          s:formatCampaignSpeaker(d.speaker,journal.readWorld(),starterId),
          t:formatCampaignDialogue(d.text,journal.readWorld())
        }));
        game.mode='dialog';
        let idx=0;
        const showNext=()=>{
          if(idx>=lines.length){
            game.mode='play';
            cinematics.hideStoryboard();
            if(flagToSet){
              const w=journal.readWorld();
              if(w&&!w.flags?.[flagToSet]){
                w.flags={...(w.flags||{}),[flagToSet]:true};
                commitWorld(w);
              }
            }
            if(toastMsg)ui.toast(toastMsg,2.5);
            return;
          }
          const line=lines[idx++];
          cinematics.updatePortrait(line.s,starterId);
          cinematics.recordLine({speaker:line.s,text:line.t,sceneId:flagToSet||'SIDE'});
          ui.say([line],showNext);
        };
        showNext();
        return true;
      };

      const security=createCampaignSecurityRuntime({
        worldSpec,readWorld:journal.readWorld,commitWorld,
        encounterFor:(id,mapId)=>{
          const staged=combatStaging?.encounter(id);
          return staged?.mapId===mapId?staged:null;
        },
        onEncounter:id=>{
          if(!combat?.start(id))
            ui.toast('SECURITY ENCOUNTER REQUIRES AUTHOR REVIEW',2);
        },
        onSaveFailure:()=>ui.toast('SECURITY RECORD NOT SAVED — RETRY',3)
      });

      const factory=createCampaignMissionFactory(worldSpec,{
        environmentArt,
        getWorld:journal.readWorld,
        onInteract(e){
          if(!campaignEntityAvailable(e,journal.readWorld()?.flags)){
            ui.toast('ACCESS SEALED — SOURCE MILESTONE REQUIRED',2);return;
          }
          if(e.type==='save'){
            const prior=journal.readJournal();
            const visitedIds=Object.keys(prior?.maps||{}).filter(id=>id!==game.m?.id);
            const fastTravelTargets=worldSpec.maps
              .filter(m=>m.saveTerminal&&visitedIds.includes(m.id))
              .map(m=>({id:m.id,name:m.name}));
            cinematics.openSaveTerminal({
              areaName:game.m?.title||game.m?.id,
              journal,
              fastTravelTargets,
              onFastTravel:fastTravelTo,
              onHealAndSave:()=>{
                const w=journal.readWorld();
                if(!w)return false;
                for(const m of w.party||[]){
                  m.hp=m.maxHp;
                  m.ep=m.maxEp||0;
                }
                game.player.energy=100;
                const ok=commitWorld(w)&&journal.saveField(game.m.id,game.snapshot());
                if(ok)audio.saveTerminal();
                return ok;
              }
            });
            return;
          }
          if(e.type==='crate'&&e.grantItems){
            const w=journal.readWorld();
            if(w&&(!e.hideAfterFlag||!w.flags?.[e.hideAfterFlag])){
              const next=structuredClone(w);
              next.inventory=next.inventory||{};
              const list=[];
              for(const [k,qty] of Object.entries(e.grantItems)){
                next.inventory[k]=(next.inventory[k]||0)+qty;
                list.push(`${k.toUpperCase()} x${qty}`);
              }
              if(e.hideAfterFlag)next.flags[e.hideAfterFlag]=true;
              if(commitWorld(next)){
                e.gone=true;
                audio.puzzleSolve();
                ui.toast('RECOVERED: '+list.join(', '),3);
              }
            }
            return;
          }
          if(e.sidequestId){
            const rows=(content.dialogue||[]).filter(d=>d.scene_id===e.sidequestId);
            const sq=content.quests?.find(q=>q.id===e.sidequestId);
            if(playSideDialogue(rows,sq?.completion_flags,sq?`QUEST COMPLETE: ${sq.title.toUpperCase()}`:null))return;
          }
          if(e.ambientArea){
            const rows=(content.dialogue||[]).filter(d=>d.area===e.ambientArea&&d.scene_id==='ambient');
            if(playSideDialogue(rows,null,null))return;
          }
          if(e.encounterId){
            const encSpec=content.encounters?.find(en=>en.id===e.encounterId);
            if(encSpec){
              if(encSpec.kind==='battle'||encSpec.kind==='boss'){
                if(combat?.start(encSpec.id))return;
              }
              if(journal.readWorld()?.encounters?.[encSpec.id]?.outcome==='victory'){
                ui.toast('APPARATUS ALREADY STABILIZED',2);return;
              }
              cinematics.openNoncombatEncounter(encSpec,resolved=>{
                const w=journal.readWorld();
                if(!w)return;
                const next=structuredClone(w);
                next.encounters=next.encounters||{};
                next.encounters[resolved.id]={outcome:'victory'};
                if(resolved.set_flag)next.flags[resolved.set_flag]=true;
                next.progression=next.progression||{xp:0};
                next.progression.xp=(next.progression.xp||0)+15;
                if(commitWorld(next)){
                  audio.puzzleSolve();
                  ui.toast(`${resolved.id} RESOLVED (+15 XP)`,2.5);
                }
                if(e.trigger)invoke(e.trigger,e.sceneId);
              });
              return;
            }
          }
          if(e.type==='bench'&&!e.trigger){
            const w=journal.readWorld();
            if(w){
              for(const m of w.party||[]){m.hp=m.maxHp;m.ep=m.maxEp||0;}
              game.player.energy=100;
              commitWorld(w);
              audio.battleRepair();
              ui.toast('RESTED AT BENCH — INTEGRITY & EP RESTORED',2.5);
            }
            return;
          }
          if(!e.trigger){ui.toast('OBJECT AWAITS AUTHOR REVIEW',2);return;}
          invoke(e.trigger,e.sceneId);
        },
        onTrigger(t){invoke(t.trigger,t.sceneId);},
        onUpdate(g){security.tick(g);},
        onEnter(m){
          updateHudArea(m.id);
          syncFollowers();
          if(!m.entryTrigger)return;
          // Game.start runs during travel. Trigger ONLY after travel is durably saved.
          setTimeout(()=>{
            if(game.m?.id===m.id&&game.mode==='play'){
              const next=content.scenes.find(s=>s.trigger===m.entryTrigger);
              invoke(m.entryTrigger,next?.id);
            }
          },0);
        },
        onPortal(id){
          // Only the original Game INTERACT action on a rendered bulkhead,
          // hatch, or lift enters a route. Walking onto a tile never teleports.
          if(!id||game.mode!=='play'||traveler?.busy)return;
          traveler.transition(id).then(ok=>{
            if(!ok)ui.toast('ENTRANCE SEALED — STORY MILESTONE REQUIRED',3);
            else{
              syncFollowers();
              updateHudArea(game.m?.id);
              ui.toast('AREA RECORD SAVED',1.8);
            }
          }).catch(error=>{console.warn('Campaign doorway rolled back',error);
            ui.toast('ENTRANCE UNAVAILABLE — PREVIOUS AREA RESTORED',3);});
        }
      });

      traveler=createConnectedFieldTravel({game,graph:factory.graph,
        missionFor:factory.missionFor,
        readJournal:journal.readJournal,writeJournal:journal.writeJournal});

      // Game.start's original save adapter must never write main's Wraith records.
      game.store={save:()=>true,clear:()=>{},loadProgress:()=>({unlocked:{},done:{},case:null}),saveProgress:()=>true};
      bindV5WorldSheet(game,field);
      const current=journal.readJournal(),area=current.mapId;
      const previousSnapshot=current.maps?.[area]||current.field;
      game.start(factory.missionForSync(area),previousSnapshot?.mission===area?previousSnapshot:null);
      syncFollowers();
      updateHudArea(area);
      ui.show('title',false);ui.show('ending',false);refreshTouch();
      active={journal,narrative,combat,factory,traveler,starterId,security,audio,cinematics};

      if(!continuing){
        if(!journal.saveField(area,game.snapshot()))throw new Error('Fresh field position could not be saved');
        invoke(worldSpec.openingScene.trigger,worldSpec.openingScene.sceneId);
      }else if(journal.readJournal()?.battle){
        if(!combat?.resume())throw new Error('Saved battle cannot be restored');
      }else if(journal.readWorld()?.narrative?.activeScene)narrative.resume();

      window.__campaign=Object.freeze({
        inspect:()=>({starterId,mapId:game.m?.id||null,mode:game.mode,
          story:journal.readWorld()?.narrative?.activeScene||null,
          battle:combat?.inspect()||null,
          saved:journal.inspect(),security:journal.readWorld()?.security||null,
          areaCount:factory.graph.ids.length,
          status:'authored-blockout-review-candidate'}),
        save:()=>journal.saveField(game.m.id,game.snapshot()),
        world:()=>journal.readWorld(),
        skipScene:()=>narrative.skipActiveLines()
      });
      $('btn-save').onclick=()=>{$('pause-note').textContent=window.__campaign.save()?'CAMPAIGN RECORD SAVED':'CAMPAIGN SAVE FAILED — REMAIN HERE';};
      $('btn-quit').onclick=()=>{
        if(window.__campaign.save())location.assign(new URL('campaign.html',location.href).href);
        else $('pause-note').textContent='CAMPAIGN SAVE FAILED — REMAIN HERE';};
      active.fieldMenu=mountCampaignFieldMenu({game,ui,journal,touchMode,questJournal,onOpenLog:cinematics.openLogModal,audio});
    }catch(error){
      console.error('Private campaign preview failed',error);
      game.mode='title';ui.show('title',true);
      ui.toast('CAMPAIGN PREVIEW UNAVAILABLE — VERIFY PRIVATE ART AND STAGING',5);
    }finally{busy=false;}
  }
  $('btn-new').onclick=()=>begin(false);
  $('btn-continue').onclick=()=>begin(true);

  const saveFieldOnLifecycle=()=>{
    if(!active||!game.m||!['play','pause'].includes(game.mode)||
       active.journal.readJournal()?.battle)return false;
    return active.journal.saveField(game.m.id,game.snapshot());
  };
  addEventListener('ghost-signal-host-pause',saveFieldOnLifecycle);
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden)saveFieldOnLifecycle();
  });
  $('btn-pause').addEventListener('click',()=>{
    if(game.mode==='pause')saveFieldOnLifecycle();
  });
  return {get active(){return !!active;}};
}