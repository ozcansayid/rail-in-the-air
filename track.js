// Fairy-Tale Environment, God Rays, Realistic Metropolis, Dim Cloud Sea & Viaduct Track Builder
class TrackBuilder {
  constructor(scene) {
    this.scene = scene;
    this.curve = null;
    this.totalLength = 0;
    this.railGauge = 1.3;
    
    this.gates = [];
    this.stationPositions = [0.18, 0.36, 0.54, 0.74, 0.995];
    this.branches = [];

    // Animated Clouds & Volumetric Sunbeams
    this.animatedClouds = [];
    this.dimCityClouds = [];
    this.godRays = [];
    this.fireflies = null;

    this.cloudFleetGroup = new THREE.Group();
    this.scene.add(this.cloudFleetGroup);

    // Sun position ahead on the horizon
    this.sunPosition = new THREE.Vector3(20, 125, 2500);
  }

  generatePoints() {
    return [
      // 1. Station Start (Elevation ~50)
      new THREE.Vector3(0, 50, 0),
      new THREE.Vector3(0, 50, 70),
      new THREE.Vector3(0, 50, 140),

      // 2. Smooth Drop & Speed Gain
      new THREE.Vector3(0, 48, 190),
      new THREE.Vector3(0, 35, 260),
      new THREE.Vector3(15, 30, 330),

      // 3. Gentle Right Curve & Gradual Climb
      new THREE.Vector3(45, 36, 400),
      new THREE.Vector3(80, 52, 470),
      new THREE.Vector3(95, 66, 540),

      // 4. High Skybridge Straight
      new THREE.Vector3(90, 70, 620),
      new THREE.Vector3(70, 70, 690),

      // 5. Descent into Valley
      new THREE.Vector3(40, 55, 760),
      new THREE.Vector3(15, 32, 830),
      new THREE.Vector3(0, 22, 900),

      // 6. Wide Thrill Curve
      new THREE.Vector3(-30, 25, 960),
      new THREE.Vector3(-65, 30, 1015),
      new THREE.Vector3(-75, 36, 1080),

      // 7. Counter Curve
      new THREE.Vector3(-55, 42, 1140),
      new THREE.Vector3(-15, 48, 1195),
      new THREE.Vector3(25, 52, 1245),

      // 8. Wide Scenic Loop / Arc
      new THREE.Vector3(70, 56, 1290),
      new THREE.Vector3(100, 62, 1345),
      new THREE.Vector3(105, 66, 1410),
      new THREE.Vector3(75, 68, 1465),
      new THREE.Vector3(25, 64, 1505),
      new THREE.Vector3(-25, 56, 1545),

      // 9. Floating Ridge
      new THREE.Vector3(-60, 48, 1600),
      new THREE.Vector3(-65, 44, 1665),
      new THREE.Vector3(-45, 42, 1735),

      // 10. Grand Terminal Approach
      new THREE.Vector3(-15, 44, 1800),
      new THREE.Vector3(0, 45, 1860),
      new THREE.Vector3(10, 45, 1920),
      new THREE.Vector3(10, 45, 1980),
      new THREE.Vector3(10, 45, 2030)
    ];
  }

  build() {
    const rawPoints = this.generatePoints();
    this.curve = new THREE.CatmullRomCurve3(rawPoints, false, 'catmullrom', 0.2);
    this.totalLength = this.curve.getLength();

    // 1. Fairy-Tale Sky Dome & Volumetric Sun God Rays
    this.buildFairyTaleSkyAndSunRays();

    // 2. Main Rails, Sleepers & Viaduct Pillars with Warm Lanterns
    this.buildRails();
    this.buildSleepers();
    this.buildDeepPillars();
    this.buildGrandTerminal();
    this.buildStationGates();
    this.buildExtendedBranchTracks();

    // 3. Realistic Skyscraper Metropolis & Dim Cloud Sea Below
    this.buildRealisticMetropolis();
    this.buildDimCloudSeaOverCity();
    this.loadAnimatedGLBClouds();
  }

  // FRESH, AIRY SKY DOME & GENTLE SUN RAYS (Ferah Gökyüzü ve Yumuşak Güneş Işınları)
  buildFairyTaleSkyAndSunRays() {
    // 1. Custom GLSL Sky Shader Dome with Fresh, Desaturated Airy Sky Colors
    const skyGeom = new THREE.SphereGeometry(2900, 32, 24);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uSunPos: { value: this.sunPosition.clone().normalize() },
        uTopColor: { value: new THREE.Color(0x60a5fa) },     // Fresh Airy Azure Sky Blue
        uMidColor: { value: new THREE.Color(0xbae6fd) },     // Soft Pastel Powder Blue
        uHorizonColor: { value: new THREE.Color(0xfef9c3) }, // Gentle Warm Cream Morning Horizon
        uBottomColor: { value: new THREE.Color(0xe0f2fe) }   // Soft Airy Sky Mist Below
      },
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        varying vec3 vWorldPos;
        uniform vec3 uSunPos;
        uniform vec3 uTopColor;
        uniform vec3 uMidColor;
        uniform vec3 uHorizonColor;
        uniform vec3 uBottomColor;

        void main() {
          vec3 dir = normalize(vWorldPos);
          float y = dir.y;

          // Smooth, airy vertical sky gradient
          vec3 col;
          if (y > 0.0) {
            float t1 = smoothstep(0.0, 0.25, y);
            float t2 = smoothstep(0.20, 0.80, y);
            col = mix(uHorizonColor, uMidColor, t1);
            col = mix(col, uTopColor, t2);
          } else {
            col = mix(uHorizonColor, uBottomColor, smoothstep(0.0, -0.25, y));
          }

          // Soft, Natural Sun Disc & Gentle Halo ahead
          float sunAmt = max(dot(dir, uSunPos), 0.0);
          col += vec3(1.0, 0.96, 0.82) * pow(sunAmt, 10.0) * 0.28;
          col += vec3(1.0, 0.98, 0.90) * pow(sunAmt, 95.0) * 0.85;
          col += vec3(1.0, 1.0, 0.98) * smoothstep(0.9985, 0.9998, sunAmt) * 1.4;

          gl_FragColor = vec4(col, 1.0);
        }
      `
    });
    const skyDome = new THREE.Mesh(skyGeom, skyMat);
    this.scene.add(skyDome);

    // 2. Gentle Volumetric Sunbeams / God Rays radiating from the Sun ahead
    const sunGroup = new THREE.Group();
    sunGroup.position.copy(this.sunPosition);
    this.scene.add(sunGroup);

    // Soft Sun Halo Sprite
    const haloCanvas = document.createElement('canvas');
    haloCanvas.width = 256;
    haloCanvas.height = 256;
    const hCtx = haloCanvas.getContext('2d');
    const grad = hCtx.createRadialGradient(128, 128, 8, 128, 128, 128);
    grad.addColorStop(0.0, 'rgba(255, 255, 250, 0.90)');
    grad.addColorStop(0.25, 'rgba(254, 249, 195, 0.55)');
    grad.addColorStop(0.6, 'rgba(254, 240, 138, 0.18)');
    grad.addColorStop(1.0, 'rgba(254, 240, 138, 0.0)');
    hCtx.fillStyle = grad;
    hCtx.fillRect(0, 0, 256, 256);

    const haloTex = new THREE.CanvasTexture(haloCanvas);
    const haloSprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: haloTex,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true
    }));
    haloSprite.scale.set(480, 480, 1);
    sunGroup.add(haloSprite);

    // Create 14 Delicate Volumetric God-Ray Cones
    const rayCanvas = document.createElement('canvas');
    rayCanvas.width = 64;
    rayCanvas.height = 256;
    const rCtx = rayCanvas.getContext('2d');
    const rGrad = rCtx.createLinearGradient(0, 0, 0, 256);
    rGrad.addColorStop(0.0, 'rgba(255, 253, 235, 0.28)');
    rGrad.addColorStop(0.45, 'rgba(254, 249, 195, 0.10)');
    rGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
    rCtx.fillStyle = rGrad;
    rCtx.fillRect(0, 0, 64, 256);
    const rayTex = new THREE.CanvasTexture(rayCanvas);

    const rayCount = 14;
    for (let i = 0; i < rayCount; i++) {
      const rayLen = 1900 + Math.random() * 600;
      const rayWidth = 42 + Math.random() * 50;
      const rayGeom = new THREE.ConeGeometry(rayWidth, rayLen, 12, 1, true);
      rayGeom.translate(0, -rayLen * 0.5, 0);

      const rayMat = new THREE.MeshBasicMaterial({
        map: rayTex,
        transparent: true,
        opacity: 0.14 + Math.random() * 0.10,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
        fog: false
      });

      const rayMesh = new THREE.Mesh(rayGeom, rayMat);

      const spreadX = (i / (rayCount - 1) - 0.5) * 1.15;
      const spreadY = -0.35 - Math.random() * 0.45;
      rayMesh.rotation.x = -Math.PI * 0.42 + spreadY * 0.35;
      rayMesh.rotation.z = spreadX;

      sunGroup.add(rayMesh);
      this.godRays.push({
        mesh: rayMesh,
        baseRotZ: spreadX,
        baseOpacity: rayMat.opacity,
        speed: 0.5 + Math.random() * 0.6,
        phase: i * 0.7
      });
    }
  }

  buildRails() {
    const samples = 1450;
    const railRadius = 0.14;
    const leftPoints = [];
    const rightPoints = [];
    const up = new THREE.Vector3(0, 1, 0);

    for (let i = 0; i <= samples; i++) {
      const u = i / samples;
      const pt = this.curve.getPointAt(u);
      const tangent = this.curve.getTangentAt(u).normalize();
      const right = new THREE.Vector3().crossVectors(up, tangent).normalize();

      const halfGauge = this.railGauge * 0.5;
      leftPoints.push(pt.clone().addScaledVector(right, -halfGauge));
      rightPoints.push(pt.clone().addScaledVector(right, halfGauge));
    }

    const leftCurve = new THREE.CatmullRomCurve3(leftPoints);
    const rightCurve = new THREE.CatmullRomCurve3(rightPoints);

    const railGeomL = new THREE.TubeGeometry(leftCurve, 720, railRadius, 8, false);
    const railGeomR = new THREE.TubeGeometry(rightCurve, 720, railRadius, 8, false);

    // Clean Brushed Silver-Champagne Steel Rails
    const railMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      metalness: 0.85,
      roughness: 0.22
    });

    const meshL = new THREE.Mesh(railGeomL, railMat);
    const meshR = new THREE.Mesh(railGeomR, railMat);
    meshL.castShadow = true;
    meshL.receiveShadow = true;
    meshR.castShadow = true;
    meshR.receiveShadow = true;

    this.scene.add(meshL, meshR);
  }

  buildSleepers() {
    const sleeperCount = Math.floor(this.totalLength / 1.6);
    const sleeperGeom = new THREE.BoxGeometry(this.railGauge * 1.5, 0.16, 0.48);
    // Natural Warm Cedar/Oak Timber Sleepers
    const sleeperMat = new THREE.MeshStandardMaterial({
      color: 0x78553a,
      metalness: 0.1,
      roughness: 0.8
    });

    const instancedMesh = new THREE.InstancedMesh(sleeperGeom, sleeperMat, sleeperCount);
    instancedMesh.castShadow = true;
    instancedMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    const up = new THREE.Vector3(0, 1, 0);

    for (let i = 0; i < sleeperCount; i++) {
      const u = i / sleeperCount;
      const pt = this.curve.getPointAt(u);
      const tangent = this.curve.getTangentAt(u).normalize();
      const right = new THREE.Vector3().crossVectors(up, tangent).normalize();
      const normal = new THREE.Vector3().crossVectors(tangent, right).normalize();

      dummy.position.copy(pt).addScaledVector(normal, -0.07);
      const m = new THREE.Matrix4().makeBasis(right, normal, tangent);
      dummy.rotation.setFromRotationMatrix(m);
      dummy.updateMatrix();

      instancedMesh.setMatrixAt(i, dummy.matrix);
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(instancedMesh);
  }

  // LIGHT LIMESTONE VIADUCT PILLARS & WARM STREET LANTERNS
  buildDeepPillars() {
    const pillarInterval = 38;
    const pillarCount = Math.floor(this.totalLength / pillarInterval);

    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0xd6d3d1, // Fresh light architectural limestone/travertine
      roughness: 0.78,
      metalness: 0.1
    });

    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8, // Soft pewter/slate architectural trim
      roughness: 0.4,
      metalness: 0.6
    });

    const lanternGlowMat = new THREE.MeshBasicMaterial({
      color: 0xfef9c3
    });

    const up = new THREE.Vector3(0, 1, 0);

    for (let i = 1; i < pillarCount; i++) {
      const u = (i * pillarInterval) / this.totalLength;
      if (u > 0.96) break;
      const pt = this.curve.getPointAt(u);
      const tangent = this.curve.getTangentAt(u).normalize();
      const right = new THREE.Vector3().crossVectors(up, tangent).normalize();
      const normal = new THREE.Vector3().crossVectors(tangent, right).normalize();

      const bottomY = -350;
      const pillarHeight = pt.y - bottomY;

      // Monumental tapered viaduct column
      const pillarGeom = new THREE.CylinderGeometry(1.15, 3.9, pillarHeight, 12);
      const pillar = new THREE.Mesh(pillarGeom, stoneMat);
      pillar.position.set(pt.x, pt.y - pillarHeight * 0.5 - 0.2, pt.z);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      this.scene.add(pillar);

      // Ornate Capital & Lamp Posts Group aligned with track
      const capGroup = new THREE.Group();
      capGroup.position.copy(pt);
      const m = new THREE.Matrix4().makeBasis(right, normal, tangent);
      capGroup.rotation.setFromRotationMatrix(m);

      const head = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.85, 1.6), stoneMat);
      head.position.set(0, -0.6, 0);
      capGroup.add(head);

      const goldRing = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.18, 1.75), trimMat);
      goldRing.position.set(0, -0.22, 0);
      capGroup.add(goldRing);

      // Wrought-Iron Lanterns on both sides of the viaduct
      [-1.75, 1.75].forEach(xSide => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 2.5, 8), trimMat);
        post.position.set(xSide, 1.1, 0);
        capGroup.add(post);

        const lanternGlobe = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), lanternGlowMat);
        lanternGlobe.position.set(xSide, 2.4, 0);
        capGroup.add(lanternGlobe);

        const lanternCap = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.25, 8), trimMat);
        lanternCap.position.set(xSide, 2.62, 0);
        capGroup.add(lanternCap);
      });

      this.scene.add(capGroup);
    }
  }

  // FRESH, AIRY PASTEL & ARCHITECTURAL SKYSCRAPER TEXTURES (Ferah Bina Renkleri)
  createSkyscraperTexture(styleIdx) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // 3 Fresh, Airy Architectural Facade Palettes (Pearl-Blue, Warm Limestone, Soft Sage-Slate)
    const palettes = [
      { wall: '#e2e8f0', winDark: '#94a3b8', winSky: '#bae6fd', winWarm: '#f8fafc' },
      { wall: '#f5f5f4', winDark: '#a8a29e', winSky: '#e0f2fe', winWarm: '#fef9c3' },
      { wall: '#cbd5e1', winDark: '#64748b', winSky: '#dbeafe', winWarm: '#f1f5f9' }
    ];
    const pal = palettes[styleIdx % palettes.length];

    ctx.fillStyle = pal.wall;
    ctx.fillRect(0, 0, 128, 512);

    const cols = 8;
    const rows = 40;
    const padX = 3;
    const padY = 3;
    const cellW = 128 / cols;
    const cellH = 512 / rows;

    for (let r = 0; r < rows; r++) {
      if (r % 12 === 0) continue;

      for (let c = 0; c < cols; c++) {
        const rand = Math.random();
        if (rand < 0.45) {
          ctx.fillStyle = (rand < 0.28) ? pal.winSky : pal.winWarm;
        } else {
          ctx.fillStyle = pal.winDark;
        }
        ctx.fillRect(c * cellW + padX, r * cellH + padY, cellW - padX * 2, cellH - padY * 2);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  // Helper: Sample all main and branch track points to prevent buildings from intersecting any rail
  collectAllTrackSamples() {
    const samples = [];
    const mainSteps = 450;
    for (let i = 0; i <= mainSteps; i++) {
      samples.push(this.curve.getPointAt(i / mainSteps));
    }
    this.branches.forEach(br => {
      const brSteps = 90;
      for (let i = 0; i <= brSteps; i++) {
        samples.push(br.curve.getPointAt(i / brSteps));
      }
    });
    return samples;
  }

  buildRealisticMetropolis() {
    // Collect all track coordinates so NO building ever touches or intersects the rails!
    const trackSamples = this.collectAllTrackSamples();

    // Generate 3 distinct fresh, airy architectural skyscraper textures
    const bldgTextures = [
      this.createSkyscraperTexture(0),
      this.createSkyscraperTexture(1),
      this.createSkyscraperTexture(2)
    ];

    const bldgMaterials = bldgTextures.map(tex => new THREE.MeshStandardMaterial({
      map: tex,
      emissiveMap: tex,
      emissive: new THREE.Color(0xf8fafc),
      emissiveIntensity: 0.18,
      roughness: 0.55,
      metalness: 0.2
    }));

    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.5,
      metalness: 0.4
    });

    const spireBeaconMat = new THREE.MeshBasicMaterial({ color: 0xf87171 });
    const goldRoofMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.35,
      metalness: 0.5
    });

    // Soft Airy Sky-Mist City Floor at the bottom
    const cityFloorGeom = new THREE.PlaneGeometry(2400, 3200);
    cityFloorGeom.rotateX(-Math.PI / 2);
    const cityFloorMat = new THREE.MeshBasicMaterial({
      color: 0xcbd5e1
    });
    const cityFloor = new THREE.Mesh(cityFloorGeom, cityFloorMat);
    cityFloor.position.set(0, -140, 1000);
    this.scene.add(cityFloor);

    // Build 140 Realistic Multi-Tiered Skyscrapers safely outside the track corridor
    const buildingCount = 140;
    const baseY = -140;

    for (let i = 0; i < buildingCount; i++) {
      const baseW = 16 + Math.random() * 24;
      const baseD = 16 + Math.random() * 24;
      const bldgRadius = Math.hypot(baseW, baseD) * 0.5;

      // Find a safe (xPos, zPos) position that does not intersect any main or branch rail
      let xPos = 0;
      let zPos = 0;
      let minDistXZ = 0;
      let nearestTrackY = 45;
      let foundSafeSpot = false;

      for (let attempt = 0; attempt < 30; attempt++) {
        xPos = (Math.random() - 0.5) * 980;
        zPos = Math.random() * 2350 - 80;

        minDistXZ = Infinity;
        nearestTrackY = 45;

        for (let s = 0; s < trackSamples.length; s++) {
          const pt = trackSamples[s];
          const d = Math.hypot(xPos - pt.x, zPos - pt.z);
          if (d < minDistXZ) {
            minDistXZ = d;
            nearestTrackY = pt.y;
          }
        }

        // Strict safety buffer: keep at least (bldgRadius + 28m) away from all rails & pillars!
        if (minDistXZ >= bldgRadius + 28) {
          foundSafeSpot = true;
          break;
        }
      }

      if (!foundSafeSpot) continue;

      const bldgGroup = new THREE.Group();
      const mat = bldgMaterials[i % bldgMaterials.length];

      // Determine maximum safe height so buildings near the track stay well below the rails
      let totalH = 60 + Math.random() * 135;
      const hasUpperTier = Math.random() > 0.3;
      const tierH = hasUpperTier ? (16 + Math.random() * 24) : 0;
      const hasSpire = hasUpperTier && (Math.random() > 0.4);
      const spireH = hasSpire ? (10 + Math.random() * 16) : 0;

      // If moderately near the track corridor (within 85m), cap height so top stays below rails
      if (minDistXZ < bldgRadius + 85) {
        const maxAllowedTopY = nearestTrackY - 18;
        const maxAllowedMainH = Math.max(40, maxAllowedTopY - baseY - tierH - spireH);
        totalH = Math.min(totalH, maxAllowedMainH);
      }

      // 1. Main Tower Body
      const mainGeom = new THREE.BoxGeometry(baseW, totalH, baseD);
      const mainMesh = new THREE.Mesh(mainGeom, mat);
      mainMesh.position.y = totalH * 0.5;
      bldgGroup.add(mainMesh);

      // 2. Architectural Setback / Upper Tier (Art Deco / Modern Skyscraper style)
      if (hasUpperTier) {
        const tierW = baseW * 0.72;
        const tierD = baseD * 0.72;
        const tierMesh = new THREE.Mesh(new THREE.BoxGeometry(tierW, tierH, tierD), mat);
        tierMesh.position.y = totalH + tierH * 0.5;
        bldgGroup.add(tierMesh);

        // Clean Architectural Cornice
        const crown = new THREE.Mesh(new THREE.BoxGeometry(tierW + 1.2, 1.2, tierD + 1.2), goldRoofMat);
        crown.position.y = totalH + tierH;
        bldgGroup.add(crown);

        // Spire + Soft Aviation Beacon Light
        if (hasSpire) {
          const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.8, spireH, 8), trimMat);
          spire.position.y = totalH + tierH + spireH * 0.5;
          bldgGroup.add(spire);

          const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 8), spireBeaconMat);
          beacon.position.y = totalH + tierH + spireH;
          bldgGroup.add(beacon);
        }
      }

      bldgGroup.position.set(xPos, baseY, zPos);
      this.scene.add(bldgGroup);
    }
  }

  // Create a rich, multi-lobe billowy white & sky-blue cloud texture for soft volumetric mist sprites
  createBillowyCloudTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Overlapping fluffy white and airy sky-blue puffs
    const puffs = [
      { x: 128, y: 136, r: 90, c1: 'rgba(255, 255, 255, 0.52)', c2: 'rgba(224, 242, 254, 0.22)' },
      { x: 82,  y: 142, r: 72, c1: 'rgba(240, 249, 255, 0.46)', c2: 'rgba(186, 230, 253, 0.18)' },
      { x: 174, y: 140, r: 74, c1: 'rgba(240, 249, 255, 0.46)', c2: 'rgba(186, 230, 253, 0.18)' },
      { x: 108, y: 106, r: 68, c1: 'rgba(255, 255, 255, 0.48)', c2: 'rgba(224, 242, 254, 0.16)' },
      { x: 152, y: 110, r: 64, c1: 'rgba(255, 255, 255, 0.44)', c2: 'rgba(224, 242, 254, 0.14)' },
      { x: 128, y: 92,  r: 56, c1: 'rgba(254, 252, 232, 0.36)', c2: 'rgba(240, 249, 255, 0.12)' }
    ];

    puffs.forEach(p => {
      const grad = ctx.createRadialGradient(p.x, p.y, 6, p.x, p.y, p.r);
      grad.addColorStop(0.0, p.c1);
      grad.addColorStop(0.55, p.c2);
      grad.addColorStop(1.0, 'rgba(224, 242, 254, 0.0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });

    return new THREE.CanvasTexture(canvas);
  }

  // Create a seamless tiled airy white/sky-mist fog texture for the continuous cloud blanket layers
  createCloudBlanketTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Soft airy sky-mist base
    ctx.fillStyle = 'rgba(224, 242, 254, 0.45)';
    ctx.fillRect(0, 0, 512, 512);

    // Layer 85 fluffy white & powder-blue cloud puffs (wrapped across edges for seamless tiling)
    for (let i = 0; i < 85; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = 45 + Math.random() * 75;
      const isPureWhite = (i % 2 === 0);

      for (let ox = -512; ox <= 512; ox += 512) {
        for (let oy = -512; oy <= 512; oy += 512) {
          const gx = x + ox;
          const gy = y + oy;
          if (gx + r < 0 || gx - r > 512 || gy + r < 0 || gy - r > 512) continue;

          const grad = ctx.createRadialGradient(gx, gy, 5, gx, gy, r);
          if (isPureWhite) {
            grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.36)');
            grad.addColorStop(0.5, 'rgba(240, 249, 255, 0.18)');
          } else {
            grad.addColorStop(0.0, 'rgba(186, 230, 253, 0.32)');
            grad.addColorStop(0.5, 'rgba(224, 242, 254, 0.16)');
          }
          grad.addColorStop(1.0, 'rgba(224, 242, 254, 0.0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(gx, gy, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 9);
    return tex;
  }

  // VOLUMETRIC FOG & CLOUD SEA BLANKET OVER THE CITY BELOW (Alt Tarafta Ferah Sis ve Bulut Tabakası)
  buildDimCloudSeaOverCity() {
    // 1. Three Stacked Undulating 3D Cloud Sea Blanket Layers
    const blanketTex = this.createCloudBlanketTexture();
    const layerHeights = [-68, -48, -32];
    const layerOpacities = [0.82, 0.65, 0.50];

    layerHeights.forEach((yLevel, idx) => {
      const sheetGeom = new THREE.PlaneGeometry(1800, 2800, 48, 72);
      sheetGeom.rotateX(-Math.PI / 2);

      // Displace vertices into soft rolling cloud waves
      const posAttr = sheetGeom.attributes.position;
      for (let v = 0; v < posAttr.count; v++) {
        const vx = posAttr.getX(v);
        const vz = posAttr.getZ(v);
        const waveY = Math.sin(vx * 0.018 + idx) * 4.5 + Math.cos(vz * 0.015 + idx * 2) * 4.5;
        posAttr.setY(v, waveY);
      }
      sheetGeom.computeVertexNormals();

      const sheetMat = new THREE.MeshBasicMaterial({
        map: blanketTex,
        transparent: true,
        opacity: layerOpacities[idx],
        depthWrite: false,
        side: THREE.DoubleSide
      });

      const sheetMesh = new THREE.Mesh(sheetGeom, sheetMat);
      sheetMesh.position.set(0, yLevel, 1050);
      this.scene.add(sheetMesh);

      this.dimCityClouds.push({
        mesh: sheetMesh,
        isSheet: true,
        baseX: 0,
        baseY: yLevel,
        speedX: (idx % 2 === 0 ? 1 : -1) * (1.8 + idx * 0.6),
        phase: idx * 1.7
      });
    });

    // 2. 165 Billowy Soft White & Sky-Blue Cloud Sprites hugging the skyscrapers below the tracks
    const billowyTex = this.createBillowyCloudTexture();
    const cloudColors = [0xffffff, 0xf0f9ff, 0xe0f2fe, 0xf8fafc, 0xfefce8];

    for (let i = 0; i < 165; i++) {
      const spriteMat = new THREE.SpriteMaterial({
        map: billowyTex,
        color: cloudColors[i % cloudColors.length],
        transparent: true,
        opacity: 0.45 + Math.random() * 0.28,
        depthWrite: false
      });

      const cloudSprite = new THREE.Sprite(spriteMat);

      const xPos = (Math.random() - 0.5) * 1050;
      const yPos = -48 + Math.random() * 34;
      const zPos = Math.random() * 2400 - 100;

      const scaleW = 90 + Math.random() * 95;
      const scaleH = scaleW * (0.52 + Math.random() * 0.22);
      cloudSprite.position.set(xPos, yPos, zPos);
      cloudSprite.scale.set(scaleW, scaleH, 1);

      this.scene.add(cloudSprite);

      this.dimCityClouds.push({
        mesh: cloudSprite,
        isSheet: false,
        baseY: yPos,
        speedX: 1.5 + Math.random() * 2.8,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  // NATURAL TANGENTIAL RAILWAY SWITCH TURNOUTS (Kenardan Kaynayan Doğal Makas Ray Birleşimi)
  buildExtendedBranchTracks() {
    const stationIndices = [0, 1, 2, 3];
    const up = new THREE.Vector3(0, 1, 0);

    stationIndices.forEach((stIdx) => {
      const startU = this.stationPositions[stIdx];
      // Span a graceful 10.5% section of the main track so both diverge and merge are ultra-smooth
      const rejoinU = startU + 0.105;
      const sideSign = (stIdx % 2 === 0) ? 1.0 : -1.0;

      // Sample 64 curvilinear points along the main track's local frame [startU -> rejoinU]
      // Using C2-smooth S-curve lateral and vertical offsets so the branch peels off tangentially
      // at startU and glides in parallel before welding seamlessly into the main rail at rejoinU!
      const curvePts = [];
      const numSamples = 64;
      const maxLateral = 22.0; // Maximum side offset (m)
      const maxRise = 6.2;     // Maximum ramp height above main track (m)

      let jumpPt = null;
      let landPt = null;
      let jumpTangent = null;
      let jumpRight = null;

      for (let i = 0; i <= numSamples; i++) {
        const s = i / numSamples; // 0.0 -> 1.0 along branch
        const uMain = startU + s * (rejoinU - startU);

        const ptMain = this.curve.getPointAt(uMain);
        const tanMain = this.curve.getTangentAt(uMain).normalize();
        const rightMain = new THREE.Vector3().crossVectors(up, tanMain).normalize();
        const normMain = new THREE.Vector3().crossVectors(tanMain, rightMain).normalize();

        let lat = 0;
        let vert = 0;

        if (s <= 0.26) {
          // 1. Diverging Turnout (Kenardan yumuşakça ayrılan makas): C2 smooth S-curve
          const t = s / 0.26;
          const ease = Math.pow(0.5 * (1.0 - Math.cos(Math.PI * t)), 1.35);
          lat = maxLateral * ease;
          vert = maxRise * 0.45 * ease;
        } else if (s <= 0.46) {
          // 2. Launch Ramp Cruise (Paralel yükseliş ve kopuk raya yaklaşım)
          const t = (s - 0.26) / (0.46 - 0.26);
          const ease = 0.5 * (1.0 - Math.cos(Math.PI * t));
          lat = maxLateral + 2.5 * ease;
          vert = maxRise * (0.45 + 0.55 * ease);
        } else if (s <= 0.58) {
          // 3. Aerial Flight Gap (Uçuş boşluğu)
          const t = (s - 0.46) / (0.58 - 0.46);
          lat = (maxLateral + 2.5) * (1.0 - t) + (maxLateral * 0.88) * t;
          vert = maxRise * (1.0 - t * 0.25);
        } else {
          // 4. Long Tangential Weld-Merge (Keskin viraj değil, ana raya paralel yanaşıp kenardan kaynayan ray!)
          const t = (1.0 - s) / (1.0 - 0.58); // 1.0 at landing -> 0.0 at rejoinU
          // High-order smooth taper: both value and slope -> 0 as s -> 1.0!
          const easeLat = Math.pow(0.5 * (1.0 - Math.cos(Math.PI * t)), 1.55);
          const easeVert = Math.pow(0.5 * (1.0 - Math.cos(Math.PI * t)), 1.75);
          lat = (maxLateral * 0.88) * easeLat;
          vert = (maxRise * 0.75) * easeVert;
        }

        const worldPt = ptMain.clone()
          .addScaledVector(rightMain, sideSign * lat)
          .addScaledVector(normMain, vert);

        curvePts.push(worldPt);

        if (i === Math.round(0.46 * numSamples)) {
          jumpPt = worldPt.clone();
          jumpTangent = tanMain.clone();
          jumpRight = rightMain.clone();
        }
        if (i === Math.round(0.58 * numSamples)) {
          landPt = worldPt.clone();
        }
      }

      const branchCurve = new THREE.CatmullRomCurve3(curvePts, false, 'catmullrom', 0.5);
      const branchLen = branchCurve.getLength();

      // Build Launch Ramp (0.0 -> 0.46) and Re-merge Weld Ramp (0.58 -> 1.0)
      this.buildRampSegment(branchCurve, 0.0, 0.46, true, sideSign, startU, rejoinU);
      this.buildRampSegment(branchCurve, 0.58, 1.0, false, sideSign, startU, rejoinU);
      this.buildBrokenEdgeHazard(jumpPt, jumpTangent, jumpRight, sideSign);
      this.buildLandingPad(landPt);

      this.branches.push({
        stationIdx: stIdx,
        startU: startU,
        rejoinU: rejoinU,
        curve: branchCurve,
        length: branchLen,
        jumpU: 0.46,
        landU: 0.58,
        jumpPt: jumpPt,
        landPt: landPt
      });
    });
  }

  buildRampSegment(curve, uStart, uEnd, isLaunchRamp, sideSign, startU, rejoinU) {
    const samples = 160;
    const railRadius = 0.14;
    const leftPoints = [];
    const rightPoints = [];
    const up = new THREE.Vector3(0, 1, 0);

    for (let i = 0; i <= samples; i++) {
      const subU = uStart + (i / samples) * (uEnd - uStart);
      const pt = curve.getPointAt(subU);
      const tangent = curve.getTangentAt(subU).normalize();
      const right = new THREE.Vector3().crossVectors(up, tangent).normalize();

      const halfGauge = this.railGauge * 0.5;
      leftPoints.push(pt.clone().addScaledVector(right, -halfGauge));
      rightPoints.push(pt.clone().addScaledVector(right, halfGauge));
    }

    const curveL = new THREE.CatmullRomCurve3(leftPoints);
    const curveR = new THREE.CatmullRomCurve3(rightPoints);

    const geomL = new THREE.TubeGeometry(curveL, 110, railRadius, 8, false);
    const geomR = new THREE.TubeGeometry(curveR, 110, railRadius, 8, false);

    // Same clean brushed steel color at merge ends so the rails look physically welded together
    const mat = new THREE.MeshStandardMaterial({
      color: isLaunchRamp ? 0xfca5a5 : 0xf1f5f9,
      metalness: 0.85,
      roughness: 0.22
    });

    const meshL = new THREE.Mesh(geomL, mat);
    const meshR = new THREE.Mesh(geomR, mat);
    meshL.castShadow = true;
    meshR.castShadow = true;
    this.scene.add(meshL, meshR);

    const sleeperCount = Math.floor((uEnd - uStart) * 85);
    const sleeperMat = new THREE.MeshStandardMaterial({ color: 0x78553a, roughness: 0.8 });
    
    for (let i = 0; i < sleeperCount; i++) {
      const subU = uStart + (i / sleeperCount) * (uEnd - uStart);
      const pt = curve.getPointAt(subU);
      const tangent = curve.getTangentAt(subU).normalize();
      const right = new THREE.Vector3().crossVectors(up, tangent).normalize();
      const normal = new THREE.Vector3().crossVectors(tangent, right).normalize();

      // Near the diverge (subU < 0.09) or re-merge (subU > 0.88), use extra-wide shared switch sleepers
      // (makas traversleri) that bridge underneath both tracks as the rails weld together!
      const isSwitchZone = (subU < 0.09 || subU > 0.88);
      const sleeperWidth = isSwitchZone ? this.railGauge * 2.1 : this.railGauge * 1.45;
      const sleeperGeom = new THREE.BoxGeometry(sleeperWidth, 0.15, 0.45);

      const sleeper = new THREE.Mesh(sleeperGeom, sleeperMat);
      sleeper.position.copy(pt).addScaledVector(normal, -0.07);
      const m = new THREE.Matrix4().makeBasis(right, normal, tangent);
      sleeper.rotation.setFromRotationMatrix(m);
      sleeper.castShadow = true;
      this.scene.add(sleeper);
    }

    const pillarCount = Math.max(1, Math.floor((uEnd - uStart) * 5));
    for (let i = 0; i <= pillarCount; i++) {
      const subU = uStart + (i / pillarCount) * (uEnd - uStart);
      if (subU < 0.08 || subU > 0.90) continue;
      const pt = curve.getPointAt(subU);
      const height = pt.y - (-350);

      const pillarGeom = new THREE.CylinderGeometry(0.9, 3.0, height, 10);
      const pillarMat = new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.8 });
      const pillar = new THREE.Mesh(pillarGeom, pillarMat);
      pillar.position.set(pt.x, pt.y - height * 0.5 - 0.2, pt.z);
      pillar.castShadow = true;
      this.scene.add(pillar);
    }
  }

  buildBrokenEdgeHazard(pt, tangent, right, sideSign) {
    const hazardGroup = new THREE.Group();
    hazardGroup.position.copy(pt);

    const boardGeom = new THREE.BoxGeometry(2.4, 0.6, 0.2);
    const boardMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.5, roughness: 0.3 });
    const board = new THREE.Mesh(boardGeom, boardMat);
    board.position.set(0, 1.2, 0);

    const postGeom = new THREE.CylinderGeometry(0.1, 0.1, 1.4, 8);
    const postMat = new THREE.MeshStandardMaterial({ color: 0xd97706 });
    const postL = new THREE.Mesh(postGeom, postMat);
    postL.position.set(-0.9, 0.7, 0);
    const postR = new THREE.Mesh(postGeom, postMat);
    postR.position.set(0.9, 0.7, 0);

    const beaconLight = new THREE.PointLight(0xef4444, 2.5, 15);
    beaconLight.position.set(0, 1.8, 0.2);

    hazardGroup.add(board, postL, postR, beaconLight);
    this.scene.add(hazardGroup);
  }

  buildLandingPad(pt) {
    const padGeom = new THREE.CylinderGeometry(1.6, 1.8, 0.3, 16);
    const padMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      roughness: 0.3,
      metalness: 0.8,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.5
    });
    const pad = new THREE.Mesh(padGeom, padMat);
    pad.position.set(pt.x, pt.y - 0.2, pt.z);
    this.scene.add(pad);
  }

  buildGrandTerminal() {
    const endU = 0.99;
    const endPt = this.curve.getPointAt(endU);
    const tangent = this.curve.getTangentAt(endU).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(up, tangent).normalize();
    const normal = new THREE.Vector3().crossVectors(tangent, right).normalize();

    const stationGroup = new THREE.Group();
    stationGroup.position.copy(endPt);

    const m = new THREE.Matrix4().makeBasis(right, normal, tangent);
    stationGroup.rotation.setFromRotationMatrix(m);

    const platformLen = 60;
    const platformWidth = 3.5;
    const stationHeight = 9.0;

    const platformGeom = new THREE.BoxGeometry(platformWidth, 0.9, platformLen);
    const platformMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6, metalness: 0.1 });

    const platL = new THREE.Mesh(platformGeom, platformMat);
    platL.position.set(-2.8, -0.15, platformLen * 0.4);
    platL.receiveShadow = true;

    const platR = new THREE.Mesh(platformGeom, platformMat);
    platR.position.set(2.8, -0.15, platformLen * 0.4);
    platR.receiveShadow = true;

    const edgeGeom = new THREE.BoxGeometry(0.22, 0.06, platformLen);
    const edgeMat = new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.3, metalness: 0.6 });
    const edgeL = new THREE.Mesh(edgeGeom, edgeMat);
    edgeL.position.set(-1.1, 0.32, platformLen * 0.4);
    const edgeR = new THREE.Mesh(edgeGeom, edgeMat);
    edgeR.position.set(1.1, 0.32, platformLen * 0.4);

    stationGroup.add(platL, platR, edgeL, edgeR);

    const archCount = 7;
    const archMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6, roughness: 0.35 });
    const glassRoofMat = new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.42,
      roughness: 0.1,
      metalness: 0.8
    });

    for (let i = 0; i < archCount; i++) {
      const zPos = i * (platformLen / (archCount - 1));

      const trussGeom = new THREE.TorusGeometry(5.2, 0.22, 8, 24, Math.PI);
      const truss = new THREE.Mesh(trussGeom, archMat);
      truss.rotation.x = Math.PI / 2;
      truss.rotation.y = Math.PI / 2;
      truss.position.set(0, 0.3, zPos);
      stationGroup.add(truss);

      const colGeom = new THREE.CylinderGeometry(0.2, 0.25, stationHeight * 0.6, 12);
      const cL = new THREE.Mesh(colGeom, archMat);
      cL.position.set(-4.2, stationHeight * 0.3, zPos);
      const cR = new THREE.Mesh(colGeom, archMat);
      cR.position.set(4.2, stationHeight * 0.3, zPos);
      stationGroup.add(cL, cR);

      const lampLight = new THREE.PointLight(0xfef9c3, 1.2, 22);
      lampLight.position.set(-3.5, 3.8, zPos);
      stationGroup.add(lampLight);
    }

    const glassRoofGeom = new THREE.CylinderGeometry(5.1, 5.1, platformLen, 18, 1, true, 0, Math.PI);
    const glassRoof = new THREE.Mesh(glassRoofGeom, glassRoofMat);
    glassRoof.rotation.x = Math.PI / 2;
    glassRoof.rotation.z = Math.PI;
    glassRoof.position.set(0, 0.3, platformLen * 0.5);
    stationGroup.add(glassRoof);

    const signBoardGeom = new THREE.BoxGeometry(6.5, 1.2, 0.3);
    const signBoardMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.5, roughness: 0.4 });
    const signBoard = new THREE.Mesh(signBoardGeom, signBoardMat);
    signBoard.position.set(0, 5.6, 0);

    const clockGeom = new THREE.CylinderGeometry(0.75, 0.75, 0.3, 24);
    const clockMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfef3c7, emissiveIntensity: 0.4 });
    const clock = new THREE.Mesh(clockGeom, clockMat);
    clock.rotation.x = Math.PI / 2;
    clock.position.set(0, 4.2, 0.2);

    stationGroup.add(signBoard, clock);

    const bufferGeom = new THREE.BoxGeometry(2.4, 1.4, 0.9);
    const bufferMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4, metalness: 0.4 });
    const bufferStop = new THREE.Mesh(bufferGeom, bufferMat);
    bufferStop.position.set(0, 0.7, platformLen * 0.9);
    stationGroup.add(bufferStop);

    const baseGeom = new THREE.BoxGeometry(11.0, 350, platformLen * 1.1);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.85 });
    const baseBlock = new THREE.Mesh(baseGeom, baseMat);
    baseBlock.position.set(0, -175 - 0.4, platformLen * 0.45);
    stationGroup.add(baseBlock);

    this.scene.add(stationGroup);
  }

  buildStationGates() {
    const stationNames = [
      "1. İSTASYON (1/5)",
      "2. İSTASYON (2/5)",
      "3. İSTASYON (3/5)",
      "4. İSTASYON (4/5)",
      "5. İSTASYON: BÜYÜK TERMİNAL (5/5)"
    ];

    this.stationPositions.forEach((u, idx) => {
      const pt = this.curve.getPointAt(u);
      const tangent = this.curve.getTangentAt(u).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(up, tangent).normalize();
      const normal = new THREE.Vector3().crossVectors(tangent, right).normalize();

      const gateGroup = new THREE.Group();
      gateGroup.position.copy(pt).addScaledVector(normal, 0.14);

      const m = new THREE.Matrix4().makeBasis(right, normal, tangent);
      gateGroup.rotation.setFromRotationMatrix(m);

      const pillarGeom = new THREE.CylinderGeometry(0.28, 0.34, 5.4, 12);
      const pillarMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85, roughness: 0.2 });
      
      const pL = new THREE.Mesh(pillarGeom, pillarMat);
      pL.position.set(-2.2, 2.7, 0);
      const pR = new THREE.Mesh(pillarGeom, pillarMat);
      pR.position.set(2.2, 2.7, 0);
      gateGroup.add(pL, pR);

      const archGeom = new THREE.BoxGeometry(5.0, 0.75, 0.45);
      const archMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, metalness: 0.7, roughness: 0.3 });
      const archTop = new THREE.Mesh(archGeom, archMat);
      archTop.position.set(0, 5.4, 0);
      gateGroup.add(archTop);

      const lightBoxGeom = new THREE.BoxGeometry(0.5, 1.2, 0.3);
      const lightBoxMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
      const lightBox = new THREE.Mesh(lightBoxGeom, lightBoxMat);
      lightBox.position.set(2.2, 4.0, 0.3);
      gateGroup.add(lightBox);

      const redMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0xef4444,
        emissiveIntensity: 1.8
      });
      const redLamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), redMat);
      redLamp.position.set(2.2, 4.3, 0.45);
      gateGroup.add(redLamp);

      const greenMat = new THREE.MeshStandardMaterial({
        color: 0x22c55e,
        emissive: 0x22c55e,
        emissiveIntensity: 0.1
      });
      const greenLamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), greenMat);
      greenLamp.position.set(2.2, 3.7, 0.45);
      gateGroup.add(greenLamp);

      const barrierPivot = new THREE.Group();
      barrierPivot.position.set(1.9, 1.3, 0);

      const armGeom = new THREE.BoxGeometry(3.8, 0.16, 0.16);
      const armMat = new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        roughness: 0.25,
        metalness: 0.7
      });
      const barrierArm = new THREE.Mesh(armGeom, armMat);
      barrierArm.position.set(-1.9, 0, 0);
      barrierPivot.add(barrierArm);
      gateGroup.add(barrierPivot);

      this.scene.add(gateGroup);

      this.gates.push({
        idx,
        u,
        name: stationNames[idx],
        gateGroup,
        barrierPivot,
        redLamp,
        greenLamp,
        isOpen: false,
        targetAngle: 0,
        currentAngle: 0
      });
    });
  }

  setGateOpen(gateIdx, isOpen) {
    const gate = this.gates[gateIdx];
    if (!gate) return;
    gate.isOpen = isOpen;
    gate.targetAngle = isOpen ? -Math.PI / 2.2 : 0;

    if (isOpen) {
      gate.redLamp.material.emissiveIntensity = 0.1;
      gate.greenLamp.material.emissiveIntensity = 1.8;
    } else {
      gate.redLamp.material.emissiveIntensity = 1.8;
      gate.greenLamp.material.emissiveIntensity = 0.1;
    }
  }

  updateGates(dt) {
    this.gates.forEach(g => {
      g.currentAngle = THREE.MathUtils.lerp(g.currentAngle, g.targetAngle, dt * 6.0);
      g.barrierPivot.rotation.z = g.currentAngle;
    });
  }

  // LOAD & ANIMATE USER'S cloud.glb WITH FAIRY-TALE SUNSET TINT
  loadAnimatedGLBClouds() {
    if (!THREE.GLTFLoader) return;

    const loader = new THREE.GLTFLoader();
    loader.load('./assets/cloud.glb', (gltf) => {
      const baseCloud = gltf.scene;

      baseCloud.traverse((child) => {
        if (child.isMesh) {
          child.material = new THREE.MeshStandardMaterial({
            color: 0xffffff,        // Pure airy white marshmallow cloud body
            emissive: 0xe0f2fe,     // Soft sky-blue ambient bounce
            emissiveIntensity: 0.28,
            roughness: 0.9,
            metalness: 0.02,
            transparent: true,
            opacity: 0.90
          });
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      const cloudCount = 34;
      for (let i = 0; i < cloudCount; i++) {
        const cloudInstance = baseCloud.clone();

        const s = 2.0 + Math.random() * 3.8;
        cloudInstance.scale.set(s, s * 0.8, s);

        const u = i / cloudCount;
        const pt = this.curve.getPointAt(u);
        const offsetX = (Math.random() - 0.5) * 420;
        const offsetZ = (Math.random() - 0.5) * 260;
        // Place most clouds hovering dimly over the city below the rails, and some high up
        const altitude = (i % 3 === 0)
          ? pt.y + 12 + Math.random() * 30
          : -25 + Math.random() * 40;

        cloudInstance.position.set(pt.x + offsetX, altitude, pt.z + offsetZ);
        cloudInstance.rotation.y = Math.random() * Math.PI * 2;

        this.cloudFleetGroup.add(cloudInstance);

        this.animatedClouds.push({
          mesh: cloudInstance,
          baseY: altitude,
          speedX: 1.5 + Math.random() * 3.5,
          speedZ: (Math.random() - 0.5) * 1.5,
          bobSpeed: 0.6 + Math.random() * 0.8,
          bobAmp: 2.0 + Math.random() * 3.0,
          rotSpeed: (Math.random() - 0.5) * 0.04,
          phase: Math.random() * Math.PI * 2
        });
      }
    }, undefined, (err) => console.error(err));
  }

  // Update Animated Clouds, Dim City Mist & Volumetric God Rays
  updateClouds(time, dt) {
    // 1. Animate 3D GLB clouds
    for (let i = 0; i < this.animatedClouds.length; i++) {
      const c = this.animatedClouds[i];
      c.mesh.position.x += c.speedX * dt;
      c.mesh.position.z += c.speedZ * dt;

      if (c.mesh.position.x > 700) c.mesh.position.x = -700;
      if (c.mesh.position.z > 2200) c.mesh.position.z = -100;

      c.mesh.position.y = c.baseY + Math.sin(time * c.bobSpeed + c.phase) * c.bobAmp;
      c.mesh.rotation.y += c.rotSpeed * dt;
    }

    // 2. Drift dim city cloud sea & undulating fog blanket layers
    for (let i = 0; i < this.dimCityClouds.length; i++) {
      const m = this.dimCityClouds[i];
      if (m.isSheet) {
        m.mesh.position.x = Math.sin(time * 0.25 + m.phase) * 35;
        m.mesh.position.y = m.baseY + Math.cos(time * 0.35 + m.phase) * 2.2;
      } else {
        m.mesh.position.x += m.speedX * dt;
        if (m.mesh.position.x > 650) m.mesh.position.x = -650;
        m.mesh.position.y = m.baseY + Math.sin(time * 0.5 + m.phase) * 2.5;
      }
    }

    // 3. Shimmer volumetric sun God Rays
    for (let i = 0; i < this.godRays.length; i++) {
      const r = this.godRays[i];
      r.mesh.rotation.z = r.baseRotZ + Math.sin(time * r.speed + r.phase) * 0.03;
      r.mesh.material.opacity = r.baseOpacity + Math.sin(time * r.speed * 1.5 + r.phase) * 0.06;
    }
  }

  getCurvatureAt(u) {
    const delta = 0.006;
    const u1 = Math.max(0, u - delta);
    const u2 = Math.min(1, u + delta);

    const t1 = this.curve.getTangentAt(u1).normalize();
    const t2 = this.curve.getTangentAt(u2).normalize();

    const dot = Math.max(-1, Math.min(1, t1.dot(t2)));
    const angleDiff = Math.acos(dot);
    const arcDist = this.totalLength * (u2 - u1);

    return arcDist > 0 ? angleDiff / arcDist : 0;
  }
}

window.TrackBuilder = TrackBuilder;
