export function initMedia() {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const videos=[...document.querySelectorAll('[data-gameplay]')];
 const visibility=new Map();const autoPaused=new WeakSet();const userPaused=new WeakSet();
 const preview=document.querySelector('[data-gameplay-preview]');
 const soundButton=document.querySelector('[data-watch-sound]');
 const previewButton=document.querySelector('[data-watch-preview]');
 const pauseButton=document.querySelector('[data-preview-pause]');
 const status=document.querySelector('[data-preview-status]');
 const previewSource=preview?.getAttribute('src');
 const fullSource=preview?.dataset.fullSrc;
 const previewLoop=preview?.loop;
 let watching=false,enteredFullscreen=false,viewer=null,placeholder=null,watchId=0;
 let previewFailed=false,previewPausedByUser=false,watchTrigger=soundButton;
 const setStatus=message=>{if(status){status.textContent=message;status.hidden=!message;}};
 const updateControls=()=>{
  if(previewButton)previewButton.hidden=watching;
  if(pauseButton){pauseButton.hidden=watching||previewFailed;pauseButton.textContent=preview?.paused?'Play preview':'Pause preview';}
 };
 const changeSource=source=>{
  if(!source||preview.getAttribute('src')===source)return;
  // load() clears old errors and pending playback before the new user-initiated play().
  preview.setAttribute('src',source);preview.load();userPaused.delete(preview);
 };
 const pauseOffscreen=(video,force=false)=>{
  if(video===preview&&watching&&!force)return;
  if(!video.paused){autoPaused.add(video);video.pause();}
 };
 const finishWatching=()=>{
  if(!watching)return;
  watching=false;enteredFullscreen=false;watchId++;
  pauseOffscreen(preview,true);preview.muted=true;preview.loop=previewLoop;preview.controls=false;
  changeSource(previewSource);preview.hidden=false;
  if(previewFailed)preview.dataset.failed='true';else delete preview.dataset.failed;
  preview.setAttribute('aria-label','BOG gameplay preview');updateControls();
  watchTrigger?.focus({preventScroll:true});
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
 const enterFullscreen=id=>{
  const fallback=()=>{if(watching&&id===watchId)showViewer();};
  try{
   // Call inside the click gesture, independently of the play() promise.
   if(typeof preview.requestFullscreen==='function'){
    Promise.resolve(preview.requestFullscreen()).catch(fallback);
   }else if(typeof preview.webkitEnterFullscreen==='function'){
    preview.webkitEnterFullscreen();
   }else if(typeof preview.webkitRequestFullscreen==='function'){
    Promise.resolve(preview.webkitRequestFullscreen()).catch(fallback);
   }else fallback();
  }catch{fallback();}
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
 videos.forEach(video=>{
  const errorMessage=video.parentElement.querySelector('.video-error');
  const fail=()=>{
   if(video!==preview){video.hidden=true;if(errorMessage)errorMessage.hidden=false;video.dataset.failed='true';return;}
   // A queued error from a replaced source has no current MediaError after load().
   if(!preview.error)return;
   if(watching){
    setStatus('The full video could not load. Please try again.');
    try{
     if(document.fullscreenElement===preview)Promise.resolve(document.exitFullscreen()).catch(()=>{});
     else if(typeof preview.webkitExitFullscreen==='function')preview.webkitExitFullscreen();
    }catch{}
    if(viewer?.open)viewer.close();else finishWatching();
   }else{
    previewFailed=true;preview.dataset.failed='true';
    setStatus('Preview unavailable. You can still watch the full video.');updateControls();
   }
  };
  video.addEventListener('error',fail);video.querySelector('source')?.addEventListener('error',fail);
  video.addEventListener('pause',()=>{if(autoPaused.has(video))autoPaused.delete(video);else userPaused.add(video);if(video===preview)updateControls();});
  video.addEventListener('play',()=>{userPaused.delete(video);videos.forEach(other=>{if(other!==video)pauseOffscreen(other);});if(video===preview)updateControls();});
 });
 const maybePlay=video=>{if(video===preview&&!watching&&!previewPausedByUser&&visibility.get(video)&&!reduced.matches&&!document.hidden&&!userPaused.has(video)&&!video.dataset.failed){video.muted=true;video.play().catch(()=>{});}};
 if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
   const visible=entry.intersectionRatio>=.55;visibility.set(entry.target,visible);
   if(!visible)pauseOffscreen(entry.target);else maybePlay(entry.target);
  }),{threshold:[0,.55]});videos.forEach(video=>observer.observe(video));
 }
 const watch=event=>{
  if(!preview||watching)return;
  pauseOffscreen(preview,true);watching=true;enteredFullscreen=false;watchTrigger=event.currentTarget;
  const id=++watchId;setStatus('');delete preview.dataset.failed;
  preview.hidden=false;preview.muted=false;preview.loop=false;preview.controls=true;
  changeSource(fullSource);preview.currentTime=0;
  preview.setAttribute('aria-label','Full BOG gameplay video');updateControls();
  preview.play().catch(()=>{});enterFullscreen(id);
 };
 soundButton?.addEventListener('click',watch);previewButton?.addEventListener('click',watch);
 pauseButton?.addEventListener('click',()=>{
  if(!preview||watching||previewFailed)return;
  if(preview.paused){previewPausedByUser=false;userPaused.delete(preview);preview.play().catch(()=>{});}
  else{previewPausedByUser=true;pauseOffscreen(preview,true);}
  updateControls();
 });
 if(preview){preview.controls=false;updateControls();}
 reduced.addEventListener('change',()=>{if(preview){if(reduced.matches)pauseOffscreen(preview);else maybePlay(preview);}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)videos.forEach(video=>pauseOffscreen(video,true));else if(preview)maybePlay(preview);});
}
