import {createServer} from 'node:http';
import {createReadStream} from 'node:fs';
import {stat,realpath,readFile,writeFile,mkdir,rename,unlink} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createAuth} from './auth.mjs';
import {createNotifications} from './gmail-notifications.mjs';
const root=fileURLToPath(new URL('./public/',import.meta.url));
const port=Number(process.env.PORT||4187);
const dataDir=process.env.PROJECT_DATA_DIR?path.resolve(process.env.PROJECT_DATA_DIR):fileURLToPath(new URL('./.data/',import.meta.url));
const configFile=path.join(dataDir,'project-config.json');
try{await stat(configFile);}catch(e){if(e.code==='ENOENT'){const seed=JSON.parse(await readFile(new URL('./project-defaults.json',import.meta.url),'utf8'));await mkdir(dataDir,{recursive:true});await writeFile(configFile,JSON.stringify({config:seed,savedAt:new Date().toISOString()}),{flag:'wx'});}else throw e;}
const auth=createAuth(dataDir);
const fallbackFamilies=[{id:'carmen-joab',name:'Carmen y Joab',detail:'+2 hijos',people:4},{id:'francisca-olvin',name:'Francisca y Olvin',detail:'',people:2}];
const notifications=createNotifications({dataDir,async getFamilies(){try{const data=JSON.parse(await readFile(configFile,'utf8'));return data.config.families||fallbackFamilies;}catch(e){if(e.code==='ENOENT')return fallbackFamilies;throw e;}},async getEvent(){try{const {config}=JSON.parse(await readFile(configFile,'utf8'));return{dateISO:config.dateISO,time:config.time,eventPlace:config.eventPlace};}catch(e){if(e.code==='ENOENT')return{dateISO:'2026-11-08',time:'15:00',eventPlace:'Centro comunal Abraham Lincoln'};throw e;}}});
notifications.start().catch(()=>{});
let writeQueue=Promise.resolve();
async function body(req,limit){const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>limit)throw Object.assign(Error('El archivo supera el límite permitido.'),{status:413});chunks.push(chunk);}return Buffer.concat(chunks);}
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.mp4':'video/mp4','.webm':'video/webm','.ico':'image/x-icon'};
const server=createServer(async(req,res)=>{
 const headers={'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",'Cache-Control':'no-cache'};
 const json=(status,value)=>res.writeHead(status,{...headers,'Cache-Control':'no-store','Content-Type':'application/json; charset=utf-8'}).end(JSON.stringify(value));
 try{
  if(![`127.0.0.1:${port}`,`localhost:${port}`].includes(req.headers.host)){json(403,{error:'Host no permitido.'});return;}
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const user=auth.user(req);
  if(pathname.startsWith('/api/')){
   if(pathname==='/api/session'&&req.method==='GET'){json(200,{user});return;}
   if(['/api/registrations','/api/notifications'].includes(pathname)&&req.method==='GET'){if(user?.role!=='admin'){json(user?403:401,{error:'Acceso reservado al administrador.'});return;}json(200,pathname==='/api/registrations'?{records:await notifications.list()}:await notifications.status());return;}
   if(pathname==='/api/family-status'&&req.method==='GET'){
    if(!['admin','observer'].includes(user?.role)){json(user?403:401,{error:'Vista reservada a los organizadores.'});return;}
    let families=fallbackFamilies;try{families=JSON.parse(await readFile(configFile,'utf8')).config.families||families;}catch(e){if(e.code!=='ENOENT')throw e;}
    const records=await notifications.list();
    const rows=families.map(f=>{const matches=records.filter(r=>r.families.some(x=>x.id===f.id)),states=matches.map(r=>r.notifications.emailGuest);return{id:f.id,name:f.name,detail:f.detail||'',people:f.people,confirmed:matches.length>0,email:!matches.length?'not_registered':states.every(s=>s==='sent')?'sent':states.some(s=>['failed','uncertain'].includes(s))?'needs_review':'pending',whatsapp:'manual'};});
    json(200,{families:rows,updatedAt:new Date().toISOString()});return;
   }
   if(pathname==='/api/config'&&req.method==='GET'){
    if(!user){json(401,{error:'Ingresa tu nombre para continuar.'});return;}
    try{const data=JSON.parse(await readFile(configFile,'utf8'));if(user.role!=='admin'&&data.config){delete data.config.collaborators;delete data.config.notificationEmails;}json(200,data);}catch(e){if(e.code==='ENOENT')json(200,{config:null});else throw e;}return;
   }
   if(req.method!=='POST'){json(405,{error:'Método no permitido.'});return;}
   if(req.headers.origin!==`http://${req.headers.host}`){json(403,{error:'Origen no permitido.'});return;}
   if(pathname==='/api/enter'){
    if(!req.headers['content-type']?.startsWith('application/json')){json(415,{error:'Se requiere JSON.'});return;}
    let value;try{value=JSON.parse((await body(req,4096)).toString('utf8'));}catch(e){if(e.status)throw e;json(400,{error:'Solicitud inválida.'});return;}
    const result=await auth.enter(req,res,value||{});json(result.status,result);return;
   }
   if(pathname==='/api/logout'){auth.logout(req,res);json(200,{ok:true});return;}
   if(pathname==='/api/rsvp'){
    if(user?.role==='observer'){json(403,{error:'Tu cuenta es de consulta. No puede enviar confirmaciones.'});return;}
    if(!user){json(401,{error:'Ingresa tu nombre antes de confirmar.'});return;}
    if(!req.headers['content-type']?.startsWith('application/json')){json(415,{error:'Se requiere JSON.'});return;}
    let value;try{value=JSON.parse((await body(req,16384)).toString('utf8'));}catch(e){if(e.status)throw e;json(400,{error:'Solicitud inválida.'});return;}
    const record=await notifications.register(value||{},user,req.socket.remoteAddress);const {fingerprint,...safeRecord}=record;json(200,{record:safeRecord});return;
   }
   if(pathname==='/api/families'){
    if(!['admin','observer'].includes(user?.role)){json(user?403:401,{error:'Solo Gabriela o el administrador pueden administrar familias.'});return;}
    if(!req.headers['content-type']?.startsWith('application/json')){json(415,{error:'Se requiere JSON.'});return;}
    let value;try{value=JSON.parse((await body(req,4096)).toString('utf8'));}catch{json(400,{error:'Datos de familia inválidos.'});return;}
    if(!value||Object.keys(value).some(k=>!['id','name','detail','people'].includes(k))||typeof value.name!=='string'||!value.name.trim()||value.name.trim().length>100||typeof value.detail!=='string'||value.detail.length>60||!Number.isInteger(value.people)||value.people<1||value.people>30||(value.id!=null&&(typeof value.id!=='string'||!/^[\w-]{1,60}$/.test(value.id)))){json(400,{error:'Escribe un nombre de hasta 100 caracteres, detalle de hasta 60 y entre 1 y 30 personas.'});return;}
    const task=writeQueue.then(async()=>{
     const saved=JSON.parse(await readFile(configFile,'utf8')),families=saved.config.families;
     const index=value.id?families.findIndex(f=>f.id===value.id):-1;
     if(value.id&&index<0)throw Object.assign(Error('Esta familia ya no está en el listado. Actualiza e inténtalo de nuevo.'),{status:404});
     if(index<0&&families.length>=200)throw Object.assign(Error('El listado admite hasta 200 familias.'),{status:400});
     const family={id:value.id||'f-'+randomUUID(),name:value.name.trim(),detail:value.detail.trim(),people:value.people};
     if(families.some(f=>f.id!==family.id&&f.name.trim().toLowerCase()===family.name.toLowerCase()&&(f.detail||'').trim().toLowerCase()===family.detail.toLowerCase()))throw Object.assign(Error('Esta familia ya existe en el listado.'),{status:409});
     if(index<0)families.push(family);else families[index]=family;
     saved.savedAt=new Date().toISOString();saved.config.familyRevision=saved.savedAt;
     const temp=path.join(dataDir,'config-'+randomUUID()+'.tmp');try{await writeFile(temp,JSON.stringify(saved));await rename(temp,configFile);}catch(e){await unlink(temp).catch(()=>{});throw e;}
     return family;
    });writeQueue=task.catch(()=>{});json(200,{family:await task});return;
   }
   if(user?.role!=='admin'){json(user?403:401,{error:'Solo el administrador puede editar esta invitación.'});return;}
   if(pathname==='/api/notifications/check'){json(200,await notifications.check());return;}
   if(pathname==='/api/notifications'){
    let value;try{value=JSON.parse((await body(req,8192)).toString('utf8'));}catch(e){if(e.status)throw e;json(400,{error:'Solicitud inválida.'});return;}json(200,await notifications.settings(value||{}));return;
   }
   if(pathname==='/api/config'){
    if(!req.headers['content-type']?.startsWith('application/json')){json(415,{error:'Se requiere JSON.'});return;}
    let config;try{config=JSON.parse((await body(req,6*1024*1024)).toString('utf8'));}catch(e){if(e.status)throw e;json(400,{error:'JSON inválido.'});return;}
    if(!config||config.version!==1||typeof config.title!=='string'){json(400,{error:'Configuración inválida.'});return;}
    const savedAt=new Date().toISOString();
    const task=writeQueue.then(async()=>{await mkdir(dataDir,{recursive:true});let previous;try{previous=JSON.parse(await readFile(configFile,'utf8')).config;}catch(e){if(e.code!=='ENOENT')throw e;}if(previous?.familyRevision&&previous.familyRevision!==config.familyRevision){if(JSON.stringify(config.families)===JSON.stringify(config._familyBaseline)){config.families=previous.families;config.familyRevision=previous.familyRevision;}else throw Object.assign(Error('La lista de familias cambió. Actualiza las familias antes de guardar tus cambios en el listado.'),{status:409});}if(previous&&JSON.stringify(previous.families)!==JSON.stringify(config.families))config.familyRevision=savedAt;delete config._familyBaseline;const temp=path.join(dataDir,'config-'+randomUUID()+'.tmp');try{await writeFile(temp,JSON.stringify({config,savedAt}));await rename(temp,configFile);}catch(e){await unlink(temp).catch(()=>{});throw e;}});writeQueue=task.catch(()=>{});await task;json(200,{savedAt,families:config.families,familyRevision:config.familyRevision});return;
   }
   if(pathname==='/api/animations'){
    const type=req.headers['content-type']?.split(';')[0];if(!['video/mp4','video/webm'].includes(type)){json(415,{error:'Elige un video MP4 o WebM.'});return;}
    const bytes=await body(req,40*1024*1024);
    const valid=type==='video/mp4'?bytes.length>12&&bytes.subarray(4,8).toString()==='ftyp':bytes.length>4&&bytes.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3]));
    if(!valid){json(400,{error:'El archivo no corresponde al formato de video indicado.'});return;}
    const name='upload-'+randomUUID()+(type==='video/mp4'?'.mp4':'.webm');await writeFile(path.join(root,'assets',name),bytes,{flag:'wx'});json(201,{src:'assets/'+name,bytes:bytes.length});return;
   }
   json(404,{error:'Ruta no encontrada.'});return;
  }
  if(['/editor.js','/visual-editor.js','/animation-upload.js','/notification-panel.js'].includes(pathname)&&user?.role!=='admin'){json(403,{error:'Acceso reservado al administrador.'});return;}
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{...headers,Allow:'GET, HEAD'}).end();return;}
  const requested=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  const canonical=await realpath(requested);
  if(!canonical.startsWith(root)){res.writeHead(403,headers).end();return;}
  if(['editor.js','visual-editor.js','animation-upload.js','notification-panel.js'].includes(path.basename(canonical).toLowerCase())&&user?.role!=='admin'){json(403,{error:'Acceso reservado al administrador.'});return;}
  const s=await stat(canonical);
  if(!s.isFile())throw Error('Not a file');
  const h={...headers,'Content-Type':mime[path.extname(canonical)]||'application/octet-stream','Accept-Ranges':'bytes'};
  const range=req.headers.range;
  if(range){
   const m=/^bytes=(\d*)-(\d*)$/.exec(range);
   if(!m||(!m[1]&&!m[2])){res.writeHead(416,{...h,'Content-Range':`bytes */${s.size}`}).end();return;}
   const start=m[1]?Number(m[1]):Math.max(0,s.size-Number(m[2]));
   const end=m[1]?(m[2]?Math.min(Number(m[2]),s.size-1):s.size-1):s.size-1;
   if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=s.size){res.writeHead(416,{...h,'Content-Range':`bytes */${s.size}`}).end();return;}
   res.writeHead(206,{...h,'Content-Length':end-start+1,'Content-Range':`bytes ${start}-${end}/${s.size}`});
   if(req.method==='HEAD')res.end();else createReadStream(canonical,{start,end}).on('error',()=>res.destroy()).pipe(res);
  }else{
   res.writeHead(200,{...h,'Content-Length':s.size});
   if(req.method==='HEAD')res.end();else createReadStream(canonical).on('error',()=>res.destroy()).pipe(res);
  }
 }catch(e){if(!res.headersSent){if(req.url?.startsWith('/api/'))json(e.status||500,{error:e.status?e.message:'No se pudo completar el guardado.'});else res.writeHead(404,headers).end('No encontrado');}else res.destroy();}
});
server.listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}`));
