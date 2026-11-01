import {config,defaults,editableElements,saveConfig,validateConfig,getPage,navigate,getResponses,refreshResponses,download,toast,safeLink,getSaveState,retryProjectSave} from './app.js';
import {setupVisualEditor} from './visual-editor.js';
import {replaceAnimation} from './animation-upload.js';
import {renderNotificationPanel} from './notification-panel.js';
function el(tag,attrs={},children=[]){const node=document.createElement(tag);for(const [k,v]of Object.entries(attrs)){if(k==='text')node.textContent=v;else if(k==='class')node.className=v;else node.setAttribute(k,v);}for(const c of children)node.append(c);return node;}
function button(label,action,kind=''){const n=el('button',{type:'button',class:'editor-button '+kind,text:label});n.addEventListener('click',action);return n;}
function field(label,value,onChange,{type='text',area=false,options=null,min,max}={}){const wrap=el('label',{class:'editor-field'});wrap.append(el('span',{text:label}));let input;if(options){input=el('select');options.forEach(([v,l])=>input.append(el('option',{value:v,text:l})));}else input=el(area?'textarea':'input',area?{}:{type});input.value=value??'';if(min!==undefined)input.min=min;if(max!==undefined)input.max=max;if(type==='text'||area)input.maxLength=1500;input.addEventListener(options?'change':'input',()=>onChange(input.value));wrap.append(input);return wrap;}
function update(key,value){saveConfig({...config,[key]:value});}
function note(text){return el('p',{class:'editor-note',text});}
let panel,body,currentTab='lienzo',contentPage='bienvenida',launcher,visualTools;
function setOpen(open){panel.hidden=!open;document.body.classList.toggle('editor-open',open);launcher.setAttribute('aria-expanded',String(open));if(!open)launcher.focus({preventScroll:true});}
function rebuild(){const y=body.scrollTop;body.replaceChildren();renderers[currentTab]();body.scrollTop=y;}
const renderers={
 gabriela(){
  body.append(el('h3',{text:'Lo que verá Gabriela'}),note('Estos ajustes cambian únicamente su vista de consulta. Ella puede agregar y editar únicamente familias; no puede editar el diseño ni enviar el formulario. Los cambios se guardan automáticamente.'));
  const edit=(key,value)=>update('motherView',{...config.motherView,[key]:value});
  for(const [key,label,area]of [['greetingLabel','Texto sobre la bienvenida'],['title','Título de bienvenida'],['formNote','Mensaje sobre el formulario',true]])body.append(field(label,config.motherView[key],value=>edit(key,value),{area}));
  body.append(el('h4',{text:'Información visible'}));
  for(const [key,label]of [['showMail','Mostrar estado del correo en la lista de familias']]){
   const input=el('input',{type:'checkbox'});input.checked=config.motherView[key];input.addEventListener('change',()=>edit(key,input.checked));body.append(el('label',{class:'editor-check'},[input,document.createTextNode(label)]));
  }
  body.append(el('h4',{text:'Presentación'}),field('Color del título',config.motherView.titleColor,v=>edit('titleColor',v),{type:'color'}),field('Tamaño del título',config.motherView.titleSize,v=>edit('titleSize',Number(v)),{type:'number',min:20,max:120}));
  const preview=el('a',{href:'?mother-preview=1#/bienvenida',target:'_blank',rel:'noopener noreferrer',class:'editor-button dark',text:'Ver como Gabriela'});const editLink=el('a',{href:'?mother-edit=1#/bienvenida',class:'editor-button dark',text:'Editar bienvenida de Gabriela en el lienzo'});body.append(editLink,preview,note('La vista previa usa tu cuenta de administrador. No necesitas entrar con su contraseña. Pulsa Actualizar listado en esa vista para cargar los últimos ajustes guardados.'));
 },
 animaciones(){
  body.append(el('h3',{text:'Animaciones de las páginas'}),el('p',{text:'Reemplaza cada video por un archivo MP4 o WebM de hasta 40 MB. El archivo se conserva en el proyecto y los cambios se guardan automáticamente.'}));
  for(const [key,label]of [['tarro','Bienvenida · Tarro de miel'],['osito','Registro · Osito'],['tigre','Confirmación · Tigre']]){const a=config.animations[key],row=el('div',{class:'editor-row'});row.append(el('h4',{text:label}));if(a.poster)row.append(el('img',{src:a.poster,alt:'Portada de '+label,class:'editor-animation-poster'}));row.append(el('p',{text:a.name}),button('Cambiar animación',()=>replaceAnimation({key}),'dark'));if(a.src!==defaults.animations[key].src)row.append(button('Restaurar original',()=>{update('animations',{...config.animations,[key]:defaults.animations[key]});rebuild();}));body.append(row);}
  body.append(note('Los videos se reproducen sin audio y en bucle. Para una unión suave, usa un video cuyo inicio y final coincidan. También puedes seleccionar una animación directamente en el lienzo y reemplazarla desde el inspector.'));
 },
 lienzo(){visualTools.renderInspector(body);},
 elementos(){
  body.append(el('h3',{text:'Mostrar u ocultar elementos'}),el('p',{text:'Desmarca un elemento para quitarlo de la invitación. Puedes recuperarlo marcándolo de nuevo.'}));
  for(const group of ['General','Bienvenida','Registro','Confirmación']){
   body.append(el('h4',{text:group}));
   editableElements.filter(e=>e[2]===group).forEach(([key,label])=>{const input=el('input',{type:'checkbox'});input.checked=config.visibility[key];input.addEventListener('change',()=>update('visibility',{...config.visibility,[key]:input.checked}));body.append(el('label',{class:'editor-check'},[input,document.createTextNode(label)]));});
  }
 },
 contenido(){
  body.append(el('h3',{text:'Palabras para este día'}),el('p',{text:'Escribe y mira los cambios directamente en la invitación.'}));
  body.append(field('Página que quieres editar',contentPage,v=>{contentPage=v;navigate(v);rebuild();},{options:[['bienvenida','1 · Bienvenida'],['registro','2 · Registro'],['confirmacion','3 · Confirmación']]}));
  const groups={bienvenida:[['heroEyebrow','Texto sobre el título'],['title','Título inicial'],['titleAccent','Título en cursiva'],['welcomeEyebrow','Texto sobre el mensaje'],['welcomeTitle','Mensaje de bienvenida'],['welcomeBody','Texto de bienvenida',true],['welcomeButton','Botón principal']],registro:[['registerTitle','Título del registro'],['registerBody','Mensaje del registro',true],['formTitle','Título del formulario']],confirmacion:[['confirmationLabel','Estado de confirmación'],['confirmationTitle','Título de agradecimiento'],['closing','Despedida']]};
  groups[contentPage].forEach(([key,label,area])=>body.append(field(label,config[key],v=>update(key,v),{area})));
  body.append(el('hr'),el('h3',{text:'Fecha y lugar'}),field('Fecha',config.dateISO,v=>{if(v)update('dateISO',v);},{type:'date'}),field('Hora · Honduras',config.time,v=>{if(v)update('time',v);},{type:'time'}),field('Lugar de la celebración',config.eventPlace,v=>update('eventPlace',v)));
 },
 estilo(){
  body.append(el('h3',{text:'Tamaño de los textos destacados'}));
  [['hero','Texto sobre el título inicial'],['welcome','Texto sobre el mensaje de bienvenida']].forEach(([key,label])=>body.append(field(label+' · px',config.eyebrowSizes[key],v=>{if(v)update('eyebrowSizes',{...config.eyebrowSizes,[key]:Number(v)});},{type:'number',min:10,max:36})));
  body.append(el('h3',{text:'Los colores de la sorpresa'}),el('p',{text:'La paleta se aplica a las tres páginas. Los videos mantienen sus colores originales.'}));
  [['cream','Fondo crema'],['blue','Azul de los títulos'],['terra','Terracota y botones'],['ink','Texto principal']].forEach(([key,label])=>{const row=el('div',{class:'editor-color-row'});const name=el('div');name.append(el('label',{text:label}),el('code',{text:config.colors[key]}));row.append(name,field('',config.colors[key],v=>{saveConfig({...config,colors:{...config.colors,[key]:v}});name.querySelector('code').textContent=v;},{type:'color'}));body.append(row);});
  body.append(el('hr'),note('Se respeta la preferencia de movimiento reducido del dispositivo. Cada animación también puede pausarse desde su propio botón.'),button('Restaurar paleta original',()=>{update('colors',defaults.colors);rebuild();}));
 },
 familias(){
  body.append(el('h3',{text:'Nuestra lista de familias'}),el('p',{text:'Agrega o corrige las familias que podrán seleccionarse en el formulario. Puedes incluir el número de hijos en el detalle.'}));
  config.families.forEach(f=>{const row=el('div',{class:'editor-row'});const top=el('div',{class:'editor-row-title'},[el('strong',{text:'Familia invitada'})]);const del=el('button',{class:'editor-delete',type:'button',text:'Eliminar','aria-label':'Eliminar '+f.name});del.addEventListener('click',()=>{if(config.families.length===1){toast('Conserva al menos una familia en la lista.');return;}update('families',config.families.filter(x=>x.id!==f.id));rebuild();});top.append(del);row.append(top);const edit=(k,v)=>update('families',config.families.map(x=>x.id===f.id?{...x,[k]:v}:x));row.append(field('Nombre de la familia',f.name,v=>edit('name',v)),field('Detalle · opcional',f.detail,v=>edit('detail',v)),field('Personas incluidas',f.people,v=>edit('people',Number(v)),{type:'number',min:1,max:30}));body.append(row);});
  body.append(button('+ Agregar familia',()=>{update('families',[...config.families,{id:'f-'+crypto.randomUUID(),name:'Nueva familia',detail:'',people:2}]);rebuild();body.scrollTop=body.scrollHeight;}));
 },
 botones(){
  body.append(el('h3',{text:'Un botón más, donde lo necesites'}),el('p',{text:'Agrega enlaces a otra página de la invitación, una ubicación o un sitio HTTPS.'}));
  config.buttons.forEach(b=>{const row=el('div',{class:'editor-row'});const top=el('div',{class:'editor-row-title'},[el('strong',{text:b.label})]);const del=el('button',{class:'editor-delete',type:'button',text:'Eliminar'});del.addEventListener('click',()=>{update('buttons',config.buttons.filter(x=>x.id!==b.id));rebuild();});top.append(del);row.append(top);const edit=(k,v)=>update('buttons',config.buttons.map(x=>x.id===b.id?{...x,[k]:v}:x));row.append(field('Texto del botón',b.label,v=>{edit('label',v);top.querySelector('strong').textContent=v;}),field('Mostrar en',b.page,v=>edit('page',v),{options:[['bienvenida','Bienvenida'],['registro','Registro'],['confirmacion','Confirmación']]}));const error=el('div',{class:'field-error'});row.append(field('Destino',b.href,v=>{if(safeLink(v)){error.textContent='';edit('href',v);}else error.textContent='Usa HTTPS, mailto: o #/registro, #/bienvenida, #/confirmacion.';}),error);body.append(row);});
  body.append(button('+ Agregar botón',()=>{if(config.buttons.length>=12){toast('Puedes agregar hasta 12 botones.');return;}update('buttons',[...config.buttons,{id:crypto.randomUUID(),label:'Ver ubicación',page:'confirmacion',href:'#/registro'}]);rebuild();}),note('El destino del nuevo botón es provisional: cambia el enlace antes de utilizarlo. Los enlaces externos se abren en otra pestaña.'));
 },
 registros(){
  const rows=getResponses();const familyCount=rows.reduce((total,r)=>total+r.families.length,0);
    body.append(el('h3',{text:'Confirmaciones de asistencia'}),note('Cada celular identifica su registro y las familias seleccionadas. Los correos se enviarán al conectar Google Apps Script. WhatsApp abre un texto preparado: tú debes pulsar Enviar.'));
  const stats=el('div',{class:'editor-stat-grid'});[[rows.length,'Registros'],[familyCount,'Familias seleccionadas']].forEach(([v,l])=>stats.append(el('div',{class:'editor-stat'},[el('strong',{text:String(v)}),el('span',{text:l})])));body.append(stats);
  const actions=el('div',{class:'editor-actions'});actions.append(button('Exportar CSV',()=>{
   const csvCell=v=>'"'+(/^[=+@\-\t\r\n]/.test(String(v))?"'":'')+String(v).replaceAll('"','""')+'"';
   const csv=[['Fecha','Familias','Personas','Correo','Teléfono'],...rows.map(r=>[r.confirmedAt,r.families.map(f=>f.name).join(' / '),r.families.reduce((s,f)=>s+(Number(f.people)||0),0),r.email,r.phone])].map(row=>row.map(csvCell).join(',')).join('\r\n');download('confirmaciones-asistencia.csv','text/csv;charset=utf-8','\ufeff'+csv);
  }));actions.append(button('Actualizar registros',()=>refreshResponses().catch(()=>toast('No se pudieron cargar los registros.'))));body.append(actions);
  if(!rows.length)body.append(el('div',{class:'editor-empty',text:'La primera confirmación aparecerá aquí.'}));
  const states={waiting:'Pendiente de conectar Gmail',retry:'En espera de reintento',sending:'Enviando',sent:'Enviado por Gmail',accepted:'Aceptado por el proveedor anterior',uncertain:'Revisar envío',failed:'Falló el envío',skipped:'Sin autorización',cancelled:'Reemplazado por actualización'};
  [...rows].reverse().forEach(r=>{const row=el('div',{class:'editor-response'});row.append(el('strong',{text:r.families.map(f=>f.name).join(' · ')}),el('div',{text:r.phone||''}),el('div',{text:r.email}),el('p',{text:new Intl.DateTimeFormat('es-HN',{dateStyle:'medium',timeStyle:'short',timeZone:'America/Tegucigalpa'}).format(new Date(r.confirmedAt))}));row.append(el('p',{text:'Correo para ti: '+states[r.notifications?.email||'waiting']+' · Correo a la familia: '+states[r.notifications?.emailGuest||'waiting']}));const url=r.manualWhatsApp?.guestUrl;if(typeof url==='string'&&/^https:\/\/wa\.me\/\d+\?text=/.test(url)){row.append(el('a',{href:url,target:'_blank',rel:'noopener noreferrer',class:'editor-button',text:'Responder por WhatsApp'}),el('p',{text:'Abre el chat de '+r.phone+' con el agradecimiento y los datos del evento. Pulsa Enviar en WhatsApp.'}));}else row.append(el('p',{text:'Esta familia no autorizó recibir mensajes por WhatsApp.'}));body.append(row);});
 },
 acceso(){
  body.append(el('h3',{text:'Un único administrador'}),note('Solo SRJO4B_ADMIN puede abrir el HUD, guardar cambios y reemplazar animaciones. La entrada requiere su contraseña y el servidor comprueba los permisos en cada operación.'),el('p',{text:'Los invitados entran con su nombre y ven únicamente la invitación. El enlace del editor no concede permisos. Para cambiar de usuario, utiliza Salir.'}));
 },
 correos(){renderNotificationPanel(body,{toast});},
 archivo(){
  body.append(el('h3',{text:'Guarda tu versión'}),el('p',{text:'Exporta los cambios para conservarlos o compartirlos al preparar la publicación. La configuración no incluye los registros de prueba.'}),button('Exportar configuración JSON',()=>download('dulce-sorpresa-config.json','application/json',JSON.stringify(config,null,2)),'dark'));
  const copyArea=el('textarea',{readonly:'','aria-label':'Configuración JSON para copiar',rows:'9'});const copyWrap=el('label',{class:'editor-field',hidden:''},[el('span',{text:'Copia este texto y guárdalo como archivo .json'}),copyArea]);
  body.append(el('div',{class:'editor-actions'},[button('Ver JSON para copiar',()=>{copyWrap.hidden=false;copyArea.value=JSON.stringify(config,null,2);copyArea.focus();copyArea.select();})]),copyWrap,el('hr'),el('h3',{text:'Cargar una configuración'}));
  const file=el('input',{type:'file',accept:'.json,application/json','aria-label':'Importar configuración JSON'});file.addEventListener('change',async()=>{const f=file.files[0];if(!f)return;if(f.size>4*1024*1024){toast('El archivo debe pesar menos de 4 MB.');return;}try{const data=JSON.parse(await f.text());if(!data||data.version!==1||typeof data.title!=='string')throw Error();saveConfig(validateConfig(data));rebuild();toast('Configuración importada.');}catch{toast('Ese archivo no es una configuración válida.');}});body.append(el('label',{class:'editor-field'},[el('span',{text:'Archivo JSON exportado por este editor'}),file]),el('hr'),el('h3',{text:'Volver al diseño inicial'}),el('p',{text:'Restaura los textos, colores y familias. Conserva los registros de prueba.'}),button('Restaurar diseño',()=>{if(confirm('¿Restaurar el diseño inicial? Exporta antes si quieres conservar tus cambios.')){saveConfig(structuredClone(defaults));rebuild();toast('Diseño inicial restaurado.');}},'danger'));
 }
};
export function setupEditor(){
 const root=document.querySelector('#editor-root');
 launcher=el('button',{type:'button',class:'editor-launcher','aria-expanded':'true','aria-controls':'editor-panel'},[el('span'),document.createTextNode('Editar prototipo')]);launcher.addEventListener('click',()=>setOpen(panel.hidden));
 panel=el('aside',{id:'editor-panel',class:'editor-panel','aria-label':'Editor local del prototipo'});
 const header=el('header');header.append(el('p',{class:'editor-kicker',text:'UNA DULCE SORPRESA'}));const headrow=el('div');const close=el('button',{type:'button',class:'editor-close',text:'×','aria-label':'Cerrar editor'});close.addEventListener('click',()=>setOpen(false));headrow.append(el('h2',{text:'Tu invitación, a tu manera'}),close);
 const saveState=el('p',{class:'editor-save-state',role:'status','aria-live':'polite'}),retry=button('Reintentar guardado',retryProjectSave);retry.hidden=true;header.append(headrow,saveState,retry);
 function showSave(state){saveState.textContent=(state.state==='saved'?'● ':state.state==='error'?'⚠ ':'◌ ')+state.message;saveState.dataset.state=state.state;retry.hidden=state.state!=='error';}showSave(getSaveState());document.addEventListener('save-state',e=>showSave(e.detail));document.addEventListener('animation-upload',e=>showSave({state:e.detail.error?'error':'saving',message:e.detail.message}));
 const pages=el('div',{class:'editor-page-nav','aria-label':'Previsualizar página'});[['bienvenida','1 · Bienvenida'],['registro','2 · Registro'],['confirmacion','3 · Confirmación']].forEach(([p,l])=>{const b=el('button',{type:'button','data-editor-page':p,text:l});b.addEventListener('click',()=>{contentPage=p;navigate(p);if(currentTab==='contenido')rebuild();});pages.append(b);});
 const tabs=el('div',{class:'editor-tabs',role:'tablist','aria-label':'Herramientas de edición'});[['lienzo','Selección'],['gabriela','Vista de Gabriela'],['contenido','Contenido'],['elementos','Elementos'],['estilo','Estilo'],['animaciones','Animaciones'],['familias','Familias'],['botones','Botones'],['registros','Registros'],['acceso','Accesos'],['correos','Notificaciones'],['archivo','Archivo']].forEach(([key,label])=>{const b=el('button',{type:'button',role:'tab','data-tab':key,'aria-selected':String(key===currentTab),text:label});b.addEventListener('click',()=>{currentTab=key;tabs.querySelectorAll('button').forEach(t=>t.setAttribute('aria-selected',String(t===b)));rebuild();body.scrollTop=0;});tabs.append(b);});
 body=el('div',{class:'editor-body',role:'tabpanel','aria-label':'Opciones de edición'});panel.append(header,pages,tabs,body,el('footer',{text:'ADMINISTRADOR · Acceso exclusivo con contraseña. Cambios y videos con guardado automático en este proyecto local.'}));root.append(launcher,panel);
 visualTools=setupVisualEditor({root,onSelection(){currentTab='lienzo';tabs.querySelectorAll('button').forEach(t=>t.setAttribute('aria-selected',String(t.dataset.tab==='lienzo')));rebuild();if(matchMedia('(max-width:900px)').matches)setOpen(true);}});panel.insertBefore(visualTools.tools,tabs);
 setOpen(true);contentPage=getPage();rebuild();
 function markPage(){pages.querySelectorAll('button').forEach(b=>b.classList.toggle('is-active',b.dataset.editorPage===getPage()));}markPage();
 document.addEventListener('page-changed',markPage);document.addEventListener('responses-changed',()=>{if(currentTab==='registros')rebuild();});
 document.addEventListener('config-loaded',rebuild);document.addEventListener('mother-board-ready',rebuild);document.addEventListener('animation-changed',rebuild);
 document.addEventListener('editor-preview',()=>{if(matchMedia('(max-width:900px)').matches)setOpen(false);});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden&&!document.body.classList.contains('ve-selecting'))setOpen(false);});
}
