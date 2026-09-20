export function initMedia() {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const videos=[...document.querySelectorAll('[data-gameplay]')];
 const visibility=new Map();const autoPaused=new WeakSet();const userPaused=new WeakSet();
 const preview=document.querySelector('[data-gameplay-preview]');
 const soundButton=document.querySelector('[data-watch-sound]');
 const previewLoop=preview?.loop;
 let watching=false,enteredFullscreen=false,viewer=null,placeholder=null;
 const pauseOffscreen=(video,force=false)=>{
  if(video===preview&&watching&&!force)return;
  if(!video.paused){autoPaused.add(video);video.pause();}
 };
 const finishWatching=()=>{
  if(!watching)return;
  watching=false;enteredFullscreen=false;
  pauseOffscreen(preview,true);preview.muted=true;preview.loop=previewLoop;
  soundButton?.focus({preventScroll:true});
  if(visibility.get(preview))maybePlay(preview);
 };
 const restorePreview=()=>{
  if(placeholder){placeholder.replaceWith(preview);placeholder=null;}
  document.body.classList.remove('video-viewer-open');
  finishWatching();
 };
 // A top-layer dialog also works when the browser or embedding host denies native fullscreen.
 const showViewer=()=>{
  if(!watching||preview.dataset.failed)return;
  if(!viewer){
   viewer=document.createElement('dialog');viewer.className='video-viewer';
   viewer.setAttribute('aria-label','BOG gameplay video');
   const close=document.createElement('button');close.type='button';
   close.className='video-viewer-close';close.textContent='Close video ×';
   close.addEventListener('click',()=>viewer.close());
   viewer.append(close);viewer.addEventListener('close',restorePreview);
   document.body.append(viewer);
  }
  if(viewer.open)return;
  placeholder=document.createComment('Gameplay preview position');
  preview.replaceWith(placeholder);viewer.append(preview);
  document.body.classList.add('video-viewer-open');viewer.showModal();
  // Reparenting can pause media in some browsers; continue the explicit playback.
  preview.play().catch(()=>{});
 };
 const enterFullscreen=()=>{
  try{
   // Call inside the click gesture, independently of the play() promise.
   if(typeof preview.requestFullscreen==='function'){
    Promise.resolve(preview.requestFullscreen()).catch(showViewer);
   }else if(typeof preview.webkitEnterFullscreen==='function'){
    preview.webkitEnterFullscreen();
   }else if(typeof preview.webkitRequestFullscreen==='function'){
    Promise.resolve(preview.webkitRequestFullscreen()).catch(showViewer);
   }else showViewer();
  }catch{showViewer();}
 };
 const endFullscreen=()=>{if(viewer?.open)viewer.close();else finishWatching();};
 const fullscreenChanged=()=>{
  if(document.fullscreenElement===preview||document.webkitFullscreenElement===preview)enteredFullscreen=true;
  else if(enteredFullscreen)endFullscreen();
 };
 document.addEventListener('fullscreenchange',fullscreenChanged);
 document.addEventListener('webkitfullscreenchange',fullscreenChanged);
 preview?.addEventListener('webkitbeginfullscreen',()=>{enteredFullscreen=true;});
 preview?.addEventListener('webkitendfullscreen',endFullscreen);
 // Start the silent preview on gameplay; the sound action still plays the full edit.
 preview?.addEventListener('loadedmetadata',()=>{
  const start=Number(preview.dataset.previewStart)||0;
  if(!watching&&!reduced.matches&&preview.muted&&preview.currentTime===0&&start<preview.duration)preview.currentTime=start;
 },{once:true});
 videos.forEach(video=>{
  const errorMessage=video.parentElement.querySelector('.video-error');
  const fail=()=>{video.hidden=true;if(errorMessage)errorMessage.hidden=false;video.dataset.failed='true';if(video===preview){if(soundButton)soundButton.hidden=true;if(viewer?.open)viewer.close();}};
  video.addEventListener('error',fail);video.querySelector('source')?.addEventListener('error',fail);
  video.addEventListener('pause',()=>{if(autoPaused.has(video))autoPaused.delete(video);else userPaused.add(video);});
  video.addEventListener('play',()=>{userPaused.delete(video);videos.forEach(other=>{if(other!==video)pauseOffscreen(other);});});
 });
 const maybePlay=video=>{if(video===preview&&!watching&&visibility.get(video)&&!reduced.matches&&!document.hidden&&!userPaused.has(video)&&!video.dataset.failed){video.muted=true;video.play().catch(()=>{});}};
 if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
   const visible=entry.intersectionRatio>=.55;visibility.set(entry.target,visible);
   if(!visible)pauseOffscreen(entry.target);else maybePlay(entry.target);
  }),{threshold:[0,.55]});videos.forEach(video=>observer.observe(video));
 }
 soundButton?.addEventListener('click',()=>{
  if(!preview||preview.dataset.failed)return;
  watching=true;preview.currentTime=0;preview.muted=false;preview.loop=false;
  preview.play().catch(()=>{});enterFullscreen();
 });
 reduced.addEventListener('change',()=>{if(preview){if(reduced.matches)pauseOffscreen(preview);else maybePlay(preview);}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)videos.forEach(video=>pauseOffscreen(video,true));else if(preview)maybePlay(preview);});
}
