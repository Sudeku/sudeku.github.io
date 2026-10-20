/* Sudeki: a breathing, light-filled relic. Original procedural geometry. */
window.SUDEKI_SKY_BEACON={create(T,scene,own,host){
 const group=new T.Group();group.position.set(-20,0,-67);scene.add(group);
 const mat=(options)=>own(new T.MeshStandardMaterial(options));
 const shellMat=mat({color:'#878395',metalness:.48,roughness:.4,emissive:'#8980a4',emissiveIntensity:.04});
 const edgeMat=mat({color:'#b4b1c8',metalness:.85,roughness:.27});
 const baseMat=mat({color:'#292936',metalness:.4,roughness:.72});
 const lightMat=own(new T.MeshBasicMaterial({color:'#e7ecff',toneMapped:false}));
 const add=(geo,material,parent=group)=>{const m=new T.Mesh(own(geo),material);parent.add(m);m.receiveShadow=true;return m;};
 const disc=(r,h,y,m)=>{const d=add(new T.CylinderGeometry(r,r,h,96),m);d.position.y=y;return d;};
 disc(2.3,.17,.12,baseMat);disc(1.93,.055,.235,edgeMat);disc(1.87,.08,.30,baseMat);
 for(const r of[1.6,2.12]){const ring=add(new T.TorusGeometry(r,.008,5,100),lightMat);ring.rotation.x=Math.PI/2;ring.position.y=.323;}
 const core=add(new T.SphereGeometry(.79,40,28),lightMat);core.position.y=2.75;core.scale.y=1.27;
 const spine=add(new T.CylinderGeometry(.018,.018,3.65,8),lightMat);spine.position.y=2.75;
 // Soft light is rendered in the scene with depth testing. No full-screen blur.
 const haloMat=own(new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.FrontSide,uniforms:{intensity:{value:.18}},vertexShader:'varying vec3 n,v;void main(){vec4 p=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',fragmentShader:'varying vec3 n,v;uniform float intensity;void main(){float a=pow(1.-abs(dot(normalize(n),normalize(v))),2.3)*intensity;gl_FragColor=vec4(.63,.67,1.,a);}'}));
 const halo=add(new T.SphereGeometry(1.85,32,24),haloMat);halo.position.y=2.75;halo.scale.y=1.2;
 // Curved, closed tiles follow the ellipsoid. A bevel around each rim
 // catches light without overlapping neighbouring rows.
 function tileGeometry(lat,n){const pos=[],indices=[],steps=8,stride=steps+1,center=new T.Vector3(0,1.77*Math.sin(lat),1.43*Math.cos(lat));
  for(let layer=0;layer<2;layer++)for(let v=0;v<=steps;v++)for(let u=0;u<=steps;u++){const pitch=lat+(v/steps-.5)*.312,angle=(u/steps-.5)*Math.PI*2/n*.88,normal=new T.Vector3(Math.sin(angle)*Math.cos(pitch),Math.sin(pitch)*.8,Math.cos(angle)*Math.cos(pitch)).normalize(),rim=Math.max(Math.abs(u/steps*2-1),Math.abs(v/steps*2-1)),bevel=.028*T.MathUtils.smoothstep(rim,.65,1),depth=layer?-.17+bevel:-bevel,p=new T.Vector3(Math.sin(angle)*1.43*Math.cos(pitch),1.77*Math.sin(pitch),Math.cos(angle)*1.43*Math.cos(pitch)).addScaledVector(normal,depth).sub(center);pos.push(p.x,p.y,p.z);}
  const side=stride*stride;for(let v=0;v<steps;v++)for(let u=0;u<steps;u++){const a=v*stride+u,b=a+stride;indices.push(a,a+1,b,a+1,b+1,b,a+side,b+side,a+1+side,a+1+side,b+side,b+1+side);}
  const border=[];for(let u=0;u<=steps;u++)border.push(u);for(let v=1;v<=steps;v++)border.push(v*stride+steps);for(let u=steps-1;u>=0;u--)border.push(steps*stride+u);for(let v=steps-1;v>0;v--)border.push(v*stride);
  for(let i=0;i<border.length;i++){const a=border[i],b=border[(i+1)%border.length];indices.push(a,b+side,b,a,a+side,b+side);}
  const g=own(new T.BufferGeometry());g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(indices);g.computeVertexNormals();return g;
 }
 const records=[],shell=new T.Group(),rows=[];group.add(shell);const dummy=new T.Object3D(),color=new T.Color();
 for(let row=0;row<8;row++){
  const lat=-1.24+row*2.48/7,n=Math.max(6,Math.round(Math.cos(lat)*16)),radius=1.43*Math.cos(lat),y=2.75+1.77*Math.sin(lat),batch=new T.InstancedMesh(tileGeometry(lat,n),shellMat,n);batch.instanceMatrix.setUsage(T.DynamicDrawUsage);batch.frustumCulled=false;batch.castShadow=false;shell.add(batch);rows.push(batch);
  for(let col=0;col<n;col++){const angle=(col+(row%2)*.5)/n*Math.PI*2,normal=new T.Vector3(Math.sin(angle)*Math.cos(lat),Math.sin(lat)*.8,Math.cos(angle)*Math.cos(lat)).normalize(),base=new T.Vector3(Math.sin(angle)*radius,y,Math.cos(angle)*radius);records.push({batch,index:col,base,normal,q:new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),angle),offset:0,velocity:0,phase:row*.43+col*.14});color.setHSL(.66,.07,.49+(col%5)*.014);batch.setColorAt(col,color);}
 }
 const faceLight=new T.SpotLight('#d9d8ed',26,15,.8,.7,1.2);faceLight.position.set(-1.5,5,7);faceLight.target.position.set(0,2.7,0);group.add(faceLight,faceLight.target);
 const light=new T.PointLight('#dddfff',16,14,1.8);light.position.set(0,2.75,0);group.add(light);
 const count=100,pos=new Float32Array(count*3);for(let i=0;i<count;i++){const a=i*2.39996,r=1.8+(i%13)/13*.9;pos.set([Math.cos(a)*r,.5+(i%29)/29*4.4,Math.sin(a)*r],i*3);}
 const dustGeo=own(new T.BufferGeometry());dustGeo.setAttribute('position',new T.BufferAttribute(pos,3));const dustMat=own(new T.PointsMaterial({color:'#cbd1ff',size:.018,transparent:true,opacity:.45,depthWrite:false,blending:T.AdditiveBlending})),dust=new T.Points(dustGeo,dustMat);group.add(dust);
 let activity=0,kicks=0,max=0,opening=0;
 function react(ray,strength=1){group.updateMatrixWorld(true);rows.forEach(row=>row.computeBoundingSphere());const hit=ray.intersectObjects([shell,core],true)[0];if(!hit)return false;const point=group.worldToLocal(hit.point.clone());let changed=false;records.forEach(d=>{const dist=d.base.distanceTo(point);if(dist<1.45){d.velocity=Math.min(3,d.velocity+strength*(1-dist/1.45)*2.2);changed=true;}});if(changed){kicks++;activity=Math.min(1,activity+.2);}return changed;}
 function update(dt,time,awake,reduced){
  const step=Math.min(dt,.035);opening+=(Number(awake)*.28-opening)*(1-Math.exp(-step*2.5));activity*=Math.exp(-step*1.7);max=0;
  records.forEach((d,i)=>{if(reduced){d.offset=0;d.velocity=0;}else{d.velocity+=-19*d.offset*step;d.velocity*=Math.exp(-6*step);d.offset=T.MathUtils.clamp(d.offset+d.velocity*step,0,.9);}
   const breath=reduced?0:(.5+.5*Math.sin(time*.85+d.phase*.17))*.052,spread=opening+breath+d.offset;
   dummy.position.copy(d.base).addScaledVector(d.normal,spread);dummy.quaternion.copy(d.q);dummy.rotateY((opening+d.offset)*Math.sin(d.phase)*.42);dummy.scale.setScalar(1);dummy.updateMatrix();d.batch.setMatrixAt(d.index,dummy.matrix);max=Math.max(max,d.offset);
  });rows.forEach(row=>row.instanceMatrix.needsUpdate=true);
  const beat=reduced?0:.5+.5*Math.sin(time*.85);light.intensity=14+beat*2+opening*20+activity*8;core.scale.setScalar(1+beat*.017);core.scale.y*=1.27;haloMat.uniforms.intensity.value=.018+opening*.04+activity*.012;dust.rotation.y=time*.025;dustMat.opacity=.25+opening*.8;
  host.dataset.beacon='breathing-shell';host.dataset.beaconParts=String(records.length);host.dataset.beaconResponse=String(kicks);host.dataset.beaconDisplacement=max.toFixed(3);host.dataset.beaconOpening=opening.toFixed(3);
 }
 return{group,shell,core,records,react,update,get displacement(){return max;}};
}};
