const validId=s=>typeof s==='string'&&/^[\w-]{1,100}$/.test(s)&&!['__proto__','constructor','prototype'].includes(s);
export const isPlainText=node=>node&&!node.classList.contains('decoration')&&['H1','H2','H3','H4','P','SPAN','EM','STRONG','LABEL','LEGEND','A','BUTTON','SMALL','SUMMARY'].includes(node.tagName)&&!node.children.length;
export function safeAsset(src){return typeof src==='string'&&src.length<1800000&&(/^(?:data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+|assets\/[\w-]+\.(?:jpg|png|svg|mp4|webm))$/.test(src));}
const numeric={x:[-3000,3000],y:[-3000,3000],width:[20,2400],height:[20,2400],fontSize:[8,240],opacity:[0,1],radius:[0,300],spacing:[-5,30],lineHeight:[.7,4]};
export function cleanStyle(raw){const s={};if(!raw||typeof raw!=='object')return s;for(const[k,[min,max]]of Object.entries(numeric))if(Number.isFinite(raw[k])){const p=k==='opacity'||k==='lineHeight'?100:10;s[k]=Math.round(Math.min(max,Math.max(min,raw[k]))*p)/p;}for(const k of ['color','background'])if(/^#[\da-f]{6}$/i.test(raw[k]))s[k]=raw[k];if(['left','center','right'].includes(raw.align))s.align=raw.align;if(['Georgia','Trebuchet MS','Arial'].includes(raw.font))s.font=raw.font;for(const k of ['bold','italic'])if(typeof raw[k]==='boolean')s[k]=raw[k];return s;}
export function validateVisual(raw){const v={nodes:{},additions:[]};if(!raw||typeof raw!=='object')return v;
 for(const[id,n]of Object.entries(raw.nodes||{}).slice(0,600)){if(!validId(id)||!n||typeof n!=='object')continue;const next={styles:cleanStyle(n.styles),mobileStyles:cleanStyle(n.mobileStyles)};if(typeof n.text==='string')next.text=n.text.slice(0,3000);if(typeof n.hidden==='boolean')next.hidden=n.hidden;if(safeAsset(n.src))next.src=n.src;if(typeof n.placeholder==='string')next.placeholder=n.placeholder.slice(0,200);if(typeof n.href==='string'&&(/^(?:https:\/\/|mailto:)/.test(n.href)||['#/bienvenida','#/registro','#/confirmacion'].includes(n.href)))next.href=n.href.slice(0,2000);v.nodes[id]=next;}
 for(const[id,n]of Object.entries(v.nodes)){const p=raw.nodes[id]?.poster;if(p===''||safeAsset(p))n.poster=p;}
 const ids=new Set();for(const a of (Array.isArray(raw.additions)?raw.additions:[]).slice(0,80)){if(!a||!validId(a.id)||ids.has(a.id)||!['text','button','image','video'].includes(a.type)||!['bienvenida','registro','confirmacion'].includes(a.page))continue;ids.add(a.id);v.additions.push({id:a.id,type:a.type,page:a.page,text:typeof a.text==='string'?a.text.slice(0,3000):'Nuevo texto',src:safeAsset(a.src)?a.src:'assets/miel.svg',href:typeof a.href==='string'&&['#/bienvenida','#/registro','#/confirmacion'].includes(a.href)?a.href:(/^https:\/\//.test(a.href||'')?a.href.slice(0,2000):'#/registro'),anchor:validId(a.anchor)?a.anchor:null,background:a.type==='image'&&a.background===true,sceneIndex:Number.isInteger(a.sceneIndex)?Math.max(0,Math.min(20,a.sceneIndex)):0});}return v;
}
const originals=new Map();let count=0;
export function resetMotherVisual(){
 for(const [node,base]of originals)if(node.isConnected&&!node.isContentEditable&&node.closest('.mother-summary')){node.style.cssText=base.style;node.hidden=base.hidden;if(base.text!==null)node.textContent=base.text;}
}
export function renderMotherVisual(visual){
 for(const node of document.querySelectorAll('[data-mother-editable]')){
  register(node);const n=visual.nodes[node.dataset.veId];if(!n)continue;
  if('hidden'in n)node.hidden=n.hidden;if(typeof n.text==='string'&&isPlainText(node))node.textContent=n.text;
  applyStyle(node,matchMedia('(max-width:650px)').matches?n.mobileStyles:n.styles);
 }
 document.dispatchEvent(new Event('visual-rendered'));
}
export function resetVisual(){
 document.querySelectorAll('.decoration.ve-custom-decoration').forEach(n=>{n.replaceChildren();n.classList.remove('ve-custom-decoration');});
 for(const[node,base]of originals){if(!node.isConnected){originals.delete(node);continue;}node.style.cssText=base.style;node.hidden=base.hidden;if(base.text!==null)node.textContent=base.text;if(base.src!==null)node.setAttribute('src',base.src);if(base.href!==null)node.setAttribute('href',base.href);if(base.placeholder!==null)node.setAttribute('placeholder',base.placeholder);}
 document.querySelectorAll('[data-visual-added]').forEach(n=>n.remove());
}
function register(node){if(!originals.has(node))originals.set(node,{style:node.style.cssText,hidden:node.hidden,text:isPlainText(node)?node.textContent:null,src:node.getAttribute('src'),href:node.getAttribute('href'),placeholder:node.getAttribute('placeholder')});}
export function visualNode(id){return [...document.querySelectorAll('[data-ve-id]')].find(n=>n.dataset.veId===id)||null;}
export function applyStyle(node,s){
 if((s.width||'x'in s||'y'in s)&&getComputedStyle(node).display==='inline')node.style.display='inline-block';
 if('x'in s||'y'in s)node.style.translate=`${s.x||0}px ${s.y||0}px`;
 if(s.width){node.style.width=`min(${s.width}px, 100%)`;node.style.maxWidth='100%';}
 if(s.height)node.style.height=s.height+'px';
 if(s.fontSize)node.style.fontSize=s.fontSize+'px';if(s.font)node.style.fontFamily=s.font;
 if(s.color)node.style.color=s.color;if(s.background)node.style.backgroundColor=s.background;
 if(s.align)node.style.textAlign=s.align;if('opacity'in s)node.style.opacity=s.opacity;
 if('radius'in s)node.style.borderRadius=s.radius+'px';if('spacing'in s)node.style.letterSpacing=s.spacing+'px';if(s.lineHeight)node.style.lineHeight=s.lineHeight;
 if('bold'in s)node.style.fontWeight=s.bold?'700':'400';if('italic'in s)node.style.fontStyle=s.italic?'italic':'normal';
}
export function renderVisual(visual){
 const candidates=document.querySelectorAll('.site-header,.site-footer,main h1,main h2,main h3,main p,main a,main button,main label,main legend,main input,main span,main em,main small,main .animation,main .decoration,main .success-check,main .event-card,main .field,main fieldset,main .consent-field,main .manual-whatsapp');
 document.querySelectorAll('.decoration.ve-custom-decoration').forEach(n=>n.classList.remove('ve-custom-decoration'));
 candidates.forEach(node=>{if(node.closest('.honeypot')||node.classList.contains('field-error')||node.closest('[data-visual-added]'))return;if(!node.dataset.veId)node.dataset.veId=node.id?'node-'+node.id:node.dataset.bind?'bind-'+node.dataset.bind:'auto-'+(++count);register(node);});
 for(const a of visual.additions){const node=document.createElement(a.type==='text'?'p':a.type==='button'?'a':a.type==='image'?'img':'div');node.dataset.veId=a.id;node.dataset.visualAdded='true';node.className='visual-added visual-added-'+a.type;
  if(a.type==='text'||a.type==='button')node.textContent=a.text;
  if(a.type==='button'){node.classList.add('button','primary');node.href=a.href;if(a.href.startsWith('https:')){node.target='_blank';node.rel='noopener noreferrer';}}
  if(a.type==='image'){node.src=a.src;node.alt=a.background?'':a.text;if(a.background){node.classList.add('visual-background-image');node.setAttribute('aria-hidden','true');}}
  if(a.type==='video'){node.classList.add('animation');const video=document.createElement('video');video.src=a.src;video.muted=true;video.loop=true;video.playsInline=true;video.preload='metadata';video.setAttribute('aria-label',a.text);const button=document.createElement('button');button.type='button';button.className='media-toggle';button.setAttribute('aria-label','Pausar animación');button.textContent='Ⅱ';node.append(video,button);}
  if(a.background){const scenes=document.querySelectorAll('#page-'+a.page+' section');(scenes[a.sceneIndex]||scenes[0])?.append(node);continue;}
  const anchor=visualNode(a.anchor);if(anchor&&!anchor.matches('input,video,img')&&!anchor.closest('.family-options'))anchor.after(node);else document.querySelector('#page-'+a.page+' .scene:last-of-type, #page-'+a.page+' section:last-of-type')?.append(node);
 }
 const mobile=matchMedia('(max-width:650px)').matches;
 for(const [id,n]of Object.entries(visual.nodes)){const wrapper=visualNode(id),video=wrapper?.matches('.animation')?wrapper.querySelector('video'):null;if(video&&n.src&&/\.(mp4|webm)$/.test(n.src)&&video.getAttribute('src')!==n.src){video.src=n.src;video.load();}if(video&&'poster'in n)video.poster=n.poster;}
 for(const[id,n]of Object.entries(visual.nodes)){const node=visualNode(id);if(!node)continue;if('hidden'in n)node.hidden=n.hidden;if(typeof n.text==='string'&&isPlainText(node))node.textContent=n.text;if(n.src&&['IMG','VIDEO'].includes(node.tagName))node.src=n.src;if(node.classList.contains('decoration')){node.classList.toggle('ve-custom-decoration',!!n.src);if(n.src){const img=document.createElement('img');img.src=n.src;img.alt='';img.draggable=false;node.replaceChildren(img);}}if(n.placeholder&&node.matches('input'))node.placeholder=n.placeholder;if(n.href&&node.matches('a')){node.href=n.href;if(n.href.startsWith('https:'))node.rel='noopener noreferrer';}applyStyle(node,mobile?n.mobileStyles:n.styles);}
 document.dispatchEvent(new Event('visual-rendered'));
}
