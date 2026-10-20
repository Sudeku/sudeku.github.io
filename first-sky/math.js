export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const mix=(a,b,t)=>a+(b-a)*t;
export const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
export const hash=n=>{const v=Math.sin(n*73.113+41.71)*43758.5453;return v-Math.floor(v);};
export const ISLANDS=[{x:0,z:1,rx:18,rz:27,depth:31,seed:7},{x:22,z:-49,rx:16,rz:20,depth:36,seed:29},{x:-9,z:-97,rx:20,rz:23,depth:43,seed:52}];
export const NODES=[[0,23],[0,12],[0,-7],[2,-20],[9,-31],[17,-39],[22,-49],[19,-61],[8,-72],[-3,-82],[-9,-96],[-9,-108]];
export const BRIDGES=[{a:[2,-20],b:[17,-39],width:4.2},{a:[19,-61],b:[-3,-82],width:4.4}];
export const STATIONS=[{name:'Порог',at:0},{name:'Сад',at:.45},{name:'Маяк',at:.84}];
export const edge=(a,s)=>1+Math.sin(a*5+s)*.055+Math.sin(a*9+s*.31)*.028+Math.sin(a*17+s)*.014;
export function routeDistance(x,z){let best=Infinity;for(let i=1;i<NODES.length;i++){const a=NODES[i-1],b=NODES[i],dx=b[0]-a[0],dz=b[1]-a[1],t=clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz));best=Math.min(best,Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz));}return best;}
export function groundHeight(x,z){return .06+Math.sin(x*.17)*Math.cos(z*.13)*.38*smooth(3,8,routeDistance(x,z));}
export function isWalkable(x,z){if(ISLANDS.some(d=>Math.hypot((x-d.x)/d.rx,(z-d.z)/d.rz)<.94))return true;return BRIDGES.some(d=>{const dx=d.b[0]-d.a[0],dz=d.b[1]-d.a[1],t=clamp(((x-d.a[0])*dx+(z-d.a[1])*dz)/(dx*dx+dz*dz));return Math.hypot(x-d.a[0]-dx*t,z-d.a[1]-dz*t)<d.width*.45;});}
export function slideMove(x,z,dx,dz){if(isWalkable(x+dx,z+dz))return{x:x+dx,z:z+dz};if(isWalkable(x+dx,z))return{x:x+dx,z};if(isWalkable(x,z+dz))return{x,z:z+dz};return{x,z};}
export function leafPoint(t,s){const w=Math.pow(Math.sin(t*Math.PI),.7)*.42;return[s*w,t*2.5,Math.sin(t*Math.PI)*.28+t*t*.45+s*s*.12];}
