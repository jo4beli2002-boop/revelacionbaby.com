export function setupMedia(){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const states=new Map();
 const refresh=(video,state)=>{
  const shouldPlay=state.visible&&!state.paused&&!reduced.matches&&!document.hidden;
  const button=video.parentElement.querySelector('.media-toggle');
  if(shouldPlay){video.play().then(()=>{button.textContent='Ⅱ';button.setAttribute('aria-label','Pausar animación');button.classList.remove('is-paused');}).catch(()=>{button.textContent='▷';button.setAttribute('aria-label','Reproducir animación');button.classList.add('is-paused');});}
  else{video.pause();button.textContent='▷';button.setAttribute('aria-label','Reproducir animación');button.classList.toggle('is-paused',state.paused||reduced.matches);}
 };
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{const state=states.get(entry.target);if(!state)return;state.visible=entry.isIntersecting;refresh(entry.target,state);}),{threshold:.05});
 function register(){
 states.forEach((state,video)=>{if(!video.isConnected){video.pause();observer.unobserve(video);states.delete(video);}});
 document.querySelectorAll('.animation video').forEach(video=>{
  if(states.has(video))return;
  const state={visible:false,paused:false};states.set(video,state);video.muted=true;
  observer.observe(video);
  video.addEventListener('loadeddata',()=>refresh(video,state));
  video.addEventListener('error',()=>{video.parentElement.querySelector('.media-toggle').hidden=true;});
  video.parentElement.querySelector('.media-toggle').addEventListener('click',()=>{
   if(reduced.matches&&video.paused){state.paused=false;video.play().then(()=>{const b=video.parentElement.querySelector('.media-toggle');b.textContent='Ⅱ';b.setAttribute('aria-label','Pausar animación');}).catch(()=>{});return;}
   state.paused=!video.paused;refresh(video,state);
  });
 });
 }
 register();document.addEventListener('visual-rendered',register);
 document.addEventListener('visibilitychange',()=>states.forEach((state,video)=>refresh(video,state)));
 reduced.addEventListener('change',()=>states.forEach((state,video)=>refresh(video,state)));
}
