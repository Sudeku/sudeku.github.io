/* Sudeki: a breathing, light-filled relic. Original procedural geometry. */
window.SUDEKI_SKY_BEACON={create(T,scene,own,host,options={}){
 const R=1.5,H=1.5,CY=2.5;
 const group=new T.Group();group.position.set(-20,0,-67);scene.add(group);
 const mat=(options)=>own(new T.MeshStandardMaterial(options));
 const grainSize=128,grainData=new Uint8Array(grainSize*grainSize*4);for(let y=0;y<grainSize;y++)for(let x=0;x<grainSize;x++){const n=Math.sin(x*91.17+y*37.73)*43758.54,value=Math.round(132+(n-Math.floor(n)-.5)*34+Math.sin(y*3.17)*2),i=(y*grainSize+x)*4;grainData[i]=grainData[i+1]=grainData[i+2]=value;grainData[i+3]=255;}const grain=own(new T.DataTexture(grainData,grainSize,grainSize,T.RGBAFormat));grain.wrapS=grain.wrapT=T.RepeatWrapping;grain.repeat.set(3,1.5);grain.generateMipmaps=true;grain.minFilter=T.LinearMipmapLinearFilter;grain.magFilter=T.LinearFilter;grain.needsUpdate=true;
 const shellMat=mat({color:'#9b9da8',metalness:.84,roughness:.72,roughnessMap:grain,bumpMap:grain,bumpScale:.0025,envMapIntensity:1.1,emissive:'#6a6389',emissiveIntensity:.025});
 if(options.renderer&&typeof document!=='undefined'){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const c=canvas.getContext('2d');c.fillStyle='#12131c';c.fillRect(0,0,512,256);for(const [x,y,w,h,alpha]of[[52,35,75,120,1],[310,45,42,150,.7],[0,152,512,20,.22]]){const grad=c.createLinearGradient(x,0,x+w,0);grad.addColorStop(0,'rgba(230,232,255,0)');grad.addColorStop(.18,'rgba(230,232,255,'+alpha+')');grad.addColorStop(.82,'rgba(230,232,255,'+alpha+')');grad.addColorStop(1,'rgba(230,232,255,0)');c.fillStyle=grad;c.fillRect(x,y,w,h);}const texture=own(new T.CanvasTexture(canvas));texture.mapping=T.EquirectangularReflectionMapping;texture.colorSpace=T.SRGBColorSpace;const pmrem=new T.PMREMGenerator(options.renderer),target=own(pmrem.fromEquirectangular(texture));shellMat.envMap=target.texture;pmrem.dispose();}
 const edgeMat=mat({color:'#b4b1c8',metalness:.85,roughness:.27});
 const baseMat=options.stoneMaterial?own(options.stoneMaterial.clone()):mat({color:'#50505c',metalness:.12,roughness:.85});baseMat.color.set('#8e8b9c');
 const lightMat=own(new T.MeshBasicMaterial({color:'#e7ecff',toneMapped:false}));
 const add=(geo,material,parent=group)=>{const m=new T.Mesh(own(geo),material);parent.add(m);m.receiveShadow=true;return m;};
 const disc=(r,h,y,m)=>{const d=add(new T.CylinderGeometry(r,r,h,96),m);d.position.y=y;return d;};
 disc(2.3,.17,.12,baseMat);disc(1.93,.055,.235,edgeMat);disc(1.87,.08,.30,baseMat);
 for(const r of[1.6,2.12]){const ring=add(new T.TorusGeometry(r,.008,5,100),lightMat);ring.rotation.x=Math.PI/2;ring.position.y=.323;}
 const core=add(new T.SphereGeometry(.79,40,28),lightMat);core.position.y=CY;core.scale.y=1.04;
 const spine=add(new T.CylinderGeometry(.018,.018,2.7,8),lightMat);spine.position.y=CY;
 // Soft light is rendered in the scene with depth testing. No full-screen blur.
 const haloMat=own(new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.FrontSide,uniforms:{intensity:{value:.18}},vertexShader:'varying vec3 n,v;void main(){vec4 p=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',fragmentShader:'varying vec3 n,v;uniform float intensity;void main(){float a=pow(1.-abs(dot(normalize(n),normalize(v))),2.3)*intensity;gl_FragColor=vec4(.63,.67,1.,a);}'}));
 const halo=add(new T.SphereGeometry(1.85,32,24),haloMat);halo.position.y=CY;halo.scale.y=1.04;
 // Curved, closed tiles follow the ellipsoid. A bevel around each rim
 // catches light without overlapping neighbouring rows.
 function tileGeometry(lat,n){const pos=[],uv=[],indices=[],steps=8,stride=steps+1,center=new T.Vector3(0,H*Math.sin(lat),R*Math.cos(lat));
  for(let layer=0;layer<2;layer++)for(let v=0;v<=steps;v++)for(let u=0;u<=steps;u++){const pitch=lat+(v/steps-.5)*.312,angle=(u/steps-.5)*Math.PI*2/n*.88,normal=new T.Vector3(Math.sin(angle)*Math.cos(pitch),Math.sin(pitch)*R/H,Math.cos(angle)*Math.cos(pitch)).normalize(),rim=Math.max(Math.abs(u/steps*2-1),Math.abs(v/steps*2-1)),bevel=.028*T.MathUtils.smoothstep(rim,.65,1),depth=layer?-.17+bevel:-bevel,p=new T.Vector3(Math.sin(angle)*R*Math.cos(pitch),H*Math.sin(pitch),Math.cos(angle)*R*Math.cos(pitch)).addScaledVector(normal,depth).sub(center);pos.push(p.x,p.y,p.z);uv.push(u/steps,v/steps);}
  const side=stride*stride;for(let v=0;v<steps;v++)for(let u=0;u<steps;u++){const a=v*stride+u,b=a+stride;indices.push(a,a+1,b,a+1,b+1,b,a+side,b+side,a+1+side,a+1+side,b+side,b+1+side);}
  const border=[];for(let u=0;u<=steps;u++)border.push(u);for(let v=1;v<=steps;v++)border.push(v*stride+steps);for(let u=steps-1;u>=0;u--)border.push(steps*stride+u);for(let v=steps-1;v>0;v--)border.push(v*stride);
  for(let i=0;i<border.length;i++){const a=border[i],b=border[(i+1)%border.length];indices.push(a,b+side,b,a,a+side,b+side);}
  const g=own(new T.BufferGeometry());g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
 }
 const records=[],shell=new T.Group(),rows=[];group.add(shell);const dummy=new T.Object3D(),color=new T.Color();
 for(let row=0;row<8;row++){
  const lat=-1.24+row*2.48/7,n=Math.max(6,Math.round(Math.cos(lat)*16)),radius=R*Math.cos(lat),y=CY+H*Math.sin(lat),batch=new T.InstancedMesh(tileGeometry(lat,n),shellMat,n);batch.instanceMatrix.setUsage(T.DynamicDrawUsage);batch.frustumCulled=false;batch.castShadow=false;shell.add(batch);rows.push(batch);
  for(let col=0;col<n;col++){const angle=(col+(row%2)*.5)/n*Math.PI*2,normal=new T.Vector3(Math.sin(angle)*Math.cos(lat),Math.sin(lat)*R/H,Math.cos(angle)*Math.cos(lat)).normalize(),base=new T.Vector3(Math.sin(angle)*radius,y,Math.cos(angle)*radius);records.push({batch,index:col,base,normal,q:new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),angle),offset:0,velocity:0,localTarget:0,startAt:0,wake:0,phase:row*.43+col*.14});color.setHSL(.65,.025,.6+(col%5)*.012);batch.setColorAt(col,color);}
 }
 const faceLight=new T.SpotLight('#e4e3ec',19,15,.8,.7,1.2);faceLight.position.set(-1.5,5,7);faceLight.target.position.set(0,CY,0);group.add(faceLight,faceLight.target);
 const light=new T.PointLight('#dddfff',16,14,1.8);light.position.set(0,CY,0);group.add(light);
 const count=100,pos=new Float32Array(count*3);for(let i=0;i<count;i++){const a=i*2.39996,r=1.8+(i%13)/13*.9;pos.set([Math.cos(a)*r,.5+(i%29)/29*4.4,Math.sin(a)*r],i*3);}
 const dustGeo=own(new T.BufferGeometry());dustGeo.setAttribute('position',new T.BufferAttribute(pos,3));const dustMat=own(new T.PointsMaterial({color:'#cbd1ff',size:.018,transparent:true,opacity:.45,depthWrite:false,blending:T.AdditiveBlending})),dust=new T.Points(dustGeo,dustMat);group.add(dust);
 let activity=0,kicks=0,max=0,opening=0,clock=0,focus=null,wasAwake=false,wakeAt=0;
 const volume=new T.Sphere(),center=new T.Vector3(0,CY,0),probe=new T.Vector3();
 function clearFocus(){focus=null;records.forEach(d=>d.localTarget=0);}
 function react(ray,strength=1){group.updateMatrixWorld(true);rows.forEach(row=>row.computeBoundingSphere());const hit=ray.intersectObjects([shell,core],true)[0];let point=hit?.point?.clone();
  if(!point){const worldCenter=group.localToWorld(center.clone());volume.set(worldCenter,1.72);if(ray.ray.origin.distanceTo(worldCenter)<18&&ray.ray.intersectSphere(volume,probe))point=probe.clone();}
  if(!point){clearFocus();return false;}point=group.worldToLocal(point);const surface=new T.Vector3(point.x/R,(point.y-CY)/H,point.z/R).normalize();point.set(surface.x*R,CY+surface.y*H,surface.z*R);const changed=!focus||focus.distanceToSquared(point)>.018;
  if(changed){focus=point.clone();kicks++;records.forEach(d=>{const distance=d.base.distanceTo(point);d.localTarget=distance<1.9?Math.pow(1-distance/1.9,1.6)*.64:0;d.startAt=clock+distance*.115;});activity=Math.min(1,activity+.22);}
  if(strength>1){records.forEach(d=>{const dist=d.base.distanceTo(point);if(dist<1.6)d.velocity=Math.min(2.5,d.velocity+(1-dist/1.6)*strength*.75);});}
  return true;
 }
 function update(dt,time,awake,reduced){
  const step=Math.min(dt,.035);clock+=step;if(awake!==wasAwake){wakeAt=clock;wasAwake=awake;}opening=reduced?Number(awake)*.16:opening+(Number(awake)*.16-opening)*(1-Math.exp(-step*2));activity*=Math.exp(-step*1.7);max=0;
  records.forEach((d,i)=>{const local=clock>=d.startAt?d.localTarget:0;if(reduced){d.offset=local*.45;d.velocity=0;}else{d.velocity+=(local-d.offset)*24*step;d.velocity*=Math.exp(-7.8*step);d.offset=T.MathUtils.clamp(d.offset+d.velocity*step,0,.85);}
   const wave=awake?T.MathUtils.smoothstep(clock-wakeAt-(i/records.length)*.58,0,.65):0;d.wake+=(opening*wave-d.wake)*(reduced?1:1-Math.exp(-step*4));
   const breath=reduced?0:(.5+.5*Math.sin(time*.72+d.phase*.23))*.035,spread=d.wake+breath+d.offset;
   dummy.position.copy(d.base).addScaledVector(d.normal,spread);dummy.quaternion.copy(d.q);dummy.rotateY(d.offset*Math.sin(d.phase)*.34);dummy.rotateX(d.offset*Math.cos(d.phase)*.21);dummy.scale.setScalar(1);dummy.updateMatrix();d.batch.setMatrixAt(d.index,dummy.matrix);max=Math.max(max,d.offset);
  });rows.forEach(row=>row.instanceMatrix.needsUpdate=true);
  const beat=reduced?0:.5+.5*Math.sin(time*.72);light.intensity=11+beat*1.2+opening*23+max*6;core.scale.setScalar(1+beat*.012);core.scale.y*=1.04;haloMat.uniforms.intensity.value=.012+opening*.05+activity*.015;dust.rotation.y=time*.018;dustMat.opacity=.22+opening*.85;
  host.dataset.beacon='local-wave-shell';host.dataset.beaconParts=String(records.length);host.dataset.beaconResponse=String(kicks);host.dataset.beaconDisplacement=max.toFixed(3);host.dataset.beaconOpening=opening.toFixed(3);
 }
 return{group,shell,core,records,react,clearFocus,update,get displacement(){return max;}};
}};
