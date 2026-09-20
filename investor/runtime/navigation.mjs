import { track } from './analytics.mjs';
import { deriveRobotState } from './robot-state.mjs?v=8b0fd15b274d';
import { RobotRenderer } from './robot-renderer.mjs';

export function initJourney() {
  const chapters = [...document.querySelectorAll('[data-chapter]')];
  if (!chapters.length) return;
  const nav = document.querySelector('[data-journey-nav]');
  const links = [...document.querySelectorAll('[data-chapter-link]')];
  const progressBar = document.querySelector('[data-progress]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 760px)');
  const robot = new RobotRenderer(document.querySelector('[data-robot]'));
  const hero = document.querySelector('#hero');
  const reached = new Set();
  let section = 'hero', scheduled = false, ctaActive = false;
  const currentChapter = () => {
    let active = chapters[0];
    const threshold = innerHeight * .32;
    for (const chapter of chapters) if (chapter.getBoundingClientRect().top <= threshold) active = chapter;
    return active;
  };
  const paint = (reason = 'scroll', target) => {
    const chapter = target || currentChapter();
    section = chapter.id;
    nav.classList.toggle('is-visible', section !== 'hero');
    // Hidden navigation is also out of the keyboard and accessibility trees.
    nav.inert = section === 'hero';
    links.forEach(link => {
      const active = link.dataset.chapterLink === section || (section === 'final' && link.dataset.chapterLink === 'round');
      if (active) link.setAttribute('aria-current','location'); else link.removeAttribute('aria-current');
    });
    progressBar.style.transform = `scaleX(${Math.min(1,Math.max(0,scrollY / Math.max(1,document.documentElement.scrollHeight-innerHeight)))})`;
    const heroRect=hero.getBoundingClientRect();
    const heroProgress=Math.max(0,Math.min(1,-heroRect.top/(heroRect.height*.85)));
    robot.render(deriveRobotState({section,progress:heroProgress,event:reason,mobile:mobile.matches,reducedMotion:reduced.matches,ctaActive,width:innerWidth,height:heroRect.height}));
    if (!reached.has(section)) { reached.add(section); track('journey_section_reach',{chapter:section}); }
  };
  const jump = (id, reason = 'navigation-jump', focus = false) => {
    id = ({top:'hero',studio:'bog',proof:'bog',crew:'team',route:'roadmap',investors:'round',contact:'final'})[id] || id;
    const chapter = document.getElementById(id);
    if (!chapter || !chapter.hasAttribute('data-chapter')) return;
    const top = chapter.getBoundingClientRect().top + scrollY - (id === 'hero' ? 0 : mobile.matches ? 106 : 78);
    // Direct jumps synchronise immediately. Never replay intervening choreography.
    window.scrollTo({top:Math.max(0,top),behavior:'instant'});
    paint(reason,chapter);
    if(focus) chapter.focus({preventScroll:true});
  };
  document.documentElement.classList.add('journey-enhanced');
  document.addEventListener('click',event=>{
    const link=event.target.closest('a[href^="#"]');
    if(!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const id=link.hash.slice(1);
    if(!chapters.some(c=>c.id===id)) return;
    event.preventDefault();
    history.pushState({chapter:id},'',`#${id}`);
    jump(id,'navigation-jump',true);
  });
  document.querySelectorAll('[data-booking]').forEach(a=>{
    const react=value=>{ctaActive=value;paint('cta');};
    a.addEventListener('pointerenter',()=>react(true)); a.addEventListener('pointerleave',()=>react(false));
    a.addEventListener('focus',()=>react(true)); a.addEventListener('blur',()=>react(false));
  });
  document.addEventListener('click',event=>{
    const link=event.target.closest('[data-deep-open]');
    if(!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    // Store an anchor in this history entry, so browser Back has deterministic context.
    history.replaceState({chapter:section},'',`#${section}`);
  });
  const schedule=()=>{if(!scheduled){scheduled=true;requestAnimationFrame(()=>{paint();scheduled=false;});}};
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',()=>paint('resize'));
  reduced.addEventListener('change',()=>paint('preference'));
  mobile.addEventListener('change',()=>paint('viewport'));
  addEventListener('popstate',()=>jump(location.hash.slice(1)||'hero','history'));
  addEventListener('hashchange',()=>jump(location.hash.slice(1)||'hero','deep-return'));
  addEventListener('pageshow',()=>{if(location.hash)jump(location.hash.slice(1),'deep-return');else paint('entry');});
  if(location.hash)jump(location.hash.slice(1),'deep-return');else paint('entry');
}
