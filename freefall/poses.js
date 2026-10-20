export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const mix=(a,b,t)=>a+(b-a)*t;
export const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
export const hash=n=>{const v=Math.sin(n*73.113+41.71)*43758.5453;return v-Math.floor(v);};
export const STOPS=[0,.16,.33,.5,.67,.84,1];
export const CHAPTERS=['Притяжение','Сквозь кольца','Двойная спираль','Излом','Течение','Раскрытие','Бесконечность'];
export const CAPTIONS=['Всё начинается с притяжения.','Пространство пропускает тебя внутрь.','У гравитации есть другая сторона.','Архитектура, которая забыла правила.','Металл становится течением.','Свету больше нечего скрывать.','Конца здесь не будет.'];
export const CENTERS=[0,-35,-84,-142,-192,-237,-278];
export const CAMERAS=[[9,3,19],[.3,.2,-18],[-.8,.5,-61],[0,0,-122],[3,1,-172],[.5,.6,-217],[0,.4,-255]];
export const LOOKS=[[0,0,0],[-.4,0,-47],[.8,0,-97],[0,0,-149],[0,0,-199],[0,0,-238],[0,0,-279]];
export const ROLLS=[-.13,.3,-.65,1.3,2.85,5.9,Math.PI*2];
export const PALETTES=[['#080c15','#203548','#a6e7ef'],['#080b1b','#131b3c','#99aaff'],['#140c1d','#422037','#f0bfc8'],['#0b1017','#1d3440','#b4e2db'],['#140e20','#382746','#c7a8f1'],['#251d17','#826847','#ffe5b0'],['#080d12','#192d34','#a1e2d9']];
export function segment(p){p=clamp(p);let a=0;while(a<STOPS.length-2&&p>STOPS[a+1])a++;return{a,b:a+1,t:smooth(STOPS[a],STOPS[a+1],p)};}
export function chapterAt(p){let best=0,d=Infinity;for(let i=0;i<STOPS.length;i++){const q=Math.abs(p-STOPS[i]);if(q<d){d=q;best=i;}}return best;}
export function mengerCells(){const cells=[];for(let x=-4;x<=4;x++)for(let y=-4;y<=4;y++)for(let z=-4;z<=4;z++){let valid=true;for(const scale of[1,3]){const middle=[x+4,y+4,z+4].filter(v=>Math.floor(v/scale)%3===1).length;if(middle>=2){valid=false;break;}}if(valid)cells.push([x,y,z]);}return cells;}
const cells=mengerCells();
export function targetPose(mode,i,count){const u=(i+.5)/count,a=i*2.3999632297,h=hash(i+19);let p,n,s,twist=0;
 if(mode===0){const y=1-2*u,r=Math.sqrt(Math.max(0,1-y*y)),theta=a+.15*Math.sin(u*20),radius=5.1+.18*Math.sin(theta*3+y*8);n=[Math.cos(theta)*r,y,Math.sin(theta)*r];p=n.map(v=>v*radius);s=[.30+h*.13,.66+hash(i+4)*.55,.18];twist=.22*Math.sin(a*.07);}
 else if(mode===1){const cols=25,ring=Math.floor(i/cols),theta=(i%cols)/cols*Math.PI*2+ring*.17,z=-4-ring*3.4,r=5.5+Math.sin(ring*.4)*.65;n=[Math.cos(theta),Math.sin(theta),0];p=[n[0]*r+Math.sin(z*.035)*1.2,n[1]*r,z];s=[.55,1.15,.16];twist=ring*.06;}
 else if(mode===2){const strand=i%2,v=Math.floor(i/2)/(count/2),theta=v*Math.PI*9+strand*Math.PI,r=5.8+Math.sin(v*Math.PI*3)*.6;n=[Math.cos(theta),Math.sin(theta),.1];p=[n[0]*r,n[1]*r,-52-v*76];s=[.25,1.42,.15];twist=theta*.1+.4;}
 else if(mode===3){const j=i%cells.length,batch=Math.floor(i/cells.length),c=cells[j],scale=batch?1.6:2.2;n=[0,0,1];p=[c[0]*scale,c[1]*scale,-145+c[2]*scale-batch*26];s=[scale*.79,scale*.79,scale*.79];twist=Math.PI/2*(i%4);}
 else if(mode===4){const strand=i%5,v=Math.floor(i/5)/(count/5),theta=v*Math.PI*3+(strand-2)*.55,r=5.6+Math.sin(v*Math.PI*2+strand)*1.3;n=[Math.cos(theta),Math.sin(theta),.55];p=[n[0]*r,n[1]*r,-164-v*58];s=[1.5,.35,.13];twist=theta*.6+strand*.25;}
 else if(mode===5){const blades=16,blade=i%blades,v=Math.floor(i/blades)/(count/blades),theta=blade/blades*Math.PI*2+v*.85,r=1.7+v*10.8;n=[Math.cos(theta)*.2,Math.sin(theta)*.2,1];p=[Math.cos(theta)*r,Math.sin(theta)*r,-239+Math.sin(v*Math.PI)*4.5];s=[.5+v*.8,.5+v*.7,.16];twist=theta+Math.PI/4;}
 else{const along=i%200,v=along/200*Math.PI*2,row=Math.floor(i/200),den=1+Math.cos(v)**2,x=9*Math.sin(v)/den,y=9*Math.sin(v)*Math.cos(v)/den,theta=v+row*Math.PI*.5,r=.44+(row%2)*.03;n=[Math.cos(theta),Math.sin(theta),1];p=[x+Math.cos(theta)*r,y+Math.sin(theta)*r,-279+Math.cos(v)*.65+Math.sin(theta)*.48];s=[.37,.52,.13];twist=-v*.5;}
 const length=Math.hypot(...n);return{p,n:n.map(v=>v/length),s,twist};
}
export function springStep(offset,velocity,dt){dt=Math.min(.04,Math.max(0,dt));for(let i=0;i<3;i++){velocity[i]=(velocity[i]-offset[i]*12*dt)*Math.exp(-4.8*dt);offset[i]+=velocity[i]*dt;}const length=Math.hypot(...offset);if(length>5)for(let i=0;i<3;i++)offset[i]*=5/length;return{offset,velocity};}
