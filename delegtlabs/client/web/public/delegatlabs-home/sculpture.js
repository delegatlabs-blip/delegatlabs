// Each pose brings a different part of the continuous handoff into view.
(() => {
  "use strict";
  const canvas = document.getElementById("handoff-plot");
  const stage = canvas.closest(".art-stage");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const poses = [
    [-.48, .40, .24, .269],
    [-.19, .62, .08, .602],
    [.13, -.38, -.19, .936]
  ];
  let inView = false;
  let renderer = null;
  let attempted = false;
  let waiting = false;
  const available = () => inView && !document.hidden && !reduced.matches && !navigator.connection?.saveData;

  function prepareRenderer() {
    const gl = canvas.getContext("webgl",{alpha:true,antialias:true,powerPreference:"low-power"});
    if (!gl) return null;
    const vertexSource = `
attribute vec3 position, normal;
attribute vec2 surface;
uniform vec3 rotation;
uniform vec2 scale;
varying vec3 surfaceNormal, cameraPosition;
varying vec2 uv;

vec3 rotate(vec3 p) {
  vec3 c = cos(rotation), s = sin(rotation);
  p = vec3(p.x, c.x*p.y - s.x*p.z, s.x*p.y + c.x*p.z);
  p = vec3(c.y*p.x + s.y*p.z, p.y, -s.y*p.x + c.y*p.z);
  return vec3(c.z*p.x - s.z*p.y, s.z*p.x + c.z*p.y, p.z);
}
void main() {
  surfaceNormal = rotate(normal);
  cameraPosition = rotate(position);
  uv = surface;
  float perspective = 6.8 / (6.8 - cameraPosition.z);
  gl_Position = vec4(cameraPosition.xy * scale * perspective, -cameraPosition.z * .2, 1.);
}
`;
    const fragmentSource = `
precision highp float;
varying vec3 surfaceNormal, cameraPosition;
varying vec2 uv;
uniform float bandPosition, night;

float softbox(vec3 ray, vec3 axis, float width, float softness) {
  return smoothstep(width-softness,width+softness,dot(ray,normalize(axis)));
}
void main() {
  vec3 n = normalize(surfaceNormal);
  vec3 view = normalize(vec3(0.,0.,6.8)-cameraPosition);
  vec3 r = reflect(-view,n);
  float horizon = smoothstep(.03,.32,r.y+.23*r.x);
  vec3 alloy = mix(vec3(.30,.31,.32),vec3(.82,.82,.80),horizon);
  alloy = mix(alloy,vec3(.13,.15,.16),.92*softbox(r,vec3(-.56,-.25,.72),.48,.13));
  alloy = mix(alloy,vec3(.91,.89,.84),.94*softbox(r,vec3(.12,-.9,.5),.68,.12));
  alloy = mix(alloy,vec3(.98,.975,.94),.97*softbox(r,vec3(-.78,.48,1.),.83,.10));
  alloy = mix(alloy,vec3(.32,.32,.33),.73*softbox(r,vec3(.78,.5,-.3),.77,.15));
  alloy += .12*exp(-pow((r.x-.40*r.y-.56)*10.,2.));
  float rim = pow(1.-max(0.,dot(n,view)),2.25);
  alloy = alloy*(1.-.16*night) + rim*(.055+.10*night);
  vec3 copper = vec3(.51,.22,.105) + alloy*vec3(.56,.44,.37);
  float distanceToBand = abs(fract(uv.x-bandPosition+.5)-.5);
  float band = 1.-smoothstep(.077,.079,distanceToBand);
  vec3 finish = mix(alloy,copper,band);
  gl_FragColor = vec4(clamp(finish*uv.y,0.,1.),1.);
}
`;
    function compile(kind,source) {
      const shader = gl.createShader(kind);
      gl.shaderSource(shader,source);
      gl.compileShader(shader);
      if (gl.getShaderParameter(shader,gl.COMPILE_STATUS)) return shader;
      gl.deleteShader(shader);
      return null;
    }
    const vertex = compile(gl.VERTEX_SHADER,vertexSource);
    const fragment = compile(gl.FRAGMENT_SHADER,fragmentSource);
    if (!vertex || !fragment) return null;
    const program = gl.createProgram();
    gl.attachShader(program,vertex);
    gl.attachShader(program,fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program,gl.LINK_STATUS)) return null;
    gl.useProgram(program);

    const segments = 216, sides = 36, tau = Math.PI*2;
    function center(t) {
      const radius = .96+.49*Math.cos(3*t);
      return [radius*Math.cos(2*t), radius*Math.sin(2*t), .54*Math.sin(3*t)];
    }
    const centers = Array.from({length:segments},(_,i) => center(tau*i/segments));
    const circle = Array.from({length:sides+1},(_,i) => [Math.cos(tau*i/sides),Math.sin(tau*i/sides)]);
    const vertices = new Float32Array((segments+1)*(sides+1)*8);
    const indices = new Uint16Array(segments*sides*6);
    const unit = a => {
      const length = Math.hypot(...a);
      return a.map(x => x/length);
    };
    const cross = (a,b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
    let vi = 0, ei = 0;
    for (let i=0; i<=segments; i++) {
      const t = tau*i/segments;
      const p = centers[i%segments], next = center(t+.0001), last = center(t-.0001);
      const tangent = unit(next.map((v,k) => v-last[k]));
      const u = unit(cross(tangent,[0,0,1])), v = cross(tangent,u);
      const nearby = centers.filter((other,j) => {
        const d = Math.abs(i-j);
        return j%4===0 && Math.min(d,segments-d)>segments*.12 &&
          Math.hypot(other[0]-p[0],other[1]-p[1],other[2]-p[2]) < 1.65;
      });
      for (let j=0; j<=sides; j++) {
        const [c,s] = circle[j];
        const nx=u[0]*c+v[0]*s, ny=u[1]*c+v[1]*s, nz=u[2]*c+v[2]*s;
        const x=p[0]+.275*nx, y=p[1]+.275*ny, z=p[2]+.275*nz;
        let occlusion = 0;
        for (const other of nearby) {
          const dx=other[0]-x, dy=other[1]-y, dz=other[2]-z;
          const distance = Math.sqrt(dx*dx+dy*dy+dz*dz);
          const facing = (nx*dx+ny*dy+nz*dz)/distance;
          occlusion = Math.max(occlusion,facing*Math.exp(-2.4*Math.max(0,distance-.29)));
        }
        vertices.set([x,y,z,nx,ny,nz,i/segments,1-.36*occlusion],vi);
        vi+=8;
        if (i<segments && j<sides) {
          const a=i*(sides+1)+j, b=a+sides+1;
          indices.set([a,b,a+1,b,b+1,a+1],ei);
          ei+=6;
        }
      }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW);
    for (const [name,size,offset] of [["position",3,0],["normal",3,12],["surface",2,24]]) {
      const location = gl.getAttribLocation(program,name);
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location,size,gl.FLOAT,false,32,offset);
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0,0,0,0);
    const rotation = gl.getUniformLocation(program,"rotation");
    const scale = gl.getUniformLocation(program,"scale");
    const band = gl.getUniformLocation(program,"bandPosition");
    const night = gl.getUniformLocation(program,"night");
    let current = [...poses[Number(stage.dataset.pose)]], frame = 0;
    function stop() { cancelAnimationFrame(frame); frame = 0; }
    function draw() {
      if (!available() || gl.isContextLost()) return;
      const ratio = Math.min(devicePixelRatio,2);
      const w=Math.round(canvas.clientWidth*ratio), h=Math.round(canvas.clientHeight*ratio);
      if (!w || !h) return;
      if (canvas.width!==w || canvas.height!==h) { canvas.width=w; canvas.height=h; }
      gl.viewport(0,0,w,h);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniform3f(rotation,current[0],current[1],current[2]);
      gl.uniform2f(scale,.57*h/w,.57);
      gl.uniform1f(band,current[3]);
      gl.uniform1f(night,document.documentElement.dataset.theme==="dark" ? 1 : 0);
      gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
      canvas.classList.add("live");
    }
    function move(duration) {
      stop();
      const target = [...poses[Number(stage.dataset.pose)]];
      // Take the shorter path along the loop, including the seam between 1 and 0.
      target[3] -= Math.round(target[3]-current[3]);
      if (!duration || !available()) { current=target; draw(); return; }
      const from = [...current], start = performance.now();
      function advance(now) {
        const t = Math.min(1,Math.max(0,(now-start)/duration));
        const k = 1-(1-t)**3;
        current = from.map((value,i) => value+(target[i]-value)*k);
        draw();
        frame = t<1 && available() ? requestAnimationFrame(advance) : 0;
      }
      frame=requestAnimationFrame(advance);
    }
    current[1]-=.17;
    current[2]-=.07;
    draw();
    move(480);
    return {draw,move,stop};
  }

  function refresh() {
    if (!available()) {
      renderer?.stop();
      if (reduced.matches || navigator.connection?.saveData) canvas.classList.remove("live");
      return;
    }
    if (renderer) { renderer.move(0); return; }
    if (attempted || waiting) return;
    waiting = true;
    function start() {
      waiting = false;
      if (!available()) return;
      attempted = true;
      renderer = prepareRenderer();
    }
    if (window.requestIdleCallback) requestIdleCallback(start,{timeout:380});
    else setTimeout(start,0);
  }
  if (window.IntersectionObserver) {
    new IntersectionObserver(([entry]) => { inView=entry.isIntersecting; refresh(); }).observe(stage);
  } else {
    inView=true;
    refresh();
  }
  canvas.addEventListener("handoff",() => renderer?.move(195));
  document.addEventListener("appearancechange",() => renderer?.draw());
  document.addEventListener("visibilitychange",refresh);
  reduced.addEventListener("change",refresh);
  navigator.connection?.addEventListener("change",refresh);
  if (window.ResizeObserver) new ResizeObserver(() => renderer?.draw()).observe(stage);
  else window.addEventListener("resize",() => renderer?.draw());
  canvas.addEventListener("webglcontextlost", event => {
    event.preventDefault();
    renderer?.stop();
    renderer=null;
    canvas.classList.remove("live");
  });
  canvas.addEventListener("webglcontextrestored",() => { attempted=false; refresh(); });
})();
