// Live adapter for owner-installed narrative data. All story and staging stay private.
import {createNarrativeState,nextNarrativeScene,beginNarrativeScene,narrativeLines,
 acknowledgeNarrativeLine,applyNarrativeChoice,completeNarrativeScene,
 skipOptionalNarrativeScene,narrativeCondition} from './narrative-runtime.js';

const copy=value=>structuredClone(value);
const attached=(content,sceneId)=>content.choices.filter(choice=>choice.scene.split('/').includes(sceneId));
const isOptionalScene=(content,sceneId)=>
  content.insertions?.some(x=>x.scene_id===sceneId&&String(x.optional).toLowerCase()==='true');

// Choice placement is explicit source staging: null means before the first line;
// a line identifier means immediately after that line has been acknowledged.
// Missing bindings fail closed instead of moving every choice to a scene's end.
export function validateNarrativeStaging(content,sceneId,choiceGates){
  const scene=content.scenes.find(scene=>scene.id===sceneId);
  if(!scene)throw new Error('Unknown narrative scene');
  for(const choice of attached(content,sceneId)){
    const gate=choiceGates[choice.id];
    if(!gate||!Object.hasOwn(gate,'afterLine')||
       (gate.afterLine!==null&&!scene.dialogue.includes(gate.afterLine)))
      throw new Error('Narrative choice placement is not staged');
  }
}

export function mountCampaignNarrative({
 game,ui,content,readWorld,commitWorld,choiceGates={},
 canComplete=()=>true,onComplete=()=>{},onBlocked=()=>{},
 onShowLine=null,onChoicePrompt=null,onSceneEnd=null,
 formatSpeaker=null,formatText=null,
 choiceRoot=globalThis.document?.getElementById('dialog-choices')
}){
  if(!game||!ui||typeof readWorld!=='function'||typeof commitWorld!=='function')
    throw new TypeError('Narrative host is incomplete');
  let stopped=false,token=0,owned=false,priorMode=null;
  const snapshot=()=>{
    const world=copy(readWorld());
    const prior=world.narrative||{};
    const mergedFlags={...(prior.flags||{})};
    for(const [k,v] of Object.entries(world.flags||{}))if(v===true)mergedFlags[k]=true;
    return {world,state:createNarrativeState(content,{...prior,flags:mergedFlags})};
  };
  const blocked=reason=>{onBlocked(reason);return false;};
  const takeMode=mode=>{
    if(!owned){priorMode=game.mode;owned=true;}
    game.mode=mode;
  };
  const release=()=>{
    if(owned){
      ui.choiceCb=null;ui.cb=null;ui.line=null;ui.queue=[];
      ui.show?.('dialog',false);
      if(['dialog','choice'].includes(game.mode))game.mode=priorMode;
    }
    owned=false;priorMode=null;
  };
  // A successful synchronous write is required before any dependent UI/effect.
  function persist(world,state){
    const next={...world,narrative:state,flags:{...(world.flags||{}),...state.flags}};
    try{if(commitWorld(copy(next))!==true)return blocked('save');}
    catch{return blocked('save');}
    return true;
  }
  function transact(change){
    const {world,state}=snapshot();
    return persist(world,change(state));
  }
  function once(callback){
    const expected=++token;let used=false;
    return (...args)=>{
      if(stopped||used||token!==expected)return;
      used=true;callback(...args);
    };
  }
  function choose(prompt,options,callback){
    takeMode('choice');
    ui.choose(prompt,options,once(callback));
    // Original UI handles pointerdown. Native keyboard/controller click has
    // detail 0, and needs its own bridge without editing the locked UI source.
    const renderToken=token;
    choiceRoot?.querySelectorAll('button').forEach((button,index)=>{
      button.addEventListener('keydown',event=>{
        if(token!==renderToken||stopped)return;
        if(['Enter','Space'].includes(event.code)){
          event.preventDefault();event.stopPropagation();
          if(!event.repeat)ui.pick(index);
        }else if(['ArrowLeft','ArrowUp','ArrowRight','ArrowDown'].includes(event.code)){
          event.preventDefault();event.stopPropagation();
          const buttons=[...choiceRoot.querySelectorAll('button')];
          const delta=['ArrowLeft','ArrowUp'].includes(event.code)?-1:1;
          buttons[(index+delta+buttons.length)%buttons.length]?.focus();
        }
      });
      button.addEventListener('click',event=>{
        if(event.detail===0&&token===renderToken&&!stopped)ui.pick(index);
      });
    });
    choiceRoot?.querySelector('button')?.focus();
  }
  function pump(){
    if(stopped)return false;
    ++token;
    const {world,state}=snapshot(),id=state.activeScene;
    if(!id){onSceneEnd?.(null);release();return false;}
    try{validateNarrativeStaging(content,id,choiceGates);}
    catch{return blocked('staging');}
    const pending=attached(content,id).filter(choice=>!state.choices[choice.id]);
    const ready=pending.find(choice=>{
      const anchor=choiceGates[choice.id].afterLine;
      return anchor===null||state.linesRead[anchor];
    });
    if(ready){
      const drafts=state.choiceDrafts?.[ready.id]||[];
      if(!Array.isArray(drafts)||new Set(drafts).size!==drafts.length||
         drafts.length>=(ready.selection_count||1)||
         drafts.some(option=>!Object.hasOwn(ready.options,option)))
        return blocked('draft');
      const options=Object.keys(ready.options).filter(option=>!drafts.includes(option));
      onChoicePrompt?.({sceneId:id,choice:ready,world});
      choose(ready.prompt,options,index=>{
        if(!Number.isInteger(index)||index<0||index>=options.length){pump();return;}
        transact(current=>{
          const selected=[...(current.choiceDrafts?.[ready.id]||[]),options[index]];
          if(selected.length===(ready.selection_count||1)){
            const next=applyNarrativeChoice(content,current,ready.id,selected);
            if(next.choiceDrafts)delete next.choiceDrafts[ready.id];
            // Director's Cut v2 CHOICE-07 bridges mutually exclusive SC-042 / SC-043.
            if(ready.id==='CHOICE-07'){
              if(next.enums?.final_resolution==='isolate'&&id==='SC-042'){
                next.skipped={...(next.skipped||{}),'SC-042':true};
                delete next.skipped['SC-043'];
                next.activeScene='SC-043';
              }else if(next.enums?.final_resolution==='reclassify'&&id==='SC-043'){
                next.skipped={...(next.skipped||{}),'SC-043':true};
                delete next.skipped['SC-042'];
                next.activeScene='SC-042';
              }
            }
            return next;
          }
          return {...current,choiceDrafts:{...(current.choiceDrafts||{}),[ready.id]:selected}};
        });
        pump();
      });
      return true;
    }
    const allLines=narrativeLines(content,state);
    const lineIndex=allLines.findIndex(item=>!state.linesRead[item.line_id]);
    const line=lineIndex>=0?allLines[lineIndex]:null;
    if(line){
      takeMode('dialog');
      const rawSpeaker=line.speaker||'SYSTEM';
      const speaker=formatSpeaker?formatSpeaker(rawSpeaker,world):rawSpeaker;
      const text=formatText?formatText(line.text,world):line.text;
      onShowLine?.({sceneId:id,line:{...line,rawSpeaker,speaker,text},index:lineIndex,total:allLines.length,world});
      ui.say([{s:speaker,t:text}],once(()=>{
        transact(current=>acknowledgeNarrativeLine(content,current,line.line_id));
        pump();
      }));
      return true;
    }
    // A hidden/missing anchor is unresolved staging, never permission to guess.
    if(pending.length)return blocked('staging');
    // Combat/quest adapters may withhold completion until their saved outcome.
    if(canComplete(id,copy(world))!==true){onSceneEnd?.(id);release();return blocked('completion');}
    let complete=completeNarrativeScene(content,state,id);
    // Director's Cut v2 mutually exclusive finale branches SC-042 <-> SC-043:
    if(id==='SC-042'&&complete.enums?.final_resolution==='reclassify')
      complete={...complete,skipped:{...(complete.skipped||{}),'SC-043':true}};
    else if(id==='SC-043'&&complete.enums?.final_resolution==='isolate')
      complete={...complete,skipped:{...(complete.skipped||{}),'SC-042':true}};
    if(!persist(world,complete)){
      choose('SAVE FAILED — RETRY TO CONTINUE',['RETRY'],()=>pump());
      return false;
    }
    onSceneEnd?.(id);
    release();onComplete(id,copy(complete));return true;
  }
  return {
    trigger(triggerId,{sceneId}={}){
      if(stopped)return false;
      const {world,state:initialState}=snapshot();
      let state=initialState;
      if(state.activeScene)return blocked('active');
      let scene=nextNarrativeScene(content,state);
      // Skip pending optional scenes (e.g., SC-060 / SC-061) when advancing along main path,
      // or skip SC-042 if player triggered SELECT_ISOLATE directly.
      const skippedCandidates=[];
      while(scene&&scene.trigger!==triggerId){
        const canAutoSkip=isOptionalScene(content,scene.id)||
          (scene.id==='SC-042'&&triggerId==='SELECT_ISOLATE');
        if(!canAutoSkip)break;
        skippedCandidates.push(scene.id);
        state={...state,skipped:{...(state.skipped||{}),[scene.id]:true}};
        scene=nextNarrativeScene(content,state);
      }
      if(!scene||scene.trigger!==triggerId||(sceneId&&sceneId!==scene.id))return false;
      try{validateNarrativeStaging(content,scene.id,choiceGates);}
      catch{return blocked('staging');}
      const insertion=content.insertions?.find(x=>x.scene_id===scene.id);
      if(insertion&&!narrativeCondition(state,insertion.requires))return blocked('prerequisite');
      // Commit optional skips through validated runtime helper before beginning target scene.
      let committedState=initialState;
      for(const skipId of skippedCandidates){
        if(isOptionalScene(content,skipId))
          committedState=skipOptionalNarrativeScene(content,committedState,skipId);
        else
          committedState={...committedState,skipped:{...(committedState.skipped||{}),[skipId]:true}};
      }
      const next=beginNarrativeScene(content,committedState,scene.id,{trigger:triggerId});
      if(!persist(world,next))return false;
      pump();return true;
    },
    skipActiveLines(){
      if(stopped)return false;
      const {world,state}=snapshot();
      const id=state.activeScene;
      if(!id)return false;
      const pending=attached(content,id).filter(c=>!state.choices[c.id]);
      let current=state,advanced=0;
      for(;;){
        const nextPending=pending.find(c=>{
          const anchor=choiceGates[c.id]?.afterLine;
          return anchor===null||current.linesRead[anchor];
        });
        if(nextPending)break;
        const nextLine=narrativeLines(content,current).find(l=>!current.linesRead[l.line_id]);
        if(!nextLine)break;
        current=acknowledgeNarrativeLine(content,current,nextLine.line_id);
        advanced++;
      }
      if(advanced===0)return false;
      if(!persist(world,current))return false;
      pump();
      return true;
    },
    resume(){return pump();},
    inspect(){return copy(snapshot().state);},
    stop(){
      stopped=true;++token;
      if(owned){ui.choiceCb=null;ui.cb=null;ui.line=null;ui.queue=[];
        ui.show?.('dialog',false);onSceneEnd?.(null);release();}
    }
  };
}
