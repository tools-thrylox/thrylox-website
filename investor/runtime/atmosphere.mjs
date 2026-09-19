import { waterfalls } from './scene.mjs';

// One textured plane, no scene engine or dependency. Only the water and mist move.
// If a context/image fails, the HTML image underneath is already the complete scene.
const vertex=`attribute vec2 position; varying vec2 uv; void main(){uv=vec2((position.x+1.)*.5,(1.-position.y)*.5);gl_Position=vec4(position,0.,1.);}`;
const fragment=`precision mediump float;
uniform sampler2D scene; uniform float time; uniform vec2 cropScale; uniform vec2 cropOffset;
uniform vec4 falls[4]; varying vec2 uv;
float softEllipse(vec2 p,vec2 c,vec2 r){return 1.-smoothstep(.2,1.,length((p-c)/r));}
void main(){
 vec2 p=uv*cropScale+cropOffset;
 vec3 base=texture2D(scene,p).rgb;
 float water=0.;
 for(int i=0;i<4;i++){
  vec4 f=falls[i]; float down=clamp((p.y-f.y)/(f.z-f.y),0.,1.);
  float centre=f.x-down*f.w*.38; float width=f.w*(.65+down*.55);
  float mask=(1.-smoothstep(width*.5,width,abs(p.x-centre)))*smoothstep(f.y,f.y+.025,p.y)*(1.-smoothstep(f.z-.07,f.z,p.y));
  water=max(water,mask);
 }
 water*=smoothstep(.26,.58,dot(base,vec3(.299,.587,.114)));
 float phase=fract(time*.22), other=fract(phase+.5), blend=abs(phase*2.-1.);
 float ripple=sin(p.y*180.-time*5.+sin(p.x*430.)*2.)*.0012;
 vec3 flowA=texture2D(scene,p+vec2(ripple,-phase*.055)).rgb;
 vec3 flowB=texture2D(scene,p+vec2(ripple,-other*.055)).rgb;
 vec3 flow=mix(flowA,flowB,blend);
 float foam=pow(max(0.,sin(p.y*260.-time*13.+sin(p.x*900.)*3.)),7.)*.055;
 vec3 colour=mix(base,flow+vec3(foam),water*.82);
 float mist=softEllipse(p,vec2(.715,.815),vec2(.22,.115))+softEllipse(p,vec2(.565,.47),vec2(.09,.05))*.35;
 vec2 drift=vec2(sin(p.y*33.+time*.17),cos(p.x*24.-time*.13))*.004;
 colour=mix(colour,texture2D(scene,p+drift).rgb,clamp(mist,0.,1.)*.55);
 gl_FragColor=vec4(colour,1.);
}`;

export async function initAtmosphere() {
 const canvas=document.querySelector('[data-hero-water]');if(!canvas)return;
 const hero=document.querySelector('#hero'), source=hero.querySelector('.hero-background img'), pause=document.querySelector('[data-scene-pause]');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let gl,program,raf=0,visible=true,manuallyPaused=false,ready=false,lastFrame=0,elapsed=0;
 const stop=()=>{cancelAnimationFrame(raf);raf=0;lastFrame=0;canvas.dataset.running='false';};
 const fallback=()=>{ready=false;stop();canvas.style.opacity='0';canvas.dataset.state='fallback';pause.hidden=true;hero.classList.add('scene-paused');};
 try{
  await source.decode();
  if(!source.naturalWidth)throw new Error('No scene');
  gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false,powerPreference:'low-power'});
  if(!gl)throw new Error('No rendering context');
  const shader=(type,code)=>{const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error('Shader unavailable');return s;};
  program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Scene unavailable');gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,source);
  gl.uniform4fv(gl.getUniformLocation(program,'falls[0]'),new Float32Array(waterfalls.flat()));
  const timeUniform=gl.getUniformLocation(program,'time');
  const resize=()=>{
   const r=hero.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.25),scale=Math.max(r.width/source.naturalWidth,r.height/source.naturalHeight),rw=source.naturalWidth*scale,rh=source.naturalHeight*scale;
   canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);gl.viewport(0,0,canvas.width,canvas.height);
   // Same object-fit: cover / object-position: 65% center as the static image.
   gl.uniform2f(gl.getUniformLocation(program,'cropScale'),r.width/rw,r.height/rh);
   gl.uniform2f(gl.getUniformLocation(program,'cropOffset'),(rw-r.width)*.65/rw,(rh-r.height)*.5/rh);
   gl.uniform1f(timeUniform,elapsed);gl.drawArrays(gl.TRIANGLES,0,6);
  };
  const draw=now=>{
   raf=0;
   if(!visible||document.hidden||reduced.matches||manuallyPaused)return;
   if(!lastFrame)lastFrame=now;
   if(now-lastFrame>=1000/30){elapsed+=Math.min(now-lastFrame,60)/1000;lastFrame=now;gl.uniform1f(timeUniform,elapsed);gl.drawArrays(gl.TRIANGLES,0,6);canvas.dataset.frame=String(Math.round(elapsed*30));}
   raf=requestAnimationFrame(draw);
  };
  const sync=()=>{
   if(!ready){fallback();return;}
   stop();
   canvas.style.opacity=reduced.matches?'0':'1';
   canvas.dataset.state=reduced.matches?'reduced':'ready';pause.hidden=reduced.matches;
   if(ready&&visible&&!document.hidden&&!reduced.matches&&!manuallyPaused){canvas.dataset.running='true';raf=requestAnimationFrame(draw);}
  };
  resize();gl.uniform1f(timeUniform,0);gl.drawArrays(gl.TRIANGLES,0,6);ready=true;sync();
  new ResizeObserver(resize).observe(hero);
  // Stop before the last header-sized strip disappears behind the sticky navigation.
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync();},{rootMargin:'-110px 0px 0px 0px'}).observe(hero);
  pause.addEventListener('click',()=>{manuallyPaused=!manuallyPaused;pause.setAttribute('aria-pressed',String(manuallyPaused));pause.textContent=manuallyPaused?'Resume motion':'Pause motion';hero.classList.toggle('scene-paused',manuallyPaused);sync();});
  reduced.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();fallback();});
 }catch{fallback();}
}
