import {config,saveConfig,toast} from './app.js';
function announce(message,error=false){document.dispatchEvent(new CustomEvent('animation-upload',{detail:{message,error}}));}
async function inspect(file){
 const url=URL.createObjectURL(file),v=document.createElement('video');v.muted=true;v.preload='auto';
 try{await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('El navegador no pudo leer el video.')),18000);v.onloadeddata=()=>{clearTimeout(timer);resolve();};v.onerror=()=>{clearTimeout(timer);reject(Error('Este navegador no puede reproducir el video. Prueba un MP4 H.264.'));};v.src=url;v.load();});
  if(!v.videoWidth||!Number.isFinite(v.duration))throw Error('El archivo no contiene una animación válida.');
  let poster='';try{await new Promise((resolve,reject)=>{const timer=setTimeout(reject,4000);v.onseeked=()=>{clearTimeout(timer);resolve();};v.currentTime=Math.min(1,v.duration/3);});const c=document.createElement('canvas');c.width=Math.min(800,v.videoWidth);c.height=Math.round(c.width*v.videoHeight/v.videoWidth);c.getContext('2d').drawImage(v,0,0,c.width,c.height);poster=c.toDataURL('image/jpeg',.8);}catch{}
  return{poster,width:v.videoWidth,height:v.videoHeight,duration:v.duration};
 }finally{v.pause();v.removeAttribute('src');v.load();URL.revokeObjectURL(url);}
}
export function replaceAnimation({key,nodeId}){
 const input=document.createElement('input');input.type='file';input.accept='video/mp4,video/webm,.mp4,.webm';
 input.addEventListener('change',async()=>{const file=input.files?.[0];if(!file)return;const type=file.name.toLowerCase().endsWith('.webm')?'video/webm':file.name.toLowerCase().endsWith('.mp4')?'video/mp4':null;
  if(!type||file.size>40*1024*1024){toast('Elige un video MP4 o WebM de hasta 40 MB.');return;}
  announce('Revisando la nueva animación…');
  try{const metadata=await inspect(file);announce('Guardando el video en el proyecto…');const res=await fetch('/api/animations',{method:'POST',headers:{'Content-Type':type},body:file});const result=await res.json();if(!res.ok)throw Error(result.error||'No se pudo guardar el video.');
   if(key){saveConfig({...config,animations:{...config.animations,[key]:{src:result.src,poster:metadata.poster,name:file.name}}});}
   else if(nodeId){saveConfig({...config,visual:{...config.visual,nodes:{...config.visual.nodes,[nodeId]:{...config.visual.nodes[nodeId],src:result.src,poster:metadata.poster}}}});}
   announce('Animación reemplazada. Guardando los cambios…');toast('La nueva animación ya está en la página.');document.dispatchEvent(new Event('animation-changed'));
  }catch(e){announce(e.message||'No se pudo reemplazar la animación.',true);toast(e.message||'No se pudo reemplazar la animación.');}
 });input.click();
}
