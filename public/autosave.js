export function createProjectSync({isEditor,getConfig,applyConfig,validate,storage,key}){
 const META='dulce-sorpresa-sync-v1';let timer,pending=null,running=false,ready=false,familyBaseline;
 let status={state:'loading',message:'Cargando cambios guardados…'};
 function emit(state,message){status={state,message};document.dispatchEvent(new CustomEvent('save-state',{detail:status}));}
 function markDirty(){storage.write(META,{dirty:true,editedAt:Date.now()});}
 async function flush(){clearTimeout(timer);if(!isEditor||!ready||running||!pending)return;running=true;const snapshot=pending;pending=null;emit('saving','Guardando automáticamente…');
  try{const res=await fetch('/api/config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...snapshot,_familyBaseline:familyBaseline})});if(!res.ok){const data=await res.json().catch(()=>({}));throw Error(res.status===401||res.status===403?'Tu sesión de administrador terminó. Recarga e ingresa de nuevo; tus cambios están respaldados en este navegador.':data.error||'No se pudo conectar. Tus cambios están respaldados en este navegador.');}const data=await res.json();familyBaseline=structuredClone(data.families||snapshot.families);if(data.familyRevision&&data.familyRevision!==snapshot.familyRevision){const latest=pending||getConfig();if(JSON.stringify(latest.families)===JSON.stringify(snapshot.families)){const merged={...latest,families:data.families,familyRevision:data.familyRevision};if(pending)pending=merged;applyConfig(merged);storage.write(key,merged);}}if(!pending){storage.write(META,{dirty:false,savedAt:data.savedAt});emit('saved','Guardado automáticamente · '+new Intl.DateTimeFormat('es-HN',{hour:'numeric',minute:'2-digit',second:'2-digit'}).format(new Date(data.savedAt)));}else emit('saving','Guardando automáticamente…');}
  catch(error){if(!pending)pending=snapshot;emit('error',error.message||'Respaldo en este navegador · pendiente guardar en el proyecto');}
  finally{running=false;if(pending&&status.state!=='error')flush();}
 }
 function schedule(config,localSaved){if(!isEditor)return;pending=structuredClone(config);markDirty();emit('saving',localSaved?'Guardando automáticamente…':'Guardando en el proyecto…');clearTimeout(timer);timer=setTimeout(flush,450);}
 async function start(){
  try{const res=await fetch('/api/config',{cache:'no-store'});if(!res.ok)throw Error();const data=await res.json();familyBaseline=structuredClone(data.config?.families);ready=true;
   const meta=storage.read(META,null),local=storage.read(key,null);
   if(isEditor&&(pending||meta?.dirty||(local&&!meta))){pending=pending||getConfig();markDirty();await flush();}
   else if(data.config){const c=validate(data.config);applyConfig(c);if(isEditor){storage.write(key,c);storage.write(META,{dirty:false,savedAt:data.savedAt});}emit('saved','Cambios guardados en el proyecto');}
   else if(isEditor){pending=getConfig();await flush();}
   else emit('saved','Vista local');
  }catch{ready=true;emit('error','Guardado local disponible · servidor de respaldo no disponible');if(pending)flush();}
 }
 window.addEventListener('online',flush);window.addEventListener('blur',flush);document.addEventListener('visibilitychange',()=>{if(document.hidden)flush();});
 async function finish(){clearTimeout(timer);if(!isEditor)return true;for(let i=0;i<100;i++){if(ready&&!running){if(pending){await flush();if(status.state==='error')return false;}else return status.state==='saved';}await new Promise(r=>setTimeout(r,100));}return false;}
 return{schedule,start,finish,retry(){pending=getConfig();markDirty();flush();},get status(){return status;}};
}
