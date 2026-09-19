import { initAnalytics } from './analytics.mjs';
import { initJourney } from './navigation.mjs';
import { initAtmosphere } from './atmosphere.mjs';
import { initMedia } from './media.mjs';

initAnalytics();
initJourney();
initAtmosphere();
initMedia();
document.querySelectorAll('.media-shell img,.portrait img').forEach(img=>{
  const fail=()=>{img.parentElement.classList.add('media-failed'); const note=img.parentElement.querySelector('.media-error,.portrait-error'); if(note)note.hidden=false;};
  img.addEventListener('error',fail);
  if(img.complete&&!img.naturalWidth)fail();
});
