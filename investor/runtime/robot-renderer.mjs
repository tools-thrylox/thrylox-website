export class RobotRenderer {
  constructor(element) {
    this.element=element;
    const body=element.querySelector('.robot-body');
    const fail=()=>element.classList.add('asset-failed');
    body.addEventListener('error',fail);
    if(body.complete&&!body.naturalWidth)fail();
  }
  render(state) {
    const el=this.element;
    el.dataset.section=state.section;
    el.dataset.face=state.face;
    el.dataset.motion=state.reducedMotion?'reduced':'normal';
    el.dataset.event=state.event;
    for(const [property,value] of Object.entries({x:`${state.x}px`,y:`${state.y}px`,size:`${state.size}px`,angle:`${state.rotation}deg`,scale:state.scale,opacity:state.opacity}))el.style.setProperty(`--robot-${property}`,value);
  }
}
