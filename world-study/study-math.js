/* Shared deterministic terrain and transition rules, also exercised without WebGL. */
(function(scope){
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const islands=[{x:0,z:2,r:15,y:0},{x:0,z:-31,r:11,y:1.4},{x:-21,z:-56,r:12,y:2.6}];
 function segment(x,z,a,b){const dx=b.x-a.x,dz=b.z-a.z,t=clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz),0,1);return {distance:Math.hypot(x-a.x-dx*t,z-a.z-dz*t),t};}
 function ground(world,x,z){if(world==='sky'){for(const i of islands){const d=Math.hypot(x-i.x,z-i.z);if(d<i.r-.3)return i.y+Math.sin(x*.23)*Math.sin(z*.2)*.08;}for(let k=0;k<2;k++){const a=islands[k],b=islands[k+1],s=segment(x,z,a,b);if(s.distance<1.75)return a.y+(b.y-a.y)*s.t+.08;}return null;}if(world==='meadow')return Math.sin(x*.065)*.65+Math.sin(z*.056)*.45+Math.sin((x+z)*.13)*.12;if(world==='forest')return Math.sin(z*.07)*.23+Math.sin(x*.12)*.11;return 0;}
 function exit(world,x,z){return world!=='hub'&&(world==='sky'?ground(world,x,z)===null:Math.hypot(x,z)>78);}
 const api={clamp,islands,segment,ground,exit};scope.StudyMath=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
