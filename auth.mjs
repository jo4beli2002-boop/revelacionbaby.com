import {readFile} from 'node:fs/promises';
import {readFileSync,writeFileSync,renameSync,mkdirSync} from 'node:fs';
import {randomBytes,scrypt,timingSafeEqual,createHash} from 'node:crypto';
import {promisify} from 'node:util';
import path from 'node:path';
const derive=promisify(scrypt),ADMIN='SRJO4B_ADMIN',MOTHER='Gabriela Baquedano';
export function createAuth(dataDir){
 const sessions=new Map(),attempts=new Map();
 const sessionFile=path.join(dataDir,'sessions.json');
 const sessionKey=t=>t?createHash('sha256').update(t).digest('hex'):null;
 try{const saved=JSON.parse(readFileSync(sessionFile,'utf8'));for(const [key,s]of saved){if(/^[a-f0-9]{64}$/.test(key)&&s.expires>Date.now()&&s.expires<=Date.now()+8*60*60*1000&&s.user&&['admin','guest','observer'].includes(s.user.role)&&typeof s.user.name==='string'&&(s.user.role!=='admin'||s.user.name===ADMIN)&&(s.user.role!=='observer'||s.user.name===MOTHER))sessions.set(key,s);}}catch(e){if(e.code!=='ENOENT')console.warn('No se pudo recuperar la sesión; se requiere ingresar de nuevo.');}
 function persistSessions(){mkdirSync(dataDir,{recursive:true});const temp=sessionFile+'.tmp';writeFileSync(temp,JSON.stringify([...sessions]),{mode:0o600});renameSync(temp,sessionFile);}
 function token(req){return req.headers.cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith('dulce_session='))?.slice(14);}
 function user(req){const key=sessionKey(token(req)),session=key&&sessions.get(key);if(!session)return null;if(session.expires<Date.now()){sessions.delete(key);return null;}return session.user;}
 function cookie(res,value,age=28800){res.setHeader('Set-Cookie',`dulce_session=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${age}`);}
 async function enter(req,res,body){
  let name=typeof body.name==='string'?body.name.trim():'';
  if(!name||name.length>80||!/^[\p{L}\p{N} .,'’_-]+$/u.test(name))return{status:400,error:'Escribe tu nombre (hasta 80 caracteres).'};
  let role='guest';
  const mother=name.toLowerCase().replace(/\s+/g,' ')===MOTHER.toLowerCase();
  if(name.toUpperCase()===ADMIN||mother){
   const key=req.socket.remoteAddress||'local',now=Date.now();let limit=attempts.get(key);if(!limit||limit.until<now){limit={count:0,until:now+15*60*1000};attempts.set(key,limit);}
   if(limit.count>=5)return{status:429,error:'Demasiados intentos. Vuelve a intentarlo en 15 minutos.'};
   limit.count++;
   let auth;try{auth=JSON.parse(await readFile(path.join(dataDir,mother?'observer-auth.json':'admin-auth.json'),'utf8'));}catch{return{status:503,error:'El acceso del administrador aún no está configurado.'};}
   const password=typeof body.password==='string'?body.password:'';
   if(password.length>200)return{status:400,error:'Credenciales no válidas.'};
   const expected=Buffer.from(auth.hash,'hex'),actual=await derive(password,auth.salt,64);
   if((!mother&&name!==ADMIN)||expected.length!==actual.length||!timingSafeEqual(expected,actual))return{status:401,error:'Usuario o contraseña incorrectos.'};
   attempts.delete(key);role=mother?'observer':'admin';if(mother)name=MOTHER;
  }
  const old=sessionKey(token(req));if(old)sessions.delete(old);
  for(const [t,s]of sessions)if(s.expires<Date.now())sessions.delete(t);
  if(sessions.size>=2000)return{status:503,error:'Inténtalo de nuevo en unos minutos.'};
  const id=randomBytes(32).toString('base64url'),value={name,role};sessions.set(sessionKey(id),{user:value,expires:Date.now()+8*60*60*1000});persistSessions();cookie(res,id);return{status:200,user:value};
 }
 function logout(req,res){sessions.delete(sessionKey(token(req)));persistSessions();cookie(res,'',0);}
 return{user,enter,logout};
}
