export function initMedia() {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const videos=[...document.querySelectorAll('[data-gameplay]')];
 const visibility=new Map();const autoPaused=new WeakSet();const userPaused=new WeakSet();
 const pauseOffscreen=video=>{if(!video.paused){autoPaused.add(video);video.pause();}};
 const preview=document.querySelector('[data-gameplay-preview]');
 // Start the silent preview on gameplay; the sound action still plays the full edit.
 preview?.addEventListener('loadedmetadata',()=>{
  const start=Number(preview.dataset.previewStart)||0;
  if(!reduced.matches&&preview.muted&&preview.currentTime===0&&start<preview.duration)preview.currentTime=start;
 },{once:true});
 videos.forEach(video=>{
  const fail=()=>{video.hidden=true;video.parentElement.querySelector('.video-error').hidden=false;video.dataset.failed='true';if(video===preview){const sound=document.querySelector('[data-watch-sound]');if(sound)sound.hidden=true;}};
  video.addEventListener('error',fail);video.querySelector('source')?.addEventListener('error',fail);
  video.addEventListener('pause',()=>{if(autoPaused.has(video))autoPaused.delete(video);else userPaused.add(video);});
  video.addEventListener('play',()=>{userPaused.delete(video);videos.forEach(other=>{if(other!==video)pauseOffscreen(other);});});
 });
 const maybePlay=video=>{if(video===preview&&visibility.get(video)&&!reduced.matches&&!document.hidden&&!userPaused.has(video)&&!video.dataset.failed){video.muted=true;video.play().catch(()=>{});}};
 if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
   const visible=entry.intersectionRatio>=.55;visibility.set(entry.target,visible);
   if(!visible)pauseOffscreen(entry.target);else maybePlay(entry.target);
  }),{threshold:[0,.55]});videos.forEach(video=>observer.observe(video));
 }
 document.querySelector('[data-watch-sound]')?.addEventListener('click',()=>{
  if(!preview||preview.dataset.failed)return;
  preview.currentTime=0;preview.muted=false;preview.play().then(()=>preview.focus({preventScroll:true})).catch(()=>{});
 });
 reduced.addEventListener('change',()=>{if(preview){if(reduced.matches)pauseOffscreen(preview);else maybePlay(preview);}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)videos.forEach(pauseOffscreen);else if(preview)maybePlay(preview);});
}
