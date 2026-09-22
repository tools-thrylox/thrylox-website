import { screenshots } from '../content/screenshots.mjs';

let viewer, index = 0, opener, priorOverflow, zoomed = false;
const wrap = n => (n + screenshots.length) % screenshots.length;
function createViewer() {
  viewer = document.createElement('dialog');
  viewer.className = 'screenshot-viewer';
  viewer.setAttribute('aria-labelledby', 'screenshot-heading');
  viewer.innerHTML = `<header class="screenshot-toolbar"><div><span class="screenshot-kicker">BOG / IN-GAME SCREENSHOTS</span><h2 id="screenshot-heading">A closer look.</h2></div><div class="screenshot-tools"><button type="button" data-zoom aria-pressed="false">Zoom in</button><button type="button" data-close aria-label="Close screenshot gallery" autofocus>Close <span aria-hidden="true">×</span></button></div></header><div class="screenshot-layout"><div class="screenshot-main"><div class="screenshot-stage" tabindex="0" aria-label="Screenshot. Use left and right arrow keys to browse."><img class="screenshot-full" width="1206" height="2622" alt=""><p class="screenshot-error" hidden>Image unavailable. Try another screenshot or <a target="_blank" rel="noopener">open the image</a>.</p></div><footer class="screenshot-controls"><button type="button" data-previous aria-label="Previous screenshot">←</button><p role="status" aria-live="polite" aria-atomic="true"></p><button type="button" data-next aria-label="Next screenshot">→</button></footer></div><nav class="screenshot-thumbnails" aria-label="Choose a screenshot"></nav></div>`;
  const thumbs = viewer.querySelector('.screenshot-thumbnails');
  screenshots.forEach((s,i)=>{
    const button=document.createElement('button');
    button.type='button'; button.dataset.index=i;
    button.setAttribute('aria-label',`${i+1}. ${s.title}`);
    const img=document.createElement('img');
    img.src=s.thumb; img.alt=''; img.width=180; img.height=391; img.loading='lazy';
    const number=document.createElement('span'); number.textContent=String(i+1).padStart(2,'0');
    button.append(img,number); button.addEventListener('click',()=>show(i)); thumbs.append(button);
  });
  document.body.append(viewer);
  viewer.querySelector('[data-close]').onclick=()=>viewer.close();
  viewer.querySelector('[data-next]').onclick=()=>show(index+1);
  viewer.querySelector('[data-previous]').onclick=()=>show(index-1);
  viewer.querySelector('[data-zoom]').onclick=()=>setZoom(!zoomed);
  viewer.querySelector('.screenshot-full').ondblclick=()=>setZoom(!zoomed);
  viewer.addEventListener('keydown',event=>{
    if(event.key==='Tab') {
      const controls=[...viewer.querySelectorAll('button,a[href],[tabindex="0"]')].filter(el=>el.getClientRects().length&&!el.disabled);
      const first=controls[0],last=controls.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
    if(event.key==='ArrowRight'||event.key==='ArrowLeft') {
      if(zoomed) return;
      event.preventDefault(); show(index+(event.key==='ArrowRight'?1:-1));
    }
    if(event.key==='Escape'&&zoomed){event.preventDefault();setZoom(false);}
  });
  viewer.addEventListener('close',()=>{
    document.documentElement.style.overflow=priorOverflow;
    opener?.focus({preventScroll:true});
  });
  const stage=viewer.querySelector('.screenshot-stage');
  let start;
  stage.addEventListener('touchstart',event=>{start=event.touches.length===1?{x:event.touches[0].clientX,y:event.touches[0].clientY}:null;},{passive:true});
  stage.addEventListener('touchend',event=>{
    if(!start||zoomed)return;
    const dx=event.changedTouches[0].clientX-start.x,dy=event.changedTouches[0].clientY-start.y;
    if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.5) show(index+(dx<0?1:-1));
    start=null;
  },{passive:true});
  stage.addEventListener('touchcancel',()=>{start=null;},{passive:true});
}
function setZoom(value) {
  zoomed=value;
  viewer.classList.toggle('is-zoomed',value);
  const button=viewer.querySelector('[data-zoom]');
  button.setAttribute('aria-pressed',String(value));button.textContent=value?'Fit to screen':'Zoom in';
  const stage=viewer.querySelector('.screenshot-stage'); stage.scrollTop=0;stage.scrollLeft=0;
}
function show(n) {
  index=wrap(n);setZoom(false);
  const s=screenshots[index],img=viewer.querySelector('.screenshot-full'),error=viewer.querySelector('.screenshot-error');
  error.hidden=true;img.hidden=false;
  img.onerror=()=>{img.hidden=true;error.hidden=false;};
  error.querySelector('a').href=s.src;
  img.alt=`BOG — ${s.title}`;img.src=s.src;
  viewer.querySelector('[role=status]').textContent=`${String(index+1).padStart(2,'0')} / ${screenshots.length} · ${s.title}`;
  viewer.querySelectorAll('[data-index]').forEach(button=>button.setAttribute('aria-current',String(Number(button.dataset.index)===index)));
  viewer.querySelector('[aria-current=true]').scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
  // Only the current frame and its neighbours use full-size assets.
  for(const next of [wrap(index-1),wrap(index+1)]){const image=new Image();image.src=screenshots[next].src;}
}
document.addEventListener('click',event=>{
  const link=event.target.closest('[data-gallery-open]');
  if(!link||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.button!==0)return;
  if(typeof HTMLDialogElement==='undefined')return;
  event.preventDefault();opener=link;
  if(!viewer)createViewer();
  priorOverflow=document.documentElement.style.overflow;
  document.documentElement.style.overflow='hidden';
  document.querySelectorAll('video').forEach(video=>video.pause());
  viewer.showModal();show(Number(link.dataset.galleryOpen)||0);
});
