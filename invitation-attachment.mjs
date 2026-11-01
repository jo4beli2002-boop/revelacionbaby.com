import sharp from 'sharp';
import {fileURLToPath} from 'node:url';
const template=fileURLToPath(new URL('./public/assets/invitacion-base.jpg',import.meta.url));
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export async function invitationImage(family){
 const width=1400,height=Math.round(4961/3508*width);
 const background=await sharp(template).resize(width,height).toBuffer();
 const {data}=await sharp(background).extract({left:Math.round(width*.5),top:Math.round(height*.465),width:1,height:1}).raw().toBuffer({resolveWithObject:true});
 const color=`rgb(${data[0]},${data[1]},${data[2]})`;
 const left=Math.round(width*.23),top=Math.round(height*.471),boxWidth=Math.round(width*.55),boxHeight=Math.round(height*.053);
 const name=String(family.name||'').slice(0,100)+(family.detail?' ('+String(family.detail).slice(0,60)+')':'');
 const label=await sharp({text:{text:'<span foreground="#ad5335">'+escape(name)+'</span>',font:'Arial Bold',width:boxWidth-20,height:boxHeight-20,align:'centre',rgba:true}}).png().toBuffer({resolveWithObject:true});
 const cover=Buffer.from(`<svg width="${boxWidth}" height="${boxHeight}"><rect width="100%" height="100%" fill="${color}"/></svg>`);
 return sharp(background).composite([{input:cover,left,top},{input:label.data,left:left+Math.round((boxWidth-label.info.width)/2),top:top+Math.round((boxHeight-label.info.height)/2)}]).jpeg({quality:86,mozjpeg:true}).toBuffer();
}
export async function invitationAttachments(families){
 if(families.length>20)throw Error('El registro supera el máximo de 20 invitaciones por correo.');
 const files=[];let total=0;
 for(const [i,family]of families.entries()){
  const image=await invitationImage(family);total+=image.length;
  if(total>5*1024*1024)throw Error('Las invitaciones superan el tamaño permitido por correo.');
  const slug=String(family.name).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').slice(0,70)||'familia';
  files.push({name:`Invitacion-${i+1}-${slug}.jpg`,mimeType:'image/jpeg',base64:image.toString('base64')});
 }
 return files;
}
