import {config,validateConfig} from './app.js';
import {resetMotherVisual,renderMotherVisual} from './visual-model.js';
export function setupMother({editing=false}={}){
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
 const editable=(n,id)=>{n.dataset.veId='mother-'+id;n.dataset.motherEditable='true';return n;};
 document.body.classList.add('mother-view');
 const greeting=el('div',null,'mother-greeting'),label=editable(el('p','BIENVENIDA','eyebrow'),'greeting-label'),title=editable(el('h1','Futura mamá 💛'),'greeting-title');title.id='mother-greeting-title';greeting.append(label,title);document.querySelector('.intro-copy').append(greeting);
 const status=el('p',null,'mother-update');status.setAttribute('role','status');
 const refresh=el('button','Actualizar familias','mother-refresh');refresh.type='button';document.querySelector('.family-fieldset').append(refresh,status);
 const next=el('button','Ver celebración →','button primary mother-next');next.type='button';next.addEventListener('click',()=>{location.hash='/confirmacion';});document.querySelector('#rsvp-form').append(next);
 const back=el('a','Ver familias confirmadas','button primary mother-back');back.href='#/registro';document.querySelector('.confirmation-scene').append(back);
 let families=[],running=false,view={...config.motherView},visual=config.visual;
 const dialog=document.createElement('dialog');dialog.className='mother-family-dialog';dialog.setAttribute('aria-labelledby','mother-family-title');
 const editForm=el('form'),dialogTitle=el('h2','Agregar familia');dialogTitle.id='mother-family-title';
 const fields={};for(const [key,text,type]of [['name','Nombre de la familia','text'],['detail','Detalle · opcional','text'],['people','Personas incluidas','number']]){const wrap=el('label',text),input=document.createElement('input');input.type=type;input.name=key;input.maxLength=key==='name'?100:60;if(type==='number'){input.min=1;input.max=30;input.step=1;}input.required=key!=='detail';wrap.append(input);fields[key]=input;editForm.append(wrap);}
 const error=el('p',null,'field-error');error.setAttribute('role','alert');const save=el('button','Guardar familia','button primary'),cancel=el('button','Cancelar','mother-refresh');save.type='submit';cancel.type='button';cancel.addEventListener('click',()=>dialog.close());editForm.prepend(dialogTitle);editForm.append(error,save,cancel);dialog.append(editForm);document.body.append(dialog);let editingId;
 function openFamily(family){editingId=family?.id;dialogTitle.textContent=family?'Editar familia':'Agregar familia';fields.name.value=family?.name||'';fields.detail.value=family?.detail||'';fields.people.value=family?.people||2;error.textContent='';dialog.showModal();fields.name.focus();}
 const add=el('button','+ Agregar familia','mother-add-family');add.type='button';add.addEventListener('click',()=>openFamily());document.querySelector('#family-done').before(add);
 editForm.addEventListener('submit',async event=>{event.preventDefault();if(!editForm.reportValidity())return;save.disabled=true;error.textContent='';try{const response=await fetch('/api/families',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...(editingId?{id:editingId}:{}),name:fields.name.value.trim(),detail:fields.detail.value.trim(),people:Number(fields.people.value)})});const result=await response.json();if(!response.ok)throw Error(result.error||'No se pudo guardar la familia.');dialog.close();await load();document.querySelector('#family-dropdown').hidden=false;document.querySelector('#family-trigger').setAttribute('aria-expanded','true');status.textContent='✓ Familia guardada en el listado';}catch(e){error.textContent=e.message;}finally{save.disabled=false;}});
 const emailLabel={sent:'Correo enviado',pending:'Correo pendiente',needs_review:'Correo por revisar',not_registered:''};
 function formPreview(){
  const form=document.querySelector('#rsvp-form');form.hidden=false;form.querySelectorAll('input').forEach(n=>n.disabled=true);form.querySelector('[type=submit]').hidden=true;
  const options=document.querySelector('#family-options');options.replaceChildren();
  for(const family of families){
   const row=el('div',null,'family-option mother-family-row'),input=document.createElement('input');input.type='checkbox';input.name='families';input.value=family.id;input.checked=family.confirmed;input.disabled=true;input.setAttribute('aria-label',family.name+' · '+(family.confirmed?'Confirmada':'Pendiente'));
   const name=el('span',family.name);if(family.detail)name.append(el('small',family.detail));const state=el('span',(family.confirmed?'✓ Confirmada':'✕ Pendiente')+(view.showMail&&family.confirmed?' · '+emailLabel[family.email]:''),'mother-family-state');const edit=el('button','Editar','mother-edit-family');edit.type='button';edit.setAttribute('aria-label','Editar familia '+family.name);edit.addEventListener('click',()=>openFamily(family));row.append(input,name,state,edit);options.append(row);
  }
  document.querySelector('#family-summary').textContent='Ver familias confirmadas y pendientes';
  let note=form.querySelector('.mother-form-note');if(!note){note=el('p',null,'mother-form-note');form.prepend(note);}note.textContent=view.formNote;
 }
 function render(){
  resetMotherVisual();document.querySelector('#hero-title').hidden=true;document.querySelector('.intro-copy>.eyebrow').hidden=true;document.querySelector('.intro-scene').setAttribute('aria-labelledby',title.id);
  label.textContent=view.greetingLabel||'BIENVENIDA';title.textContent=view.title||'Futura mamá 💛';title.style.color=view.titleColor;title.style.fontSize='clamp(38px, 6vw, '+(view.titleSize||80)+'px)';
  formPreview();renderMotherVisual(visual);
 }
 async function load(){if(running)return;running=true;refresh.disabled=true;try{
  const [response,settings]=await Promise.all([fetch('/api/family-status',{cache:'no-store'}),fetch('/api/config',{cache:'no-store'})]);if(!response.ok||!settings.ok)throw Error();const data=await response.json(),project=await settings.json(),latest=editing?config:validateConfig(project.config);view=latest.motherView;visual=latest.visual;families=data.families;render();status.textContent='✓ Familias actualizadas';
 }catch{status.textContent='No se pudo actualizar. Reintenta o vuelve a ingresar si tu sesión terminó.';}finally{refresh.disabled=false;running=false;}}
 refresh.addEventListener('click',load);document.querySelector('#rsvp-form').addEventListener('submit',e=>{e.preventDefault();e.stopImmediatePropagation();},true);
 document.addEventListener('config-rendered',()=>{view=config.motherView;visual=config.visual;render();});document.addEventListener('page-changed',render);
 render();load();document.dispatchEvent(new Event('mother-board-ready'));const timer=setInterval(()=>{if(!document.hidden)load();},30000);window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
}
