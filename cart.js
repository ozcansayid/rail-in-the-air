// Enchanted Fairy-Tale Steam Locomotive & Articulated Passenger Carriage
class TrainCart {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group(); // Locomotive root group
    this.bodyMesh = new THREE.Group(); // Tilting locomotive body
    this.group.add(this.bodyMesh);

    // Trailing Passenger Wagon (2nd car)
    this.wagonGroup = new THREE.Group();
    this.wagonBody = new THREE.Group();
    this.wagonGroup.add(this.wagonBody);
    this.scene.add(this.wagonGroup);

    this.wheels = [];
    this.wagonWheels = [];
    this.pistonRods = [];
    this.wheelAngle = 0;

    // VFX Systems
    this.sparkParticles = null;
    this.smokePuffs = [];
    this.smokeGroup = new THREE.Group();
    this.scene.add(this.smokeGroup);
    this.smokeTimer = 0;

    // Physics state
    this.derailed = false;
    this.velocity = new THREE.Vector3();
    this.angularVelocity = new THREE.Vector3();
    this.wagonVelocity = new THREE.Vector3();
    this.wagonAngularVelocity = new THREE.Vector3();
    this.currentRoll = 0;

    this.buildMaterials();
    this.buildLocomotive();
    this.buildPassengerWagon();
    this.setupSparkParticles();
    this.setupSmokeSystem();

    this.scene.add(this.group);
  }

  buildMaterials() {
    this.mats = {
      royalRed: new THREE.MeshStandardMaterial({
        color: 0x991b1b,
        roughness: 0.28,
        metalness: 0.45
      }),
      midnightBlue: new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.35,
        metalness: 0.65
      }),
      darkIron: new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.4,
        metalness: 0.8
      }),
      polishedBrass: new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        roughness: 0.18,
        metalness: 0.92,
        emissive: 0x78350f,
        emissiveIntensity: 0.15
      }),
      copperTrim: new THREE.MeshStandardMaterial({
        color: 0xd97706,
        roughness: 0.25,
        metalness: 0.85
      }),
      warmWindow: new THREE.MeshStandardMaterial({
        color: 0xfef3c7,
        emissive: 0xf59e0b,
        emissiveIntensity: 1.8,
        roughness: 0.1
      }),
      lanternGlow: new THREE.MeshBasicMaterial({
        color: 0xfffbeb
      }),
      wheelSteel: new THREE.MeshStandardMaterial({
        color: 0x64748b,
        roughness: 0.22,
        metalness: 0.9
      })
    };
  }

  buildLocomotive() {
    // 1. Heavy Iron Undercarriage / Chassis Deck
    const deckGeom = new THREE.BoxGeometry(1.65, 0.22, 4.2);
    const deck = new THREE.Mesh(deckGeom, this.mats.darkIron);
    deck.position.set(0, 0.52, 0.1);
    deck.castShadow = true;
    deck.receiveShadow = true;
    this.bodyMesh.add(deck);

    // Brass side trim along chassis
    const trimGeom = new THREE.BoxGeometry(1.7, 0.06, 4.24);
    const trim = new THREE.Mesh(trimGeom, this.mats.polishedBrass);
    trim.position.set(0, 0.62, 0.1);
    this.bodyMesh.add(trim);

    // 2. Cylindrical Steam Boiler (Front section)
    const boilerLen = 2.45;
    const boilerRadius = 0.62;
    const boilerGeom = new THREE.CylinderGeometry(boilerRadius, boilerRadius, boilerLen, 24);
    boilerGeom.rotateX(Math.PI / 2);
    const boiler = new THREE.Mesh(boilerGeom, this.mats.midnightBlue);
    boiler.position.set(0, 1.22, 0.75);
    boiler.castShadow = true;
    boiler.receiveShadow = true;
    this.bodyMesh.add(boiler);

    // Nose Cone (Smokebox door with ornate brass star/hinge)
    const frontCapGeom = new THREE.SphereGeometry(boilerRadius * 0.98, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.35);
    frontCapGeom.rotateX(Math.PI / 2);
    const frontCap = new THREE.Mesh(frontCapGeom, this.mats.darkIron);
    frontCap.position.set(0, 1.22, 0.75 + boilerLen * 0.5 - 0.15);
    this.bodyMesh.add(frontCap);

    // Brass Boiler Bands (3 gleaming gold rings around the boiler)
    [-0.7, 0.0, 0.75].forEach(zOff => {
      const bandGeom = new THREE.TorusGeometry(boilerRadius + 0.015, 0.028, 12, 32);
      const band = new THREE.Mesh(bandGeom, this.mats.polishedBrass);
      band.position.set(0, 1.22, 0.75 + zOff);
      this.bodyMesh.add(band);
    });

    // 3. Ornate Fairy-Tale Smokestack / Chimney (Front top)
    const stackGroup = new THREE.Group();
    stackGroup.position.set(0, 1.8, 1.55);

    const stackShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.17, 0.75, 16),
      this.mats.darkIron
    );
    const stackCrown = new THREE.Mesh(
      new THREE.TorusGeometry(0.25, 0.05, 12, 24),
      this.mats.polishedBrass
    );
    stackCrown.rotation.x = Math.PI / 2;
    stackCrown.position.y = 0.36;

    const stackBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.23, 0.26, 0.12, 16),
      this.mats.polishedBrass
    );
    stackBase.position.y = -0.32;

    stackGroup.add(stackShaft, stackCrown, stackBase);
    this.bodyMesh.add(stackGroup);

    // 4. Golden Steam Dome & Sand Dome
    const domeGeom = new THREE.SphereGeometry(0.28, 18, 16, 0, Math.PI * 2, 0, Math.PI * 0.65);
    const steamDome = new THREE.Mesh(domeGeom, this.mats.polishedBrass);
    steamDome.position.set(0, 1.82, 0.85);
    this.bodyMesh.add(steamDome);

    const sandDome = new THREE.Mesh(domeGeom.clone().scale(0.8, 0.8, 0.8), this.mats.copperTrim);
    sandDome.position.set(0, 1.8, 0.15);
    this.bodyMesh.add(sandDome);

    // 5. Engineer's Cab (Royal Crimson Rear Cabin with Warm Lit Windows)
    const cabGroup = new THREE.Group();
    cabGroup.position.set(0, 1.38, -1.1);

    const cabMain = new THREE.Mesh(
      new THREE.BoxGeometry(1.62, 1.45, 1.45),
      this.mats.royalRed
    );
    cabMain.castShadow = true;
    cabMain.receiveShadow = true;
    cabGroup.add(cabMain);

    // Arched Cab Roof
    const roofGeom = new THREE.CylinderGeometry(0.92, 0.92, 1.65, 16, 1, false, -Math.PI * 0.35, Math.PI * 0.7);
    roofGeom.rotateZ(Math.PI / 2);
    roofGeom.rotateY(Math.PI / 2);
    const cabRoof = new THREE.Mesh(roofGeom, this.mats.darkIron);
    cabRoof.position.set(0, 0.25, 0);
    cabGroup.add(cabRoof);

    // Warm Glowing Cab Side Windows
    const sideWinGeom = new THREE.BoxGeometry(1.66, 0.55, 0.78);
    const sideWin = new THREE.Mesh(sideWinGeom, this.mats.warmWindow);
    sideWin.position.set(0, 0.22, 0);
    cabGroup.add(sideWin);

    // Brass Window Frames
    const frameGeom = new THREE.BoxGeometry(1.68, 0.62, 0.85);
    const frameMesh = new THREE.Mesh(frameGeom, this.mats.polishedBrass);
    frameMesh.position.set(0, 0.22, 0);
    // Slightly behind window panes
    sideWin.scale.set(1.01, 0.9, 0.9);
    cabGroup.add(frameMesh);

    this.bodyMesh.add(cabGroup);

    // 6. Classic V-Shaped Cowcatcher (Pilot Grate at Front)
    const catcherGroup = new THREE.Group();
    catcherGroup.position.set(0, 0.36, 2.25);

    const wedgeGeom = new THREE.ConeGeometry(0.85, 0.75, 3);
    wedgeGeom.rotateX(Math.PI / 2);
    wedgeGeom.scale(1.0, 0.45, 0.9);
    const wedge = new THREE.Mesh(wedgeGeom, this.mats.polishedBrass);
    catcherGroup.add(wedge);
    this.bodyMesh.add(catcherGroup);

    // 7. Side Steam Cylinders & Animated Piston Rods
    [-0.78, 0.78].forEach((xSide, idx) => {
      const cylGeom = new THREE.CylinderGeometry(0.22, 0.22, 0.75, 16);
      cylGeom.rotateX(Math.PI / 2);
      const cyl = new THREE.Mesh(cylGeom, this.mats.royalRed);
      cyl.position.set(xSide, 0.52, 1.55);
      this.bodyMesh.add(cyl);

      // Moving Piston Connecting Rod
      const rodGeom = new THREE.BoxGeometry(0.06, 0.1, 1.95);
      const rod = new THREE.Mesh(rodGeom, this.mats.polishedBrass);
      rod.position.set(xSide + (idx === 0 ? -0.06 : 0.06), 0.4, 0.1);
      this.bodyMesh.add(rod);
      this.pistonRods.push({ mesh: rod, side: idx === 0 ? 1 : -1, baseX: rod.position.x });
    });

    // 8. Grand Brass Headlight Lantern & Volumetric Light Beam
    const lanternHousing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.36, 16),
      this.mats.polishedBrass
    );
    lanternHousing.rotation.x = Math.PI / 2;
    lanternHousing.position.set(0, 1.35, 2.05);
    this.bodyMesh.add(lanternHousing);

    const lanternGlass = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 16, 16),
      this.mats.lanternGlow
    );
    lanternGlass.position.set(0, 1.35, 2.2);
    this.bodyMesh.add(lanternGlass);

    // Volumetric Light Cone Mesh (Magical golden beam cutting through the night/dusk)
    const coneGeom = new THREE.ConeGeometry(3.2, 18, 24, 1, true);
    coneGeom.translate(0, -9, 0);
    coneGeom.rotateX(-Math.PI / 2);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.11,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const lightCone = new THREE.Mesh(coneGeom, coneMat);
    lightCone.position.set(0, 1.35, 2.25);
    this.bodyMesh.add(lightCone);

    // Real SpotLight for lighting the rails ahead
    const spot = new THREE.SpotLight(0xfffbeb, 3.2, 65, Math.PI / 4, 0.45);
    spot.position.set(0, 1.4, 2.2);
    const targetObj = new THREE.Object3D();
    targetObj.position.set(0, 0, 25);
    this.group.add(targetObj);
    spot.target = targetObj;
    this.bodyMesh.add(spot);

    // 9. Locomotive Spoked Drive Wheels (6 wheels: 2 large rear pairs + 1 front pilot pair)
    const wheelConfigs = [
      { z: 1.45, r: 0.28 },  // Front Pilot Wheels
      { z: 0.25, r: 0.40 },  // Center Drive Wheels
      { z: -0.95, r: 0.40 }  // Rear Drive Wheels
    ];

    wheelConfigs.forEach(cfg => {
      [-0.65, 0.65].forEach(xPos => {
        const wGroup = this.createDetailedWheel(cfg.r);
        wGroup.position.set(xPos, cfg.r, cfg.z);
        this.wheels.push(wGroup);
        this.group.add(wGroup);
      });
    });
  }

  createDetailedWheel(radius) {
    const wGroup = new THREE.Group();

    // Outer Steel Tire
    const tireGeom = new THREE.CylinderGeometry(radius, radius, 0.2, 20);
    tireGeom.rotateZ(Math.PI / 2);
    const tire = new THREE.Mesh(tireGeom, this.mats.wheelSteel);
    tire.castShadow = true;
    wGroup.add(tire);

    // Inner Red Wheel Core
    const coreGeom = new THREE.CylinderGeometry(radius * 0.78, radius * 0.78, 0.22, 16);
    coreGeom.rotateZ(Math.PI / 2);
    const core = new THREE.Mesh(coreGeom, this.mats.royalRed);
    wGroup.add(core);

    // Brass Hubcap & Spokes (Cross bars so rotation is clearly visible!)
    const spokeGeom = new THREE.BoxGeometry(0.24, radius * 1.7, 0.06);
    const spoke1 = new THREE.Mesh(spokeGeom, this.mats.polishedBrass);
    const spoke2 = spoke1.clone();
    spoke2.rotation.x = Math.PI / 2;
    wGroup.add(spoke1, spoke2);

    return wGroup;
  }

  // Build Trailing Enchanted Passenger Carriage
  buildPassengerWagon() {
    // 1. Chassis
    const chassis = new THREE.Mesh(
      new THREE.BoxGeometry(1.62, 0.2, 3.6),
      this.mats.darkIron
    );
    chassis.position.y = 0.5;
    this.wagonBody.add(chassis);

    // 2. Main Coach Body (Royal Crimson & Midnight Blue)
    const coach = new THREE.Mesh(
      new THREE.BoxGeometry(1.58, 1.32, 3.3),
      this.mats.royalRed
    );
    coach.position.y = 1.26;
    coach.castShadow = true;
    coach.receiveShadow = true;
    this.wagonBody.add(coach);

    // Gold Belt Line
    const belt = new THREE.Mesh(
      new THREE.BoxGeometry(1.62, 0.08, 3.34),
      this.mats.polishedBrass
    );
    belt.position.y = 1.1;
    this.wagonBody.add(belt);

    // 3. Warm Lit Passenger Windows (4 windows per side)
    [-0.95, -0.32, 0.32, 0.95].forEach(zPos => {
      const winPane = new THREE.Mesh(
        new THREE.BoxGeometry(1.62, 0.48, 0.42),
        this.mats.warmWindow
      );
      winPane.position.set(0, 1.38, zPos);
      this.wagonBody.add(winPane);
    });

    // 4. Clerestory Arched Roof (Classic Pullman / Orient Express style)
    const mainRoof = new THREE.Mesh(
      new THREE.BoxGeometry(1.68, 0.14, 3.55),
      this.mats.midnightBlue
    );
    mainRoof.position.y = 1.95;

    const topLanternRoof = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.22, 3.1),
      this.mats.darkIron
    );
    topLanternRoof.position.y = 2.1;

    this.wagonBody.add(mainRoof, topLanternRoof);

    // Warm interior point light casting glow onto the tracks
    const coachLight = new THREE.PointLight(0xffedd5, 1.1, 10);
    coachLight.position.set(0, 1.5, 0);
    this.wagonBody.add(coachLight);

    // 5. Passenger Wagon Wheels (4 wheels)
    [-1.1, 1.1].forEach(zPos => {
      [-0.65, 0.65].forEach(xPos => {
        const w = this.createDetailedWheel(0.32);
        w.position.set(xPos, 0.32, zPos);
        this.wagonWheels.push(w);
        this.wagonGroup.add(w);
      });
    });
  }

  // Puffing Soft Volumetric Steam from Chimney
  createSteamCloudTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Multi-lobe soft cloud puff
    const lobes = [
      { x: 64, y: 64, r: 50, a: 0.45 },
      { x: 48, y: 58, r: 38, a: 0.35 },
      { x: 80, y: 60, r: 38, a: 0.35 },
      { x: 64, y: 46, r: 36, a: 0.35 },
      { x: 64, y: 78, r: 36, a: 0.30 }
    ];
    lobes.forEach(l => {
      const g = ctx.createRadialGradient(l.x, l.y, 4, l.x, l.y, l.r);
      g.addColorStop(0.0, `rgba(255, 250, 245, ${l.a})`);
      g.addColorStop(0.5, `rgba(235, 225, 250, ${l.a * 0.55})`);
      g.addColorStop(1.0, 'rgba(200, 190, 230, 0.0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(l.x, l.y, l.r, 0, Math.PI * 2);
      ctx.fill();
    });

    return new THREE.CanvasTexture(canvas);
  }

  setupSmokeSystem() {
    const steamTex = this.createSteamCloudTexture();
    for (let i = 0; i < 32; i++) {
      const mat = new THREE.SpriteMaterial({
        map: steamTex,
        color: 0xfef3c7,
        transparent: true,
        opacity: 0.0,
        depthWrite: false
      });
      const sprite = new THREE.Sprite(mat);
      sprite.visible = false;
      this.smokeGroup.add(sprite);
      this.smokePuffs.push({
        mesh: sprite,
        active: false,
        age: 0,
        maxAge: 1.5,
        vel: new THREE.Vector3()
      });
    }
  }

  spawnSmokePuff(worldPos, speed) {
    const puff = this.smokePuffs.find(p => !p.active);
    if (!puff) return;

    puff.active = true;
    puff.age = 0;
    puff.maxAge = 1.2 + Math.random() * 0.6;
    puff.mesh.visible = true;
    puff.mesh.position.copy(worldPos);
    
    const initScale = 0.85;
    puff.mesh.scale.set(initScale, initScale, 1);
    puff.mesh.material.opacity = 0.55;

    puff.vel.set(
      (Math.random() - 0.5) * 1.8,
      2.8 + Math.random() * 2.0 + speed * 0.04,
      (Math.random() - 0.5) * 1.8
    );
  }

  updateSmoke(dt, speed) {
    this.smokeTimer += dt * (1.2 + speed * 0.22);
    if (this.smokeTimer >= 0.13 && !this.derailed) {
      this.smokeTimer = 0;
      const stackLocal = new THREE.Vector3(0, 2.28, 1.55);
      stackLocal.applyMatrix4(this.group.matrixWorld);
      this.spawnSmokePuff(stackLocal, speed);
    }

    for (let i = 0; i < this.smokePuffs.length; i++) {
      const p = this.smokePuffs[i];
      if (!p.active) continue;

      p.age += dt;
      if (p.age >= p.maxAge) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }

      const t = p.age / p.maxAge;
      p.mesh.position.addScaledVector(p.vel, dt);

      const s = 0.85 + t * 2.8;
      p.mesh.scale.set(s, s * 0.9, 1);
      p.mesh.material.opacity = Math.sin((1.0 - t) * Math.PI * 0.5) * 0.5;
    }
  }

  setupSparkParticles() {
    const pCount = 80;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(pCount * 3);
    const colors = new Float32Array(pCount * 3);

    for (let i = 0; i < pCount; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 1.4;
      positions[i * 3 + 1] = 0.1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2.2;

      colors[i * 3 + 0] = 1.0;
      colors[i * 3 + 1] = 0.5 + Math.random() * 0.5;
      colors[i * 3 + 2] = 0.1;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Soft circular dot texture so wheel sparks are never square
    const c = document.createElement('canvas');
    c.width = 32;
    c.height = 32;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(16, 16, 1, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 32, 32);
    const dotTex = new THREE.CanvasTexture(c);

    const pMat = new THREE.PointsMaterial({
      size: 0.32,
      map: dotTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.sparkParticles = new THREE.Points(geom, pMat);
    this.group.add(this.sparkParticles);
  }

  // Update locomotive and trailing passenger wagon on the spline
  updateOnTrack(pt, tangent, normal, right, speed, rollAngle, isSparks, activeCurve = null, currentU = null) {
    if (this.derailed) return;

    // 1. Position Locomotive on top of rails
    this.group.position.copy(pt).addScaledVector(normal, 0.14);

    const m = new THREE.Matrix4().makeBasis(right, normal, tangent);
    this.group.rotation.setFromRotationMatrix(m);

    // Smooth centrifugal banking tilt
    this.currentRoll = THREE.MathUtils.lerp(this.currentRoll, rollAngle, 0.15);
    this.bodyMesh.rotation.z = this.currentRoll;

    // 2. Spin Wheels & Animate Steam Pistons
    const wheelAngleDelta = speed * 0.065;
    this.wheelAngle += wheelAngleDelta;
    this.wheels.forEach(w => {
      w.rotation.x += wheelAngleDelta;
    });

    this.pistonRods.forEach(rod => {
      const crankOffset = Math.sin(this.wheelAngle + (rod.side > 0 ? 0 : Math.PI)) * 0.22;
      const verticalOffset = Math.cos(this.wheelAngle + (rod.side > 0 ? 0 : Math.PI)) * 0.09;
      rod.mesh.position.z = 0.1 + crankOffset;
      rod.mesh.position.y = 0.4 + verticalOffset;
    });

    // 3. Position Trailing Passenger Wagon along the curve behind the locomotive
    if (activeCurve && currentU !== null) {
      const curveLen = activeCurve.getLength();
      const wagonOffsetDist = 4.35; // Distance behind locomotive
      const wagonU = Math.max(0.0001, currentU - (wagonOffsetDist / curveLen));
      const wPt = activeCurve.getPointAt(wagonU);
      const wTan = activeCurve.getTangentAt(wagonU).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const wRight = new THREE.Vector3().crossVectors(up, wTan).normalize();
      const wNorm = new THREE.Vector3().crossVectors(wTan, wRight).normalize();

      this.wagonGroup.position.copy(wPt).addScaledVector(wNorm, 0.14);
      const wMat = new THREE.Matrix4().makeBasis(wRight, wNorm, wTan);
      this.wagonGroup.rotation.setFromRotationMatrix(wMat);
      this.wagonBody.rotation.z = this.currentRoll * 0.85;
    } else {
      // Fallback straight behind locomotive
      const wPt = pt.clone().addScaledVector(tangent, -4.35).addScaledVector(normal, 0.14);
      this.wagonGroup.position.copy(wPt);
      this.wagonGroup.rotation.copy(this.group.rotation);
      this.wagonBody.rotation.z = this.currentRoll * 0.85;
    }

    this.wagonWheels.forEach(w => {
      w.rotation.x += wheelAngleDelta;
    });

    // 4. Update Puffing Chimney Smoke
    this.updateSmoke(0.016, speed);

    // 5. Update Wheel Sparks
    if (this.sparkParticles) {
      if (isSparks) {
        this.sparkParticles.material.opacity = 0.9;
        const pos = this.sparkParticles.geometry.attributes.position.array;
        for (let i = 0; i < pos.length; i += 3) {
          pos[i + 0] += (Math.random() - 0.5) * 0.25;
          pos[i + 1] = 0.1 + Math.random() * 0.35;
          pos[i + 2] = -1.2 - Math.random() * 1.5;
        }
        this.sparkParticles.geometry.attributes.position.needsUpdate = true;
      } else {
        this.sparkParticles.material.opacity = 0.0;
      }
    }
  }

  triggerDerailment(forwardVelocity, outwardForceVector) {
    if (this.derailed) return;
    this.derailed = true;

    this.velocity.copy(forwardVelocity).add(outwardForceVector);
    this.velocity.y += 4.5;

    this.wagonVelocity.copy(forwardVelocity).addScaledVector(outwardForceVector, 0.85);
    this.wagonVelocity.y += 3.5;

    this.angularVelocity.set(
      (Math.random() - 0.5) * 5.0,
      (Math.random() - 0.5) * 5.0,
      (Math.random() > 0.5 ? 4.5 : -4.5)
    );

    this.wagonAngularVelocity.set(
      (Math.random() - 0.5) * 4.5,
      (Math.random() - 0.5) * 4.5,
      (Math.random() > 0.5 ? -4.0 : 4.0)
    );
  }

  updateFallPhysics(dt) {
    if (!this.derailed) return;

    this.velocity.y -= 28 * dt;
    this.group.position.addScaledVector(this.velocity, dt);
    this.group.rotation.x += this.angularVelocity.x * dt;
    this.group.rotation.y += this.angularVelocity.y * dt;
    this.group.rotation.z += this.angularVelocity.z * dt;

    this.wagonVelocity.y -= 28 * dt;
    this.wagonGroup.position.addScaledVector(this.wagonVelocity, dt);
    this.wagonGroup.rotation.x += this.wagonAngularVelocity.x * dt;
    this.wagonGroup.rotation.y += this.wagonAngularVelocity.y * dt;
    this.wagonGroup.rotation.z += this.wagonAngularVelocity.z * dt;
  }

  reset(startPt, normal) {
    this.derailed = false;
    this.velocity.set(0, 0, 0);
    this.angularVelocity.set(0, 0, 0);
    this.wagonVelocity.set(0, 0, 0);
    this.wagonAngularVelocity.set(0, 0, 0);
    this.currentRoll = 0;
    
    const mountPt = normal ? startPt.clone().addScaledVector(normal, 0.14) : startPt;
    this.group.position.copy(mountPt);
    this.group.rotation.set(0, 0, 0);
    this.bodyMesh.rotation.set(0, 0, 0);

    this.wagonGroup.position.copy(mountPt).add(new THREE.Vector3(0, 0, -4.35));
    this.wagonGroup.rotation.set(0, 0, 0);
    this.wagonBody.rotation.set(0, 0, 0);

    if (this.sparkParticles) {
      this.sparkParticles.material.opacity = 0.0;
    }
    this.smokePuffs.forEach(p => {
      p.active = false;
      p.mesh.visible = false;
    });
  }
}

window.TrainCart = TrainCart;
