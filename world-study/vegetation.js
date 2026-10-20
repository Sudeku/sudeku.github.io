/* Original procedural vegetation for the independent Elsewhere study. */
(() => {
  'use strict';
  const PI = Math.PI, TAU = PI * 2;
  const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
  const hash = n => { const v = Math.sin(n * 73.114 + 19.7) * 43575.678; return v - Math.floor(v); };
  const mix = (a, b, t) => a + (b - a) * t;

  function build(T, scene, keep, math, { mobile = false } = {}, forest = false) {
    const group = new T.Group(); group.name = forest ? 'Original forest vegetation' : 'Original meadow vegetation'; scene.add(group);
    const ground = (x, z) => math.ground(forest ? 'forest' : 'meadow', x, z) || 0;
    const own = value => keep(value), dummy = new T.Object3D(), color = new T.Color();
    const uniforms = { time: { value: 0 }, player: { value: new T.Vector3(0, 1.7, 16) }, day: { value: 1 } };
    const animated = [], naturalMaterials = [];
    let disposed = false;
    const material = (tint, extra = {}) => {
      const mat = own(new T.MeshStandardMaterial({ color: tint, roughness: .96, metalness: 0, ...extra })); naturalMaterials.push(mat); return mat;
    };
    function wind(mat, type = 'grass') {
      mat.onBeforeCompile = shader => {
        shader.uniforms.plantTime = uniforms.time; shader.uniforms.plantPlayer = uniforms.player; shader.uniforms.plantDay = uniforms.day;
        shader.vertexShader = 'uniform float plantTime,plantDay;uniform vec3 plantPlayer;varying float plantHeight;\n' + shader.vertexShader;
        const displacement = type === 'grass'
          ? 'float tall=clamp(position.y,0.,1.2);float sway=sin(origin.x*.34+origin.z*.22+plantTime*1.42)+.38*sin(origin.z*.71-plantTime*.84);transformed.x+=sway*.15*tall*tall;transformed.z+=cos(origin.x*.45-plantTime*.9)*.055*tall*tall;float near=1.-smoothstep(.2,2.1,distance(origin.xz,plantPlayer.xz));vec2 away=normalize(origin.xz-plantPlayer.xz+vec2(.001));transformed.xz+=away*near*.48*pow(tall,1.5);transformed.y-=near*.18*tall;'
          : type === 'flower'
            ? 'float tall=clamp(position.y,0.,1.);float sway=sin(origin.x*.31+origin.z*.2+plantTime*1.2);transformed.x+=sway*.055*tall*tall;transformed.z+=sin(plantTime*.7+origin.z)*.025*tall;'
            : 'float sway=sin(plantTime*1.05+origin.x*.42+origin.z*.25);transformed.x+=sway*.035*position.y;transformed.z+=cos(plantTime*.8+origin.z*.4)*.016*position.y;';
        shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvec3 origin=vec3(instanceMatrix[3]);plantHeight=position.y;' + displacement);
        shader.fragmentShader = 'varying float plantHeight;\n' + shader.fragmentShader;
        if (type === 'grass') shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb*=.73+.27*smoothstep(0.,.6,plantHeight);');
      };
      mat.customProgramCacheKey = () => 'study-plant-v41-' + type;
    }
    function geometry(positions, indices, uv = null, colors = null) {
      const g = own(new T.BufferGeometry()); g.setAttribute('position', new T.Float32BufferAttribute(positions, 3)); if (indices) g.setIndex(indices); if (uv) g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); if (colors) g.setAttribute('color', new T.Float32BufferAttribute(colors, 3)); g.computeVertexNormals(); g.computeBoundingSphere(); return g;
    }
    function instances(g, m, count, name) { const mesh = own(new T.InstancedMesh(g, m, count)); mesh.name = name; mesh.castShadow = false; mesh.receiveShadow = false; mesh.frustumCulled = false; group.add(mesh); return mesh; }
    function commit(mesh) { mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; }
    function set(mesh, index, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0) { dummy.position.set(x, y, z); dummy.rotation.set(rx, ry, rz); dummy.scale.set(sx, sy, sz); dummy.updateMatrix(); mesh.setMatrixAt(index, dummy.matrix); }

    // Tapered, curved blades with actual segmented surfaces rather than cards.
    const bladePositions = [], bladeIndices = [], bladeUV = [], bladeCount = forest ? 2 : 3, bladeRows = forest ? 3 : 4;
    for (let blade = 0; blade < bladeCount; blade++) {
      const base = bladePositions.length / 3, angle = blade * PI / bladeCount + .22;
      for (let row = 0; row <= bladeRows; row++) {
        const t = row / bladeRows, width = Math.max(.001, Math.sin((1 - t) * PI * .62) * .027), bend = t * t * (.17 + blade * .045);
        for (const side of [-1, 1]) { const across = side * width; bladePositions.push(Math.cos(angle) * across + Math.sin(angle) * bend, t * .84, Math.sin(angle) * across + Math.cos(angle) * bend); bladeUV.push((side + 1) / 2, t); }
        if (row < bladeRows) { const n = base + row * 2; bladeIndices.push(n, n + 1, n + 2, n + 1, n + 3, n + 2); }
      }
    }
    let bladeGeo = geometry(bladePositions, bladeIndices, bladeUV); const grassMat = material(forest ? '#b3bca6' : '#d1ddaf', { side: T.DoubleSide });
    // Dense fine blades share a locally painted alpha atlas. The segmented
    // surfaces still bend in 3D; no photograph or flat ground-panorama is used.
    if(typeof document!=='undefined'){
      const image=document.createElement('canvas');image.width=256;image.height=256;const ctx=image.getContext('2d');
      if(ctx?.bezierCurveTo){ctx.clearRect(0,0,256,256);for(let i=0;i<34;i++){const bx=35+hash(i+931)*186,by=260,tx=bx+(hash(i+111)-.5)*105,ty=8+hash(i+242)*126,w=1.5+hash(i+545)*3.2;const gradient=ctx.createLinearGradient(0,256,0,ty);gradient.addColorStop(0,'#6b7853');gradient.addColorStop(.5,'#cbd6a5');gradient.addColorStop(1,'#f1ecc9');ctx.fillStyle=gradient;ctx.beginPath();ctx.moveTo(bx-w,by);ctx.bezierCurveTo(bx-w,185,tx-18,ty+35,tx,ty);ctx.bezierCurveTo(tx-5,ty+45,bx+w+8,196,bx+w,by);ctx.closePath();ctx.fill();}const atlas=own(new T.CanvasTexture(image));atlas.colorSpace=T.SRGBColorSpace;atlas.anisotropy=4;grassMat.map=atlas;grassMat.alphaTest=.42;grassMat.alphaToCoverage=true;
       const p=[],ix=[],uv=[];for(let q=0;q<3;q++){const a=q*PI/3,base=p.length/3;for(let row=0;row<=3;row++){const t=row/3;for(const s of[-1,1]){p.push(Math.cos(a)*s*.30+Math.sin(a)*t*t*.11,t*.76,Math.sin(a)*s*.30+Math.cos(a)*t*t*.11);uv.push((s+1)/2,t);}if(row<3){const n=base+row*2;ix.push(n,n+1,n+2,n+1,n+3,n+2);}}}bladeGeo=geometry(p,ix,uv);}
    }
    wind(grassMat);
    const grassCount = forest ? (mobile ? 4000 : 9000) : (mobile ? 11000 : 24000), grass = instances(bladeGeo, grassMat, grassCount, 'Wind and player-responsive grass');
    for (let i = 0; i < grassCount; i++) {
      const dense = i < grassCount * .75, radius = Math.sqrt(hash(i + 91)) * (dense ? 43 : 77), a = hash(i + 44) * TAU;
      let x = Math.cos(a) * radius, z = Math.sin(a) * radius - (forest ? 14 : 2);
      if (forest && z < 14 && z > -75 && Math.abs(x - Math.sin((12 - z) / 2.2 * .3) * 1.6) < 2.1) x += x < 0 ? -2.4 : 2.4;
      const scale = forest ? .25 + hash(i + 17) * .55 : .48 + hash(i + 17) * .78;
      set(grass, i, x, ground(x, z), z, .72 + hash(i + 28) * .6, scale, .85, 0, hash(i + 72) * TAU);
      color.setHSL((forest ? .245 : .235) + hash(i + 15) * .055, .25 + hash(i + 38) * .16, (forest ? .19 : .26) + hash(i + 53) * .16); grass.setColorAt(i, color);
    }
    commit(grass);

    // Curved petals form a small cup. Seven radial surfaces make a volumetric
    // corolla; central pollen, stem and a lower leaf have separate geometry.
    const petals = [], petalIndices = [], petalUV = [], petalCount = 7, rows = 4, columns = 2;
    for (let n = 0; n < petalCount; n++) {
      const a = n / petalCount * TAU, sa = Math.sin(a), ca = Math.cos(a), base = petals.length / 3;
      for (let row = 0; row <= rows; row++) {
        const u = row / rows, r = .035 + u * .225, width = Math.max(.003, Math.sin(u * PI) * .084);
        for (let col = 0; col <= columns; col++) {
          const v = col / columns * 2 - 1, across = v * width, y = .63 + Math.sin(u * PI) * .08 - u * u * .038 - v * v * .025;
          petals.push(sa * r + ca * across, y, ca * r - sa * across); petalUV.push(u, col / columns);
          if (row < rows && col < columns) { const k = base + row * (columns + 1) + col; petalIndices.push(k, k + 1, k + columns + 1, k + 1, k + columns + 2, k + columns + 1); }
        }
      }
    }
    const petalGeo = geometry(petals, petalIndices, petalUV), petalMat = material('#ffffff', { side: T.DoubleSide }); wind(petalMat, 'flower');
    const flowerCount = forest ? (mobile ? 170 : 390) : (mobile ? 950 : 1900), blossoms = instances(petalGeo, petalMat, flowerCount, 'Curved flower corollas');
    const stemGeo = own(new T.CylinderGeometry(.006, .011, .62, 5, 2)); stemGeo.translate(0, .31, 0);
    const stemMat = material('#6a814e'); wind(stemMat, 'flower'); const stems = instances(stemGeo, stemMat, flowerCount, 'Flower stems');
    const centerGeo = own(new T.IcosahedronGeometry(.041, 1)); centerGeo.translate(0, .636, 0); const centerMat = material('#c9a35e'); wind(centerMat, 'flower'); const centers = instances(centerGeo, centerMat, flowerCount, 'Pollen centres');
    const patches = forest ? [[-4.7, 7, 2.5], [4.8, -9, 3], [-5.2, -28, 3.1], [5, -50, 3.4], [-8, -64, 4]] : [[-7, 10, 4.6], [8, 8, 4.5], [-10, -6, 5.7], [10, -14, 5.9], [-16, -26, 6.6], [19, -32, 6.8], [-29, 15, 9], [27, 21, 8.4], [-28, -50, 8.5], [30, -55, 8.7]];
    const flowerColors = forest ? ['#b6b4d6', '#a4a8c8', '#cfbfda', '#d8cbd5'] : ['#e6d4c2', '#d7b8ca', '#bfadd8', '#d9d3aa', '#ba97bc', '#d1cae1', '#e3c8c8', '#d1b5ce'];
    for (let i = 0; i < flowerCount; i++) {
      const patch = patches[i % patches.length], r = Math.sqrt(hash(i + 62)) * patch[2], a = hash(i + 41) * TAU;
      let x = patch[0] + Math.cos(a) * r, z = patch[1] + Math.sin(a) * r;
      if (forest && Math.abs(x) < 3.2) x += x < 0 ? -2 : 2;
      if (!forest && Math.abs(x) < 2.2 && Math.abs(z + 40) < 4) x += x < 0 ? -3 : 3;
      const s = (forest ? .54 : .75) + hash(i + 10) * .7, sy = s * (.78 + hash(i + 81) * .44), ry = hash(i + 27) * TAU, rz = (hash(i + 18) - .5) * .15;
      for (const mesh of [blossoms, stems, centers]) set(mesh, i, x, ground(x, z), z, s, sy, s, 0, ry, rz);
      color.set(flowerColors[i % flowerColors.length]); color.offsetHSL((hash(i + 29) - .5) * .02, 0, (hash(i + 11) - .5) * .08); blossoms.setColorAt(i, color);
    }
    commit(blossoms); commit(stems); commit(centers);

    // A smooth, slightly cupped leaf has a raised midrib and a tapered tip.
    const leafPositions = [], leafIndices = [], leafUV = [];
    for (let row = 0; row <= 6; row++) for (let col = 0; col <= 2; col++) {
      const t = row / 6, s = col - 1, width = Math.max(.002, Math.sin(t * PI) * .16);
      leafPositions.push(s * width, t * .76 - .33, .047 * (1 - s * s) * Math.sin(t * PI) + t * t * .11); leafUV.push(col / 2, t);
      if (row < 6 && col < 2) { const k = row * 3 + col; leafIndices.push(k, k + 1, k + 3, k + 1, k + 4, k + 3); }
    }
    const leafGeo = geometry(leafPositions, leafIndices, leafUV), leafMat = material('#c1cfae', { side: T.DoubleSide }); wind(leafMat, 'leaf');
    const sites = [];
    if (forest) {
      const count = mobile ? 23 : 38;
      for (let i = 0; i < count; i++) { const side = i % 2 ? -1 : 1, x = side * (6 + hash(i + 22) * 35), z = 13 - Math.floor(i / 2) * 4.6 + (hash(i + 83) - .5) * 3.5; sites.push([x, z, 11 + hash(i + 41) * 9]); }
    } else {
      sites.push([-12, 3, 6.5], [14, -9, 7.1], [-19, -22, 7.8], [22, -31, 7.6], [-32, 15, 8.6], [34, 21, 8.1], [-45, -9, 8.5], [44, -24, 9.1], [-23, -51, 8.8], [30, -61, 8.3], [-52, -48, 10], [51, -56, 9.4], [-47, 49, 9.6], [45, 53, 9.4]);
    }
    const leavesPerTree = forest ? (mobile ? 330 : 620) : (mobile ? 410 : 820), leaves = instances(leafGeo, leafMat, sites.length * leavesPerTree, 'Individual curved tree leaves');
    const barkPositions = [], barkIndices = [], barkUV = [], barkColors = [];
    function tube(points, r0, r1, branch, salt) {
      const curve = new T.CatmullRomCurve3(points), steps = branch ? 7 : 14, radial = branch ? 6 : 9, frames = curve.computeFrenetFrames(steps, false), base = barkPositions.length / 3, vertex = new T.Vector3();
      for (let row = 0; row <= steps; row++) {
        const t = row / steps, center = curve.getPointAt(t), radius = mix(r0, r1, t) * (1 + Math.sin(t * PI * 3 + salt) * .04);
        for (let col = 0; col <= radial; col++) {
          const a = col / radial * TAU, ridge = 1 + Math.sin(a * 6 + salt) * .07;
          vertex.copy(center).addScaledVector(frames.normals[row], Math.cos(a) * radius * ridge).addScaledVector(frames.binormals[row], Math.sin(a) * radius * ridge); barkPositions.push(vertex.x, vertex.y, vertex.z); barkUV.push(col / radial, t * (branch ? 3 : 8));
          color.setHSL(.09 + hash(salt + col) * .035, .11 + hash(col + 31) * .06, .22 + hash(row + col + salt) * .08); barkColors.push(color.r, color.g, color.b);
          if (row < steps && col < radial) { const k = base + row * (radial + 1) + col; barkIndices.push(k, k + radial + 1, k + 1, k + 1, k + radial + 1, k + radial + 2); }
        }
      }
    }
    let leafIndex = 0;
    sites.forEach(([x, z, height], tree) => {
      const base = ground(x, z), leanX = (hash(tree + 102) - .5) * .8, leanZ = (hash(tree + 103) - .5) * .7;
      tube([new T.Vector3(x, base, z), new T.Vector3(x + leanX * .3, base + height * .43, z - .12), new T.Vector3(x + leanX, base + height * .92, z + leanZ)], forest ? .40 + hash(tree) * .17 : .25, forest ? .11 : .08, false, tree + 200);
      const endpoints = [], branches = forest ? 8 : 7;
      for (let b = 0; b < branches; b++) {
        const a = b / branches * TAU + hash(tree + b + 20) * .6, reach = (forest ? 2.6 : 1.8) + hash(tree * 29 + b) * (forest ? 1.9 : 1.15);
        const startY = base + height * (.57 + hash(b + tree + 9) * .18), endY = base + height * (.80 + hash(b + tree * 23 + 55) * .16);
        const from = new T.Vector3(x + leanX * .55, startY, z), to = new T.Vector3(x + Math.cos(a) * reach + leanX, endY, z + Math.sin(a) * reach + leanZ), mid = from.clone().lerp(to, .58); mid.y += .3;
        tube([from, mid, to], forest ? .12 : .085, .024, true, tree * 19 + b); endpoints.push(to);
      }
      for (let j = 0; j < leavesPerTree; j++) {
        const endpoint = endpoints[j % endpoints.length], theta = hash(j + tree * 71) * TAU, radius = Math.sqrt(hash(j + tree * 59 + 52)) * (forest ? 1.45 : 1.14), sy = (forest ? 1.05 : .77) + hash(j + 18) * .5;
        const lx = endpoint.x + Math.cos(theta) * radius, lz = endpoint.z + Math.sin(theta) * radius, ly = endpoint.y + .34 + (hash(j + tree * 31 + 77) - .5) * (forest ? 2.0 : 1.45) - radius * .14;
        set(leaves, leafIndex, lx, ly, lz, sy, sy * (.8 + hash(j + 84) * .5), sy, (hash(j + 16) - .5) * 2, hash(j + 61) * TAU, (hash(j + 32) - .5) * 1.9);
        color.setHSL((forest ? .255 : .245) + hash(j + tree * 99) * .05, .25 + hash(j + 92) * .19, (forest ? .23 : .29) + hash(j + 26) * .18); leaves.setColorAt(leafIndex++, color);
      }
    });
    commit(leaves);
    const barkGeo = geometry(barkPositions, barkIndices, barkUV, barkColors), barkMat = material('#d0c4b4', { vertexColors: true });
    barkMat.onBeforeCompile = shader => {
      shader.fragmentShader = 'varying vec2 barkUv;\n' + shader.fragmentShader;
      shader.vertexShader = 'varying vec2 barkUv;\n' + shader.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\nbarkUv=uv;');
      shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\nfloat ridges=.88+.12*sin(barkUv.x*90.+sin(barkUv.y*8.)*1.5);diffuseColor.rgb*=ridges;');
    };
    barkMat.customProgramCacheKey = () => 'study-bark-v41'; const bark = new T.Mesh(barkGeo, barkMat); bark.name = 'Merged natural trunks and branches'; group.add(bark);

    if (forest) {
      // A fern has ten tapered leaflet pairs along each of six curved fronds.
      const fernPos = [], fernIndices = [], fernUV = [];
      for (let frond = 0; frond < 6; frond++) {
        const a = frond / 6 * TAU, sa = Math.sin(a), ca = Math.cos(a);
        for (let node = 1; node <= 9; node++) for (const side of [-1, 1]) {
          const t = node / 10, along = t * .95, y = Math.sin(t * PI * .7) * .72, width = Math.sin(t * PI) * .22, base = fernPos.length / 3;
          const points = [[0, -.045], [width * .72, .012], [width, .12], [width * .42, .105], [0, .02]];
          for (const [out, advance] of points) { const r = along + advance, transverse = out * side; fernPos.push(sa * r + ca * transverse, y + out * .14 - advance * .1, ca * r - sa * transverse); fernUV.push(out / .25, t); }
          fernIndices.push(base, base + 1, base + 4, base + 1, base + 2, base + 3, base + 1, base + 3, base + 4);
        }
      }
      const fernGeo = geometry(fernPos, fernIndices, fernUV), fernMat = material('#b0c29e', { side: T.DoubleSide }); wind(fernMat, 'leaf'); const fernCount = mobile ? 180 : 420, ferns = instances(fernGeo, fernMat, fernCount, 'Curved fern fronds');
      for (let i = 0; i < fernCount; i++) { const side = i % 2 ? -1 : 1, x = side * (3.7 + hash(i + 32) * 25), z = 14 - hash(i + 77) * 91, size = .68 + hash(i + 44) * .95; set(ferns, i, x, ground(x, z), z, size, size, size, 0, hash(i + 83) * TAU); color.setHSL(.255 + hash(i + 17) * .05, .28 + hash(i + 28) * .17, .18 + hash(i + 38) * .11); ferns.setColorAt(i, color); }
      commit(ferns);
    }

    // One instanced flock. Wingbeats and circular flight happen entirely in
    // the vertex shader, so reduced-motion time freezes the whole flock.
    const birdPos = [0,.04,.34, -.065,0,-.18, .065,0,-.18, 0,-.04,.34, .065,0,-.18, -.065,0,-.18,
      -.025,0,.13, -.43,.04,-.05, -.67,.02,-.28, -.025,0,.13, -.67,.02,-.28, -.10,0,-.23,
      .025,0,.13, .67,.02,-.28, .43,.04,-.05, .025,0,.13, .10,0,-.23, .67,.02,-.28];
    const birdGeo = geometry(birdPos), birdsCount = mobile ? 6 : (forest ? 9 : 13); birdGeo.setAttribute('aBirdPhase', new T.InstancedBufferAttribute(Float32Array.from({ length: birdsCount }, (_, i) => hash(i + 22) * TAU), 1));
    const birdMat = material('#454c4b', { side: T.DoubleSide });
    birdMat.onBeforeCompile = shader => { shader.uniforms.plantTime = uniforms.time; shader.vertexShader = 'uniform float plantTime;attribute float aBirdPhase;\n' + shader.vertexShader; shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nfloat phase=plantTime*.14+aBirdPhase;transformed.y+=pow(abs(position.x),.8)*sin(plantTime*4.4+aBirdPhase)*.48;float ca=cos(-phase),sa=sin(-phase);transformed.xz=mat2(ca,-sa,sa,ca)*transformed.xz;transformed+=vec3(sin(phase)*15.,sin(phase*2.1)*1.8,cos(phase)*13.);'); };
    birdMat.customProgramCacheKey = () => 'study-birds-v41'; const birds = instances(birdGeo, birdMat, birdsCount, 'Original instanced bird flock');
    for (let i = 0; i < birdsCount; i++) { const size = .65 + hash(i + 14) * .55; set(birds, i, (hash(i + 77) - .5) * 40, (forest ? 20 : 13) + hash(i + 32) * 8, -15 - hash(i + 41) * 45, size, size, size); } commit(birds);

    // Curved drifting petals, not billboard squares or pre-rendered sprites.
    const driftGeo = own(leafGeo.clone()), driftCount = mobile ? 45 : 110;
    driftGeo.setAttribute('aDriftPhase', new T.InstancedBufferAttribute(Float32Array.from({ length: driftCount }, (_, i) => hash(i + 291) * TAU), 1));
    const driftMat = material(forest ? '#b6c7a0' : '#d4b5ca', { side: T.DoubleSide });
    driftMat.onBeforeCompile = shader => { shader.uniforms.plantTime = uniforms.time; shader.vertexShader = 'uniform float plantTime;attribute float aDriftPhase;\n' + shader.vertexShader; shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nfloat a=plantTime*.34+aDriftPhase;transformed.x+=sin(a)*3.7;transformed.y+=sin(a*.71)*3.2;transformed.z+=cos(a*.8)*3.2;transformed.x+=sin(a*2.)*position.y*.5;'); };
    driftMat.customProgramCacheKey = () => 'study-petals-v41'; const drifting = instances(driftGeo, driftMat, driftCount, 'Drifting curved petals');
    for (let i = 0; i < driftCount; i++) { const x = (hash(i + 84) - .5) * 56, z = (hash(i + 53) - .5) * 90, y = ground(x, z) + 2 + hash(i + 23) * 3, size = .15 + hash(i + 58) * .22; set(drifting, i, x, y, z, size, size, size, hash(i + 15) * 2, hash(i + 82) * TAU, hash(i + 74) * 2); } commit(drifting);

    const flyCount = mobile ? 170 : 450, flyPos = new Float32Array(flyCount * 3), flyPhase = new Float32Array(flyCount);
    for (let i = 0; i < flyCount; i++) { const x = (hash(i + 621) - .5) * 63, z = 10 - hash(i + 331) * 88; flyPos.set([x, ground(x, z) + .45 + hash(i + 731) * 2.8, z], i * 3); flyPhase[i] = hash(i + 146) * TAU; }
    const flyGeo = own(new T.BufferGeometry()); flyGeo.setAttribute('position', new T.BufferAttribute(flyPos, 3)); flyGeo.setAttribute('phase', new T.BufferAttribute(flyPhase, 1));
    const flyMat = own(new T.ShaderMaterial({ transparent: true, depthWrite: false, blending: T.AdditiveBlending, uniforms: { time: uniforms.time, day: uniforms.day }, vertexShader: 'uniform float time;attribute float phase;varying float alpha;void main(){vec3 p=position;p.x+=sin(time*.27+phase)*.35;p.y+=sin(time*.53+phase)*.2;p.z+=cos(time*.22+phase)*.3;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(58./max(1.,-mv.z),1.,7.);alpha=(.3+.7*pow(sin(time*.8+phase),2.))*exp(-max(0.,-mv.z)*.025);}', fragmentShader: 'uniform float day;varying float alpha;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;float night=pow(1.-day,1.8);gl_FragColor=vec4(.76,.85,.46,exp(-d*d*24.)*alpha*night*.8);}' }));
    const fireflies = new T.Points(flyGeo, flyMat); fireflies.frustumCulled = false; fireflies.name = 'Day-responsive fireflies'; group.add(fireflies);
    const leafDay = new T.Color('#c1cfae'), leafNight = new T.Color('#7c95a1'), grassDay = new T.Color(forest ? '#b3bca6' : '#d1ddaf'), grassNight = new T.Color('#7b8d99');
    const metrics = { world: forest ? 'forest' : 'meadow', grass: grassCount, flowers: flowerCount, trees: sites.length, leaves: leafIndex, birds: birdsCount, fernCount: forest ? (mobile ? 180 : 420) : 0 };
    group.userData.vegetation = metrics;
    return {
      metrics,
      update(time, player, day = 1) {
        if (disposed) return;
        uniforms.time.value = Number.isFinite(time) ? time : 0; const p = player?.position || player || {}; uniforms.player.value.set(Number.isFinite(p.x) ? p.x : 0, Number.isFinite(p.y) ? p.y : 1.7, Number.isFinite(p.z) ? p.z : 0); uniforms.day.value = clamp(Number.isFinite(day) ? day : 1);
        const d = uniforms.day.value; leafMat.color.copy(leafNight).lerp(leafDay, d); grassMat.color.copy(grassNight).lerp(grassDay, d); driftMat.color.set(forest ? '#b6c7a0' : '#d4b5ca').multiplyScalar(.56 + .44 * d); petalMat.color.setRGB(.56 + d * .44, .57 + d * .43, .64 + d * .36);
      },
      dispose() { if (disposed) return; disposed = true; group.removeFromParent(); }
    };
  }

  window.StudyVegetation = {
    meadow(T, scene, keep, math, options) { return build(T, scene, keep, math, options, false); },
    forest(T, scene, keep, math, options) { return build(T, scene, keep, math, options, true); }
  };
})();
