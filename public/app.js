import {setupMedia} from './media.js';
import {validateVisual,resetVisual,renderVisual,safeAsset} from './visual-model.js';
import {createProjectSync} from './autosave.js';
import {initAccess,setupExit} from './access.js';
const KEY='dulce-sorpresa-config-v1',RESPONSES='dulce-sorpresa-respuestas-v1';
export const accessUser=await initAccess();
export const isEditor=accessUser.role==='admin';
export const isObserver=accessUser.role==='observer';
export const isMotherEditing=isEditor&&new URLSearchParams(location.search).has('mother-edit');
export const isMotherPreview=isEditor&&(isMotherEditing||new URLSearchParams(location.search).has('mother-preview'));
export const editableElements=[
 ['header','Cabecera completa','General','.site-header'],['footer','Pie de página completo','General','.site-footer'],
 ['heroEyebrow','Texto sobre el título','Bienvenida','.intro-copy>.eyebrow'],['heroTitle','Título inicial','Bienvenida','#hero-title'],['heroScroll','Indicación para bajar','Bienvenida','.intro-scene>.scroll-cue'],['jarCaption','Textos sobre el tarro','Bienvenida','.jar-caption'],['jarAnimation','Animación del tarro','Bienvenida','.animation-jar'],['welcomeEyebrow','Texto sobre el mensaje','Bienvenida','.welcome-copy>.eyebrow'],['welcomeTitle','Mensaje principal','Bienvenida','#welcome-title'],['welcomeBody','Párrafo de bienvenida','Bienvenida','.welcome-copy>[data-bind=welcomeBody]'],['welcomeButton','Botón de registro','Bienvenida','.welcome-copy>.button'],['welcomeDate','Fecha bajo el botón','Bienvenida','.date-note'],
 ['registerEyebrow','Texto sobre el título','Registro','.registration-intro .eyebrow'],['registerTitle','Título del registro','Registro','#registration-title'],['registerBody','Párrafo bajo el título','Registro','.registration-intro [data-bind=registerBody]'],['registerScroll','Indicación para bajar','Registro','.registration-intro .scroll-cue'],['bearAnimation','Animación del osito','Registro','.animation-bear'],['bearCaption','Frase bajo el osito','Registro','.registration-illustration>.script-note'],['formEyebrow','Texto sobre el formulario','Registro','#rsvp-form>.eyebrow'],['formTitle','Título del formulario','Registro','#rsvp-form>h2'],['formNote','Nota bajo el formulario','Registro','.form-note'],
 ['confirmationTitle','Título de agradecimiento','Confirmación','#confirmation-title'],['confirmationThanks','Mensaje de agradecimiento','Confirmación','#personal-thanks'],['tigerAnimation','Animación del tigre','Confirmación','.animation-tiger'],['calendarButton','Botón para guardar fecha','Confirmación','#calendar-button'],['closing','Despedida','Confirmación','.closing-note'],['whatsappButton','Botón para avisar por WhatsApp','Confirmación','#notify-whatsapp'],['whatsappHelp','Nota bajo el botón de WhatsApp','Confirmación','#notify-whatsapp-help']
];
const initialVisibility=Object.fromEntries(editableElements.map(([id])=>[id,!['header','footer','welcomeDate','registerEyebrow','registerBody','registerScroll'].includes(id)]));
export const defaults={
 animations:{tarro:{src:'assets/tarro.mp4',poster:'assets/tarro-poster.jpg',name:'Tarro de miel'},osito:{src:'assets/osito-v2.mp4',poster:'assets/osito-v2-poster.jpg',name:'Osito del registro'},tigre:{src:'assets/tigre.mp4',poster:'assets/tigre-poster.jpg',name:'Tigre de la confirmación'}},
 motherView:{greetingLabel:'BIENVENIDA',title:'Futura mamá 💛',intro:'Gabriela, esta dulce espera también se llena del cariño de quienes te acompañarán. Aquí puedes ver cómo van las confirmaciones.',listTitle:'Ver familias y confirmaciones',formNote:'Estás viendo el formulario en modo de consulta. Tu cuenta no necesita registrarse ni confirmar asistencia.',showFamilies:true,showPending:true,showMail:true,showCount:true,showNavigation:true,showForm:true,expanded:true,titleColor:'#6f97ce',background:'#faf5e6',titleSize:80},
 visual:{nodes:{},additions:[]},
 visibility:initialVisibility,heroEyebrow:'UN TARRITO DE MIEL ESTÁ EN CAMINO',welcomeEyebrow:'LOS MOMENTOS MÁS BONITOS SE COMPARTEN',eyebrowSizes:{hero:20,welcome:20},
 version:1,title:'Un pequeño secreto,',titleAccent:'una enorme ilusión',welcomeTitle:'¡Familia, tenemos una dulce sorpresa por descubrir!',welcomeBody:'Nos hace mucha ilusión compartir este día. Completa tus datos y cuéntanos qué familias nos acompañarán.',welcomeButton:'Súmate a la sorpresa',registerTitle:'Nos hace mucha ilusión compartir este día.',registerBody:'Completa tus datos y cuéntanos qué familias nos acompañarán.',formTitle:'Confirma tu asistencia',confirmationLabel:'ASISTENCIA CONFIRMADA',confirmationTitle:'¡La sorpresa se vive en familia!',closing:'Con cariño, los esperamos.',whatsappButton:'Avisar por WhatsApp',whatsappHelp:'Se abrirá WhatsApp con tu familia y la confirmación ya escritas. Pulsa Enviar para avisarnos.',dateISO:'2026-11-08',time:'15:00',eventPlace:'Centro comunal Abraham Lincoln',colors:{cream:'#fefef2',blue:'#6f97ce',terra:'#a95136',ink:'#43566a'},families:[{id:'carmen-joab',name:'Carmen y Joab',detail:'+2 hijos',people:4},{id:'francisca-olvin',name:'Francisca y Olvin',detail:'',people:2}],buttons:[],collaborators:[],notificationEmails:[]
};
export const storage={read(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}},write(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}};
export function safeLink(value){if(typeof value!=='string'||value.length>2000)return null;if(['#/bienvenida','#/registro','#/confirmacion'].includes(value))return value;try{const u=new URL(value);return ['https:','mailto:'].includes(u.protocol)?u.href:null;}catch{return null;}}
const clean=(v,max=1000)=>typeof v==='string'?v.slice(0,max):'';
export function validateConfig(raw){
 const c=structuredClone(defaults);
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return c;
 c.visual=validateVisual(raw.visual);if(typeof raw.familyRevision==='string')c.familyRevision=raw.familyRevision.slice(0,60);
 const mv={...(raw.motherView||{})};if(mv.title==='Bienvenida, futura mamá'){mv.title='Futura mamá 💛';mv.titleColor='#6f97ce';mv.titleSize=80;}for(const key of ['greetingLabel','title','intro','listTitle','formNote'])if(typeof mv[key]==='string')c.motherView[key]=clean(mv[key],key==='title'?180:1000);for(const key of ['showFamilies','showPending','showMail','showCount','showNavigation','showForm','expanded'])if(typeof mv[key]==='boolean')c.motherView[key]=mv[key];for(const key of ['titleColor','background'])if(/^#[0-9a-f]{6}$/i.test(mv[key]))c.motherView[key]=mv[key];if(Number.isFinite(mv.titleSize))c.motherView.titleSize=Math.max(20,Math.min(120,mv.titleSize));
 for(const key of ['tarro','osito','tigre']){const a=raw.animations?.[key];if(a&&safeAsset(a.src)&&/\.(mp4|webm)$/.test(a.src)){c.animations[key]={src:a.src,poster:a.poster===''?'':safeAsset(a.poster)?a.poster:c.animations[key].poster,name:clean(a.name,120)||c.animations[key].name};}}
 for(const [key] of editableElements){if(typeof raw.visibility?.[key]==='boolean')c.visibility[key]=raw.visibility[key];}
 for(const key of ['hero','welcome']){if(Number.isFinite(raw.eyebrowSizes?.[key]))c.eyebrowSizes[key]=Math.min(36,Math.max(10,raw.eyebrowSizes[key]));}
 for(const key of Object.keys(defaults).filter(k=>typeof defaults[k]==='string')){if(typeof raw[key]==='string'&&raw[key].trim())c[key]=clean(raw[key],key.includes('Body')?1500:240);}
 if(!/^\d{4}-\d{2}-\d{2}$/.test(c.dateISO)||!Number.isFinite(Date.parse(c.dateISO+'T12:00:00'))||new Date(c.dateISO+'T12:00:00').toISOString().slice(0,10)!==c.dateISO)c.dateISO=defaults.dateISO;
 if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(c.time))c.time=defaults.time;
 for(const key of Object.keys(c.colors)){if(/^#[0-9a-fA-F]{6}$/.test(raw.colors?.[key]))c.colors[key]=raw.colors[key];}
 if(Array.isArray(raw.families)&&raw.families.length){const used=new Set();const valid=raw.families.slice(0,200).filter(f=>f&&typeof f.id==='string'&&/^[\w-]{1,60}$/.test(f.id)&&typeof f.name==='string'&&f.name.trim()&&!used.has(f.id)&&(used.add(f.id),true)).map(f=>({id:f.id,name:clean(f.name,100),detail:clean(f.detail,60),people:Math.min(30,Math.max(1,parseInt(f.people)||1))}));if(valid.length)c.families=valid;}
 if(Array.isArray(raw.buttons))c.buttons=raw.buttons.slice(0,12).filter(b=>b&&typeof b.id==='string'&&typeof b.label==='string'&&b.label.trim()&&['bienvenida','registro','confirmacion'].includes(b.page)&&safeLink(b.href)).map(b=>({id:clean(b.id,60),label:clean(b.label,60),page:b.page,href:safeLink(b.href)}));
 if(Array.isArray(raw.collaborators))c.collaborators=raw.collaborators.slice(0,15).filter(v=>v&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)).map(v=>({email:clean(v.email,254),role:v.role==='editor'?'editor':'admin'}));
 if(Array.isArray(raw.notificationEmails))c.notificationEmails=raw.notificationEmails.slice(0,10).filter(e=>typeof e==='string'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)).map(e=>clean(e,254));
 return c;
}
export let config=validateConfig(isEditor?storage.read(KEY,null):null);
const projectSync=createProjectSync({isEditor,getConfig:()=>config,applyConfig(value){config=value;renderConfig();document.dispatchEvent(new Event('config-loaded'));},validate:validateConfig,storage,key:KEY});
export const getSaveState=()=>projectSync.status;
export const retryProjectSave=()=>projectSync.retry();
let serverResponses=[];
let currentPage='bienvenida',lastResponse=null,toastTimer,submitting=false;
try{lastResponse=getResponses().find(r=>r.id===sessionStorage.getItem('dulce-sorpresa-confirmacion'))||null;}catch{}
export const getPage=()=>currentPage;
export function toast(message){const el=document.querySelector('.toast');el.textContent=message;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.hidden=true,3500);}
export function getResponses(){if(isEditor)return serverResponses;const r=storage.read(RESPONSES,[]);return Array.isArray(r)?r.filter(x=>x&&typeof x.id==='string'&&typeof x.email==='string'&&Array.isArray(x.families)).slice(-500):[];}
export async function refreshResponses(){if(!isEditor)return;const response=await fetch('/api/registrations',{cache:'no-store'});if(!response.ok)throw Error('No se pudieron cargar las confirmaciones.');serverResponses=(await response.json()).records;document.dispatchEvent(new Event('responses-changed'));}
export function clearResponses(){if(storage.write(RESPONSES,[]))toast('Se borraron las pruebas de este navegador.');else toast('No se pudieron borrar los datos locales.');document.dispatchEvent(new Event('responses-changed'));}
export function download(name,type,content){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.hidden=true;document.body.append(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(url);},30000);}
function dateParts(){const date=new Date(config.dateISO+'T12:00:00');const long=new Intl.DateTimeFormat('es-HN',{weekday:'long',day:'numeric',month:'long'}).format(date);const time=new Date(config.dateISO+'T'+config.time+':00');let timeText=new Intl.DateTimeFormat('es-HN',{hour:'numeric',minute:'2-digit',hour12:true}).format(time).replaceAll('\u00a0',' ').replaceAll('\u202f',' ');return{date:long.charAt(0).toUpperCase()+long.slice(1),time:timeText,short:new Intl.DateTimeFormat('es-HN',{day:'2-digit',month:'short'}).format(date).replace('.','').toUpperCase()+' · '+date.getFullYear()};}
export function renderConfig(){
 resetVisual();
 for(const [key,a]of Object.entries(config.animations)){const video=document.querySelector('[data-animation="'+key+'"] video');if(!video)continue;if(video.getAttribute('src')!==a.src){video.src=a.src;video.load();}video.poster=a.poster;}
 const d=dateParts();const values={...config,eventDate:d.date,eventTime:'a las '+d.time,shortDate:d.short,dateNote:(d.date+' · '+d.time).toUpperCase()};
 document.querySelectorAll('[data-bind]').forEach(el=>{el.textContent=values[el.dataset.bind]??'';});
 document.querySelector('.intro-copy>.eyebrow').textContent=config.heroEyebrow;
 document.querySelector('.welcome-copy>.eyebrow').textContent=config.welcomeEyebrow;
 for(const [key,,,selector] of editableElements){document.querySelectorAll(selector).forEach(el=>el.hidden=!config.visibility[key]);}
 document.body.classList.toggle('no-header',!config.visibility.header);
 document.documentElement.style.setProperty('--hero-eyebrow-size',config.eyebrowSizes.hero+'px');
 document.documentElement.style.setProperty('--welcome-eyebrow-size',config.eyebrowSizes.welcome+'px');
 for(const [key,value] of Object.entries(config.colors))document.documentElement.style.setProperty('--'+key,value);
 const checked=new Set([...document.querySelectorAll('input[name="families"]:checked')].map(n=>n.value));
 const options=document.querySelector('#family-options');options.replaceChildren();
 config.families.forEach(f=>{const label=document.createElement('label');label.className='family-option';label.dataset.veId='family-'+f.id;const input=document.createElement('input');input.type='checkbox';input.name='families';input.value=f.id;input.dataset.veId='check-'+f.id;input.checked=checked.has(f.id);const name=document.createElement('span');name.dataset.veId='family-name-'+f.id;name.textContent=f.name;const detail=document.createElement('small');detail.dataset.veId='family-detail-'+f.id;detail.textContent=f.detail;name.append(detail);label.append(input,name);options.append(label);});
 document.querySelectorAll('[data-buttons]').forEach(container=>{container.replaceChildren();config.buttons.filter(b=>b.page===container.dataset.buttons).forEach(b=>{const a=document.createElement('a');a.dataset.veId='extra-'+b.id;a.className='button';a.textContent=b.label;a.href=b.href;if(b.href.startsWith('https:')){a.target='_blank';a.rel='noopener noreferrer';}container.append(a);});});
 renderVisual(config.visual);updateWhatsApp();updateFamilySummary();document.dispatchEvent(new Event('config-rendered'));
}
const undoStack=[],redoStack=[];
function persist({render=true}={}){const saved=storage.write(KEY,config);if(render)renderConfig();document.dispatchEvent(new Event('config-changed'));projectSync.schedule(config,saved);return saved;}
export function saveConfig(next,options){if(!isEditor){toast('Solo el administrador puede editar esta invitación.');return false;}const valid=validateConfig(next);if(JSON.stringify(valid)===JSON.stringify(config))return true;undoStack.push(structuredClone(config));if(undoStack.length>60)undoStack.shift();redoStack.length=0;config=valid;return persist(options);}
export function undoConfig(){if(!undoStack.length)return toast('No hay cambios para deshacer.');redoStack.push(structuredClone(config));config=undoStack.pop();persist();}
export function redoConfig(){if(!redoStack.length)return toast('No hay cambios para rehacer.');undoStack.push(structuredClone(config));config=redoStack.pop();persist();}
function updateFamilySummary(){const checked=[...document.querySelectorAll('[name=families]:checked')];const text=document.querySelector('#family-summary');if(text)text.textContent=checked.length?checked.map(i=>{const f=config.families.find(f=>f.id===i.value);return f?f.name+(f.detail?' ('+f.detail+')':''):'';}).join(' · '):'Selecciona tu familia';document.querySelector('#family-trigger')?.classList.toggle('has-selection',!!checked.length);}
function setFamilyOpen(open){const panel=document.querySelector('#family-dropdown');panel.hidden=!open;document.querySelector('#family-trigger').setAttribute('aria-expanded',String(open));}
document.querySelector('#family-trigger').addEventListener('click',()=>setFamilyOpen(document.querySelector('#family-dropdown').hidden));
document.querySelector('#family-legend').addEventListener('click',()=>{setFamilyOpen(document.querySelector('#family-dropdown').hidden);document.querySelector('#family-trigger').focus();});
document.querySelector('#family-options').addEventListener('change',updateFamilySummary);
document.querySelector('#family-done').addEventListener('click',()=>{setFamilyOpen(false);document.querySelector('#family-trigger').focus();});
document.addEventListener('click',e=>{if(!e.target.closest('.family-fieldset'))setFamilyOpen(false);});
document.querySelector('.family-fieldset').addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();setFamilyOpen(false);document.querySelector('#family-trigger').focus();}if(e.key==='ArrowDown'&&e.target.id==='family-trigger'){e.preventDefault();setFamilyOpen(true);document.querySelector('[name=families]')?.focus();}});
matchMedia('(max-width:650px)').addEventListener('change',()=>renderConfig());
const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}}),{threshold:.12});
document.querySelectorAll('.reveal').forEach(e=>observer.observe(e));document.body.classList.add('motion-ready');
export function navigate(page){location.hash='/'+page;}
function updateWhatsApp(){
 const url=lastResponse?.manualWhatsApp?.ownerUrl,box=document.querySelector('#manual-whatsapp'),button=document.querySelector('#notify-whatsapp');
 const valid=typeof url==='string'&&/^https:\/\/wa\.me\/\d+\?text=/.test(url);
 // Administrators can edit this layer even before a registration exists.
 box.hidden=(!valid&&!isEditor)||config.visual.nodes['node-manual-whatsapp']?.hidden===true;
 if(valid){button.href=url;button.removeAttribute('aria-disabled');button.removeAttribute('title');}
 else{button.removeAttribute('href');button.setAttribute('aria-disabled','true');button.title='Vista previa: el enlace se genera al confirmar una asistencia.';}
}
function route(){
 const hash=location.hash;
 if(hash&&!hash.startsWith('#/'))return;
 let page=hash.slice(2).split('?')[0]||'bienvenida';if(!['bienvenida','registro','confirmacion'].includes(page))page='bienvenida';
 if(page==='confirmacion'&&!lastResponse&&!isEditor&&!isObserver){page='registro';history.replaceState(null,'',location.pathname+location.search+'#/registro');}
 currentPage=page;
 document.querySelectorAll('.page').forEach(el=>el.hidden=el.id!=='page-'+page);
 document.querySelectorAll('[data-step]').forEach(el=>{if(el.dataset.step===page)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});
 document.title=({bienvenida:'Una dulce sorpresa',registro:'Confirma tu asistencia',confirmacion:'¡Nos vemos en la celebración!'})[page]+' · Nuestra revelación';
 if(page==='confirmacion')document.querySelector('#personal-thanks').textContent=lastResponse?.families.length?'Gracias, '+lastResponse.families.map(f=>f.name).join(' y ')+'. ¡Qué alegría que nos acompañen!':'Gracias por acompañarnos en esta dulce espera.';
 if(page==='confirmacion')updateWhatsApp();
 window.scrollTo({top:0,behavior:'instant'});document.querySelector('#main').focus({preventScroll:true});
 document.dispatchEvent(new CustomEvent('page-changed',{detail:page}));
}
window.addEventListener('hashchange',route);
document.querySelector('#restart-button').addEventListener('click',()=>navigate('bienvenida'));
function setError(id,message){document.getElementById(id+'-error').textContent=message;const input=document.getElementById(id);if(input)input.setAttribute('aria-invalid',message?'true':'false');}
document.querySelector('#rsvp-form').addEventListener('input',e=>{if(['email','phone','attendance'].includes(e.target.id))setError(e.target.id,'');if(e.target.name==='families')setError('family','');document.querySelector('#form-error').textContent='';});
document.querySelector('#rsvp-form').addEventListener('submit',async e=>{
 e.preventDefault();if(submitting)return;
 const form=e.currentTarget,email=form.elements.email,phone=form.elements.phone,attendance=form.elements.attendance;
 const selected=config.families.filter(f=>[...form.querySelectorAll('[name=families]:checked')].some(input=>input.value===f.id));
 const emailValue=email.value.trim(),phoneValue=phone.value.trim(),phoneDigits=phoneValue.replace(/\D/g,'');
 email.value=emailValue;
 const visible=n=>!!n?.getClientRects().length;
 const errors={email:visible(email)&&(!emailValue||!email.validity.valid)?'Escribe un correo electrónico válido.':'',family:visible(document.querySelector('#family-trigger'))&&!selected.length?'Selecciona al menos una familia.':'',phone:visible(phone)&&(!/^[+\d\s()-]+$/.test(phoneValue)||phoneDigits.length<8||phoneDigits.length>15)?'Escribe un teléfono válido (de 8 a 15 dígitos).':'',attendance:visible(attendance)&&!attendance.checked?'Marca la casilla para confirmar que asistirán.':''};
 Object.entries(errors).forEach(([id,msg])=>setError(id,msg));
 if(Object.values(errors).some(Boolean)){const first=Object.keys(errors).find(k=>errors[k]);if(first==='family'){setFamilyOpen(true);document.querySelector('#family-trigger').focus();}else document.getElementById(first)?.focus();return;}
 if(form.elements.website.value)return;
 submitting=true;const button=form.querySelector('[type=submit]');button.disabled=true;
 const rows=getResponses(),existing=emailValue?rows.findIndex(r=>r.email.toLowerCase()===emailValue.toLowerCase()):-1;
 let record;
 try{const response=await fetch('/api/rsvp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:emailValue,phone:phoneValue,familyIds:selected.map(f=>f.id),attendance:attendance.checked,whatsappConsent:form.elements.whatsappConsent.checked})});const data=await response.json();if(!response.ok)throw Error(data.error||'No se pudo confirmar la asistencia.');record=data.record;}catch(error){document.querySelector('#form-error').textContent=error.message||'No se pudo guardar. Inténtalo de nuevo.';submitting=false;button.disabled=false;return;}
 if(existing>=0)rows[existing]=record;else rows.push(record);
 storage.write(RESPONSES,rows.slice(-500));
 lastResponse=record;try{sessionStorage.setItem('dulce-sorpresa-confirmacion',record.id);}catch{}document.dispatchEvent(new Event('responses-changed'));navigate('confirmacion');button.disabled=false;submitting=false;
});
document.querySelector('#calendar-button').addEventListener('click',()=>{
 const escape=s=>String(s).replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
 const date=config.dateISO.replaceAll('-',''),[hour,minute]=config.time.split(':').map(Number);
 const start=new Date(Date.UTC(...[Number(config.dateISO.slice(0,4)),Number(config.dateISO.slice(5,7))-1,Number(config.dateISO.slice(8,10)),hour+6,minute]));
 const end=new Date(start.getTime()+2*60*60*1000);
 const stamp=d=>d.toISOString().replace(/[-:]/g,'').replace('.000','');
 const event=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Una dulce sorpresa//ES','BEGIN:VEVENT','UID:revelacion-'+date+'@dulcesorpresa.local','DTSTAMP:'+stamp(new Date()),'DTSTART:'+stamp(start),'DTEND:'+stamp(end),'SUMMARY:'+escape('Una dulce sorpresa · Revelación'),'LOCATION:'+escape(config.eventPlace),'DESCRIPTION:'+escape('¡Los esperamos para descubrir juntos una dulce sorpresa! Hora local de Honduras. Duración aproximada para tu calendario: 2 horas.'),'END:VEVENT','END:VCALENDAR'].join('\r\n');
 download('nuestra-dulce-sorpresa.ics','text/calendar;charset=utf-8',event);
});
renderConfig();route();setupMedia();
projectSync.start();
setupExit(accessUser,{beforeExit:()=>projectSync.finish()});
if(isEditor)refreshResponses().catch(()=>toast('No se pudieron cargar los registros del servidor.'));
if(isEditor&&(!isMotherPreview||isMotherEditing))import('./editor.js').then(m=>m.setupEditor()).catch(()=>toast('No se pudo abrir el editor. Recarga la página.'));

if(isObserver||isMotherPreview)import('./mother.js').then(m=>m.setupMother({preview:isMotherPreview,editing:isMotherEditing})).catch(()=>toast('No se pudo cargar tu resumen. Recarga para reintentar.'));
