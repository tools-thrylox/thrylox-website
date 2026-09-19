const clamp = x => Math.min(1,Math.max(0,x));
export function deriveRobotState({section='hero',progress=0,mobile=false,reducedMotion=false,event='scroll',ctaActive=false,width=1440,height=900}) {
  // Coordinates are hero-local. Scroll controls a reversible flight into this scene.
  const p=clamp(progress), depth=p*p*(3-2*p);
  const size=mobile?178:Math.min(390,width*.28);
  const startX=mobile?width-size-6:width*.72;
  const startY=mobile?height-220:height*.30;
  return {
    section,progress:p,event,mobile,reducedMotion,size,
    x:startX+(reducedMotion?0:depth*(mobile?-18:-width*.09)),
    y:startY+(reducedMotion?0:depth*(mobile?-height*.11:height*.17)),
    scale:reducedMotion?1:1-depth*.76,
    opacity:reducedMotion?1:1-clamp((p-.58)/.32),
    rotation:reducedMotion?0:-7+depth*17,
    face:ctaActive?'wink':p>.18?'curious':'smile',instant:true
  };
}
