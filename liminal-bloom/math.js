export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const mix=(a,b,t)=>a+(b-a)*t;
export const ease=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
export const hash=n=>{const x=Math.sin(n*73.113+41.71)*43758.5453;return x-Math.floor(x);};
export const SEEDS=[{x:-9,y:2.3,z:0,route:.17},{x:12,y:3.2,z:-22,route:.49},{x:-2,y:2.7,z:-45,route:.84}];
export function petalPoint(t,s,layer=0){const width=Math.pow(Math.sin(Math.PI*t),.72)*(.84-layer*.06)+.014;return [s*width,t*6.4,.65*Math.sin(t*Math.PI)+t*t*.25+(.13*s*s)*Math.sin(t*Math.PI)];}
export function petalPose(layer,index,count,openness,time=0){const angle=index/count*Math.PI*2+layer*.24;return {angle,radius:1.05+layer*.39,tilt:.08+openness*(.82+layer*.14)+Math.sin(time*.35+index*.3)*.012,scale:1-layer*.1};}
export function safePosition(x,z){const radius=Math.hypot(x,z+19),limit=66;if(radius>limit){const f=limit/radius;return {x:x*f,z:-19+(z+19)*f};}return {x,z};}
