// Main Game Controller with Extended Branch Driving, Soaring Flight & Reconnect Quiz
class Game {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.scene = null;
    this.camera = null;
    this.renderer = null;

    // Components
    this.audio = new AudioManager();
    this.track = null;
    this.cart = null;

    // Physics parameters
    this.distance = 0;
    this.speed = 0;
    this.maxSpeed = 65;
    this.acceleration = 22;
    this.brakeForce = 54;
    this.dragCoeff = 0.07;
    this.gravity = 25;

    // Derailment thresholds
    this.maxSafeGForce = 2.5;
    this.warningGForce = 1.35;
    this.dangerTime = 0;
    this.maxDangerTime = 0.65;

    // 5-Station Checkpoint System
    this.checkpoints = [
      { u: 0.18, gateIdx: 0, passed: false, badge: "🚩 1. İSTASYON (1/5)" },
      { u: 0.36, gateIdx: 1, passed: false, badge: "🚩 2. İSTASYON (2/5)" },
      { u: 0.54, gateIdx: 2, passed: false, badge: "🚩 3. İSTASYON (3/5)" },
      { u: 0.74, gateIdx: 3, passed: false, badge: "🚩 4. İSTASYON (4/5)" },
      { u: 0.992, gateIdx: 4, passed: false, badge: "🏆 5. İSTASYON: BÜYÜK TERMİNAL (5/5)" }
    ];
    this.currentCheckpointIdx = 0;

    // Branching & Flight State
    this.isBranching = false;
    this.currentBranch = null;
    this.branchDistance = 0;
    this.stationAttempt = 1;
    this.disabledOptions = [];
    this.savedSpeedBeforeStation = 24;

    // Book Presets & Data
    this.presets = this.getPresets();
    this.bookData = this.loadBookData();

    // Camera modes
    this.cameraModes = ['chase', 'cockpit'];
    this.currentCamModeIdx = 0;
    this.cameraShake = 0;

    // Input state
    this.input = { gas: false, brake: false };

    // Game state: READY, PLAYING, AT_STATION, ON_BRANCH, FLYING_AIR, JUMP_SUSPENDED, JUMP_LANDING, DERAILED, FINISHED
    this.gameState = 'READY';
    this.stats = { maxSpeedKmh: 0 };

    // UI Cache
    this.ui = {
      speedText: document.getElementById('speed-text'),
      speedGaugeFill: document.getElementById('speed-gauge-fill'),
      gforceFill: document.getElementById('gforce-fill'),
      dangerWarning: document.getElementById('danger-warning'),
      progressBarFill: document.getElementById('progress-bar-fill'),
      progressCartIcon: document.getElementById('progress-cart-icon'),
      currentBookLabel: document.getElementById('current-book-label'),
      
      // Station Modal
      stationModal: document.getElementById('station-modal'),
      modalStationBadge: document.getElementById('modal-station-badge'),
      modalBookTitle: document.getElementById('modal-book-title'),
      modalQuestionText: document.getElementById('modal-question-text'),
      modalOptionsContainer: document.getElementById('modal-options-container'),
      modalHintBox: document.getElementById('modal-hint-box'),
      modalHintText: document.getElementById('modal-hint-text'),

      // Editor Modal
      editorModal: document.getElementById('editor-modal'),
      btnOpenEditor: document.getElementById('btn-open-editor'),
      btnCloseEditor: document.getElementById('btn-close-editor'),
      btnSaveQuestions: document.getElementById('btn-save-questions'),
      selectPreset: document.getElementById('select-preset'),
      inputBookTitle: document.getElementById('input-book-title'),

      // Game Over / Win Modal
      gameModal: document.getElementById('game-modal'),
      modalTitle: document.getElementById('modal-title'),
      modalDesc: document.getElementById('modal-desc'),
      statMaxSpeed: document.getElementById('stat-max-speed'),
      statProgress: document.getElementById('stat-progress'),
      btnRestart: document.getElementById('btn-restart')
    };

    this.init();
  }

  getPresets() {
    return {
      "genel_kultur": {
        title: "Genel Kültür & Bilim",
        questions: [
          {
            q: "Güneş sistemimizde etrafında belirgin ve görkemli buz halkaları bulunan en ünlü gezegen hangisidir?",
            opts: ["Mars", "Satürn", "Merkür", "Venüs"],
            correct: 1,
            hint: "Halkalarıyla ünlü dev gezegeni hatırla!"
          },
          {
            q: "Dünya üzerindeki yüzölçümü en büyük olan okyanus aşağıdakilerden hangisidir?",
            opts: ["Atlas Okyanusu", "Hint Okyanusu", "Büyük Okyanus (Pasifik)", "Arktik Okyanusu"],
            correct: 2,
            hint: "Adından da anlaşılacağı gibi en büyük olan okyanus!"
          },
          {
            q: "Pusula, kağıt ve matbaayı tarihte ilk kez geliştirerek dünya medeniyetine kazandıran uygarlık hangisidir?",
            opts: ["Çin Uygarlığı", "Roma İmparatorluğu", "Aztekler", "Vikingler"],
            correct: 0,
            hint: "Uzak Doğu'nun köklü uygarlığını düşün."
          },
          {
            q: "Doğada bilinen en sert doğal madde ve değerli taş aşağıdakilerden hangisidir?",
            opts: ["Gümüş", "Elmas", "Bakır", "Mermer"],
            correct: 1,
            hint: "Camı bile kesebilen, karbonun kristalleşmiş en sert hali!"
          },
          {
            q: "Gökkuşağının tam ortasında yer alan ve doğanın da simgesi olan renk hangisidir?",
            opts: ["Siyah", "Kahverengi", "Yeşil", "Gri"],
            correct: 2,
            hint: "Kırmızı, turuncu, sarıdan hemen sonra gelen doğa rengi!"
          }
        ]
      },
      "cografya_dunya": {
        title: "Türkiye & Dünya Coğrafyası",
        questions: [
          {
            q: "Türkiye'nin en yüksek dağı olan Ağrı Dağı (5.137 m) hangi coğrafi bölgemizde yer alır?",
            opts: ["Karadeniz Bölgesi", "Doğu Anadolu Bölgesi", "Akdeniz Bölgesi", "İç Anadolu Bölgesi"],
            correct: 1,
            hint: "Ülkemizin en doğusundaki yüksek dağlık bölgemiz."
          },
          {
            q: "Peri bacaları, yer altı şehirleri ve sıcak hava balonlarıyla ünlü Kapadokya bölgesi ağırlıklı olarak hangi ilimizdedir?",
            opts: ["İzmir", "Trabzon", "Nevşehir", "Antalya"],
            correct: 2,
            hint: "Ürgüp, Göreme ve Avanos ilçelerinin bulunduğu İç Anadolu ilimiz."
          },
          {
            q: "Asya ile Avrupa kıtalarını deniz yoluyla birbirine bağlayan iki önemli boğazımız hangileridir?",
            opts: ["İstanbul ve Çanakkale Boğazları", "Cebelitarık ve Süveyş Boğazları", "Hürmüz ve Babülmendep Boğazları", "Bering ve Macellan Boğazları"],
            correct: 0,
            hint: "Marmara Denizi'nin iki ucundaki boğazlarımız!"
          },
          {
            q: "Dünyanın en yüksek zirvesi olan Everest Tepesi (8.848 m) hangi sıradağlar üzerinde bulunur?",
            opts: ["Alpler", "Himalaya Dağları", "And Dağları", "Toros Dağları"],
            correct: 1,
            hint: "Asya kıtasında yer alan dünyanın çatısı!"
          },
          {
            q: "Üç tarafı denizlerle çevrili olan Türkiye'nin kuzeyinde hangi deniz yer alır?",
            opts: ["Ege Denizi", "Akdeniz", "Karadeniz", "Kızıldeniz"],
            correct: 2,
            hint: "Kuzey kıyılarımızdaki dalgalı ve bereketli denizimiz."
          }
        ]
      },
      "uzay_doga": {
        title: "Uzay, Bilim & Doğa Harikaları",
        questions: [
          {
            q: "Yeşil bitkilerin güneş ışığını kullanarak kendi besinlerini ve doğaya oksijen üretmesi olayına ne ad verilir?",
            opts: ["Buharlaşma", "Fotosentez", "Yerçekimi", "Metamorfoz"],
            correct: 1,
            hint: "'Foto' (ışık) ve 'sentez' (birleştirme) kelimelerinden oluşur."
          },
          {
            q: "1969 yılında Apollo 11 göreviyle Dünya'nın doğal uydusu olan Ay'a ilk kez ayak basan astronot kimdir?",
            opts: ["Yuri Gagarin", "Galileo Galilei", "Neil Armstrong", "Isaac Newton"],
            correct: 2,
            hint: "'İnsan için küçük, insanlık için büyük bir adım' sözüyle tanınır."
          },
          {
            q: "Saatte yaklaşık 110 km hıza ulaşabilen, karada yaşayan en hızlı hayvan aşağıdakilerden hangisidir?",
            opts: ["Çita", "Aslan", "Zürafa", "Boz Ayı"],
            correct: 0,
            hint: "Benekli kürküyle bilinen çevik büyük kedi."
          },
          {
            q: "Suyun deniz seviyesinde kaynama sıcaklığı kaç santigrat derecedir?",
            opts: ["50 °C", "100 °C", "0 °C", "25 °C"],
            correct: 1,
            hint: "Termometrenin en bilinen tam yüzlük noktası!"
          },
          {
            q: "Güneş sistemimizde 'Kızıl Gezegen' olarak da adlandırılan komşu gezegenimiz hangisidir?",
            opts: ["Neptün", "Jüpiter", "Mars", "Uranüs"],
            correct: 2,
            hint: "Yüzeyindeki demir oksitten dolayı kızıl görünen gezegen."
          }
        ]
      },
      "tarih_kesifler": {
        title: "Tarih, İcatlar & Sanat",
        questions: [
          {
            q: "Tarihte çivi yazısını icat ederek yazılı tarihi başlatan ilk Mezopotamya uygarlığı hangisidir?",
            opts: ["Sümerler", "Frigler", "İyonlar", "Lidyalılar"],
            correct: 0,
            hint: "Tekerleği ve çivi yazısını bulan Mezopotamya uygarlığı."
          },
          {
            q: "Dünyaca ünlü 'Mona Lisa' tablosunu yapan Rönesans dönemi ressamı, mucidi ve bilim insanı kimdir?",
            opts: ["Pablo Picasso", "Vincent van Gogh", "Leonardo da Vinci", "Salvador Dalí"],
            correct: 2,
            hint: "Hem ressam hem de uçan makineler tasarlayan İtalyan deha!"
          },
          {
            q: "Telefonu icat ederek uzak mesafeler arasında sesli iletişimi başlatan bilim insanı kimdir?",
            opts: ["Alexander Graham Bell", "Albert Einstein", "Marie Curie", "Louis Pasteur"],
            correct: 0,
            hint: "Soyadı İngilizcede 'zil' (Bell) anlamına gelir."
          },
          {
            q: "Şanlıurfa'da bulunan ve bilinen en eski anıtsal tapınak yerleşimi olarak kabul edilen tarihi alan hangisidir?",
            opts: ["Efes Antik Kenti", "Göbeklitepe", "Sümela Manastırı", "Aspendos Tiyatrosu"],
            correct: 1,
            hint: "Tarihin sıfır noktası olarak anılan Şanlıurfa'daki ören yeri."
          },
          {
            q: "Tarihte madeni parayı ilk kez basarak ticarette takas usulüne son veren Anadolu uygarlığı hangisidir?",
            opts: ["Hititler", "Urartular", "Lidyalılar", "Babiller"],
            correct: 2,
            hint: "Kral Yolu ve Sardes şehriyle bilinen Batı Anadolu uygarlığı."
          }
        ]
      }
    };
  }

  loadBookData() {
    const saved = localStorage.getItem('rail_general_knowledge_5q_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.questions && parsed.questions.length === 5) return parsed;
      } catch (e) {}
    }
    return this.presets["genel_kultur"];
  }

  saveBookData(data) {
    this.bookData = data;
    localStorage.setItem('rail_general_knowledge_5q_v1', JSON.stringify(data));
    this.ui.currentBookLabel.innerHTML = `Kategori: <strong>${data.title}</strong>`;
  }

  init() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xbae6fd);
    // Fresh, airy sky mist
    this.scene.fog = new THREE.FogExp2(0xdbeafe, 0.0010);

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 4000);
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.container.appendChild(this.renderer.domElement);

    this.setupLighting();

    this.track = new TrackBuilder(this.scene);
    this.track.build();

    this.cart = new TrainCart(this.scene);

    this.resetGame();
    this.setupEventListeners();
    this.setupEditorUI();

    this.lastTime = performance.now();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setupLighting() {
    // Fresh, soft daylight ambient light
    const ambient = new THREE.AmbientLight(0xf8fafc, 0.78);
    this.scene.add(ambient);

    // Warm Morning Sun Light (aligned with the horizon sun ahead)
    const sun = new THREE.DirectionalLight(0xfffbeb, 1.35);
    sun.position.set(35, 160, 420);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 10;
    sun.shadow.camera.far = 900;
    sun.shadow.camera.left = -160;
    sun.shadow.camera.right = 160;
    sun.shadow.camera.top = 160;
    sun.shadow.camera.bottom = -160;
    this.scene.add(sun);

    // Airy sky-blue to soft limestone bounce fill light
    const fillLight = new THREE.HemisphereLight(0xe0f2fe, 0xe2e8f0, 0.65);
    this.scene.add(fillLight);
  }

  setupEventListeners() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    window.addEventListener('keydown', (e) => {
      this.audio.init();

      if (e.code === 'KeyW' || e.code === 'ArrowUp') {
        this.input.gas = true;
        if (this.gameState === 'READY') this.gameState = 'PLAYING';
      }
      if (e.code === 'KeyS' || e.code === 'ArrowDown') {
        this.input.brake = true;
      }
      if (e.code === 'KeyR') {
        this.resetGame();
      }
      if (e.code === 'KeyC') {
        this.currentCamModeIdx = (this.currentCamModeIdx + 1) % this.cameraModes.length;
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') this.input.gas = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') this.input.brake = false;
    });

    const btnGas = document.getElementById('btn-gas');
    const btnBrake = document.getElementById('btn-brake');

    const handleGasStart = (e) => {
      e.preventDefault();
      this.audio.init();
      this.input.gas = true;
      if (this.gameState === 'READY') this.gameState = 'PLAYING';
    };
    const handleGasEnd = (e) => { e.preventDefault(); this.input.gas = false; };

    btnGas.addEventListener('touchstart', handleGasStart);
    btnGas.addEventListener('touchend', handleGasEnd);
    btnGas.addEventListener('mousedown', handleGasStart);
    btnGas.addEventListener('mouseup', handleGasEnd);

    const handleBrakeStart = (e) => { e.preventDefault(); this.audio.init(); this.input.brake = true; };
    const handleBrakeEnd = (e) => { e.preventDefault(); this.input.brake = false; };

    btnBrake.addEventListener('touchstart', handleBrakeStart);
    btnBrake.addEventListener('touchend', handleBrakeEnd);
    btnBrake.addEventListener('mousedown', handleBrakeStart);
    btnBrake.addEventListener('mouseup', handleBrakeEnd);

    window.addEventListener('pointerdown', () => this.audio.init(), { once: true });
    this.ui.btnRestart.addEventListener('click', () => this.resetGame());
  }

  setupEditorUI() {
    this.ui.currentBookLabel.innerHTML = `Kategori: <strong>${this.bookData.title}</strong>`;
    
    this.ui.btnOpenEditor.addEventListener('click', () => {
      this.populateEditorFields(this.bookData);
      this.ui.editorModal.classList.remove('hidden');
    });

    this.ui.btnCloseEditor.addEventListener('click', () => {
      this.ui.editorModal.classList.add('hidden');
    });

    this.ui.selectPreset.addEventListener('change', (e) => {
      const presetKey = e.target.value;
      if (this.presets[presetKey]) {
        this.populateEditorFields(this.presets[presetKey]);
      }
    });

    this.ui.btnSaveQuestions.addEventListener('click', () => {
      const title = this.ui.inputBookTitle.value.trim() || "Kitap Macerası";
      const questions = [];

      for (let i = 1; i <= 5; i++) {
        const qText = document.getElementById(`input-q${i}-text`).value.trim();
        const opts = [
          document.getElementById(`input-q${i}-opt0`).value.trim(),
          document.getElementById(`input-q${i}-opt1`).value.trim(),
          document.getElementById(`input-q${i}-opt2`).value.trim(),
          document.getElementById(`input-q${i}-opt3`).value.trim()
        ];
        const correctRadio = document.querySelector(`input[name="q${i}-correct"]:checked`);
        const correctIdx = correctRadio ? parseInt(correctRadio.value) : 0;

        questions.push({
          q: qText,
          opts: opts,
          correct: correctIdx,
          hint: "Seçenekleri dikkatlice karşılaştır!"
        });
      }

      const updated = { title, questions };
      this.saveBookData(updated);
      this.ui.editorModal.classList.add('hidden');
      this.resetGame();
    });
  }

  populateEditorFields(data) {
    this.ui.inputBookTitle.value = data.title;
    for (let i = 0; i < 5; i++) {
      const q = data.questions[i];
      if (q) {
        document.getElementById(`input-q${i+1}-text`).value = q.q;
        document.getElementById(`input-q${i+1}-opt0`).value = q.opts[0] || "";
        document.getElementById(`input-q${i+1}-opt1`).value = q.opts[1] || "";
        document.getElementById(`input-q${i+1}-opt2`).value = q.opts[2] || "";
        document.getElementById(`input-q${i+1}-opt3`).value = q.opts[3] || "";
        
        const radio = document.querySelector(`input[name="q${i+1}-correct"][value="${q.correct}"]`);
        if (radio) radio.checked = true;
      }
    }
  }

  resetGame() {
    this.distance = 0;
    this.speed = 0;
    this.dangerTime = 0;
    this.gameState = 'READY';
    this.stats.maxSpeedKmh = 0;
    this.cameraShake = 0;

    // Reset branching & flight state
    this.isBranching = false;
    this.currentBranch = null;
    this.branchDistance = 0;
    this.stationAttempt = 1;
    this.disabledOptions = [];
    this.savedSpeedBeforeStation = 24;

    // Reset station checkpoints and 3D gates
    this.checkpoints.forEach((cp, idx) => {
      cp.passed = false;
      this.track.setGateOpen(idx, false);
    });
    this.currentCheckpointIdx = 0;

    const startPt = this.track.curve.getPointAt(0);
    const tangent = this.track.curve.getTangentAt(0).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(up, tangent).normalize();
    const normal = new THREE.Vector3().crossVectors(tangent, right).normalize();

    this.cart.reset(startPt, normal);

    this.ui.gameModal.classList.add('hidden');
    this.ui.stationModal.classList.add('hidden');
    this.ui.dangerWarning.classList.add('hidden');
    this.updateHUD(0, 0, 0);

    this.camera.position.copy(startPt)
      .addScaledVector(tangent, -11)
      .addScaledVector(normal, 4.2);
    this.camera.lookAt(startPt.clone().addScaledVector(normal, 1.2));
  }

  animate(now) {
    requestAnimationFrame(this.animate);
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;

    if (this.track) {
      this.track.updateGates(dt);
      this.track.updateClouds(now * 0.001, dt);
    }

    if (this.gameState === 'PLAYING' || this.gameState === 'READY') {
      this.updatePhysics(dt);
    } else if (this.gameState === 'ON_BRANCH') {
      this.updateBranchPhysics(dt);
    } else if (this.gameState === 'FLYING_AIR') {
      this.updateFlyingAir(dt, now);
    } else if (this.gameState === 'JUMP_SUSPENDED') {
      this.updateJumpSuspended(dt, now);
    } else if (this.gameState === 'JUMP_LANDING') {
      this.updateJumpLanding(dt);
    } else if (this.gameState === 'AT_STATION') {
      this.updateStationStop(dt);
    } else if (this.gameState === 'DERAILED') {
      this.cart.updateFallPhysics(dt);
      this.updateDerailedCamera(dt);
    }

    this.renderer.render(this.scene, this.camera);
  }

  updatePhysics(dt) {
    const totalLen = this.track.totalLength;
    const u = Math.min(Math.max(this.distance / totalLen, 0.0001), 0.9999);

    const nextCp = this.checkpoints[this.currentCheckpointIdx];
    if (nextCp && !nextCp.passed) {
      const distToGate = (nextCp.u * totalLen) - this.distance;
      if (distToGate <= 4.0 && distToGate >= -1.0) {
        this.reachStation(nextCp);
        return;
      }
    }

    const pt = this.track.curve.getPointAt(u);
    const tangent = this.track.curve.getTangentAt(u).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(up, tangent).normalize();
    const normal = new THREE.Vector3().crossVectors(tangent, right).normalize();

    const slopeForce = -tangent.y * this.gravity * 0.7;

    let motorForce = 0;
    if (this.input.gas) motorForce += this.acceleration;
    if (this.input.brake) motorForce -= this.brakeForce;

    const dragForce = -this.speed * Math.abs(this.speed) * this.dragCoeff * 0.04;
    const netAccel = motorForce + slopeForce + dragForce;
    this.speed += netAccel * dt;

    if (this.speed < 0) this.speed = 0;
    if (this.speed > this.maxSpeed) this.speed = this.maxSpeed;

    this.distance += this.speed * dt;

    const curvature = this.track.getCurvatureAt(u);
    const centrifugalG = (this.speed * this.speed * curvature) / 9.81;

    const nextTangent = this.track.curve.getTangentAt(Math.min(u + 0.005, 0.999)).normalize();
    const turnCross = new THREE.Vector3().crossVectors(tangent, nextTangent);
    const turnSign = turnCross.y > 0 ? 1 : -1;

    const rollAngle = -turnSign * Math.min(centrifugalG * 0.28, 0.65);

    const isWarning = centrifugalG > this.warningGForce;
    const isOverLimit = centrifugalG > this.maxSafeGForce;

    if (isOverLimit && this.gameState === 'PLAYING') {
      this.dangerTime += dt;
      if (this.dangerTime >= this.maxDangerTime) {
        this.triggerDerail(tangent, right, turnSign);
        return;
      }
    } else {
      this.dangerTime = Math.max(0, this.dangerTime - dt * 3.0);
    }

    if ((isWarning || this.dangerTime > 0) && this.speed > 28) {
      this.ui.dangerWarning.classList.remove('hidden');
      if (Math.random() < 0.12) this.audio.playDangerBeep();
    } else {
      this.ui.dangerWarning.classList.add('hidden');
    }

    const isSparks = (this.input.brake && this.speed > 15) || (centrifugalG > 1.0) || (this.dangerTime > 0);
    this.cart.updateOnTrack(pt, tangent, normal, right, this.speed, rollAngle, isSparks, this.track.curve, u);

    this.updateCamera(pt, tangent, normal, right, dt);

    const speedKmh = Math.round(this.speed * 2.6);
    if (speedKmh > this.stats.maxSpeedKmh) this.stats.maxSpeedKmh = speedKmh;
    this.updateHUD(speedKmh, centrifugalG, u);
    this.audio.update(speedKmh, this.input.brake, centrifugalG / this.maxSafeGForce);
  }

  // Reach station gate & pop question
  reachStation(cp) {
    // Remember the train's speed before stopping at the question barrier
    this.savedSpeedBeforeStation = Math.max(this.speed, 18);
    this.gameState = 'AT_STATION';
    this.speed = 0;
    this.audio.update(0, false, 0);

    this.stationAttempt = 1;
    this.disabledOptions = [];

    this.showStationQuestionModal(cp, false);
  }

  showStationQuestionModal(cp, isRetryAtReconnectPoint) {
    const qData = this.bookData.questions[cp.gateIdx];
    this.ui.modalStationBadge.innerText = isRetryAtReconnectPoint ? "⚡ UÇUŞ SONU: ANA RAYA BAĞLAN!" : cp.badge;
    this.ui.modalBookTitle.innerText = this.bookData.title;
    
    const bannerEl = document.getElementById('modal-banner-text');
    if (isRetryAtReconnectPoint) {
      if (bannerEl) bannerEl.innerText = "✈️ Kesik raydan uçtun! Yan raydan ana raya kaynayarak bağlanmak için doğru şıkkı seç:";
      this.ui.modalQuestionText.innerText = qData ? qData.q : "Soruyu yanıtla:";
    } else {
      if (bannerEl) bannerEl.innerText = "✨ Doğru cevabı seçerek yeşil makastan ana hatta ilerle!";
      this.ui.modalQuestionText.innerText = qData ? qData.q : "Soruyu yanıtla:";
    }

    this.ui.modalHintBox.classList.add('hidden');
    this.ui.modalOptionsContainer.innerHTML = '';

    const letters = ['A', 'B', 'C', 'D'];
    const opts = qData ? qData.opts : ["Evet", "Hayır", "Belki", "Fikrim yok"];
    const correctIdx = qData ? qData.correct : 0;

    opts.forEach((optText, idx) => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      
      if (this.disabledOptions.includes(idx)) {
        btn.classList.add('wrong');
        btn.style.opacity = '0.35';
        btn.style.pointerEvents = 'none';
        btn.innerHTML = `<span class="choice-letter">${letters[idx]}</span><span class="choice-text" style="text-decoration:line-through;">${optText} ❌</span>`;
        this.ui.modalOptionsContainer.appendChild(btn);
        return;
      }

      btn.innerHTML = `
        <span class="choice-letter">${letters[idx]}</span>
        <span class="choice-text">${optText}</span>
      `;

      btn.addEventListener('click', () => {
        if (idx === correctIdx) {
          // CORRECT ANSWER!
          btn.classList.add('correct');
          btn.innerHTML += ' <span style="margin-left:auto; font-size:18px;">✅ DOĞRU!</span>';
          this.audio.playSuccessChime();
          setTimeout(() => this.audio.playTrainWhistle(), 250);

          const allBtns = this.ui.modalOptionsContainer.querySelectorAll('.choice-btn');
          allBtns.forEach(b => b.style.pointerEvents = 'none');

          setTimeout(() => {
            // ALWAYS CLOSE THE MODAL CLEANLY!
            this.ui.stationModal.classList.add('hidden');

            if (isRetryAtReconnectPoint) {
              // Touch down onto reconnect rails!
              this.touchDownAndReconnect();
            } else {
              // Correct on 1st try: continue on main track!
              this.passCurrentStationMainTrack();
            }
          }, 700);

        } else {
          // WRONG ANSWER!
          btn.classList.add('wrong');
          this.disabledOptions.push(idx);

          if (!isRetryAtReconnectPoint && cp.gateIdx < 4) {
            // 1st ATTEMPT WRONG -> CLOSE MODAL & PLAYER DRIVES ON THE EXTENDED WRONG BRANCH!
            setTimeout(() => {
              this.ui.stationModal.classList.add('hidden');
              this.divertToBrokenBranch(cp.gateIdx);
            }, 450);
          } else {
            // 2nd ATTEMPT WRONG -> FAIL TO LOCK ONTO RAILS, FALL INTO ABYSS!
            setTimeout(() => {
              this.ui.stationModal.classList.add('hidden');
              this.triggerJumpFailCrash();
            }, 550);
          }
        }
      });

      this.ui.modalOptionsContainer.appendChild(btn);
    });

    this.ui.stationModal.classList.remove('hidden');
  }

  // Answered correct on 1st try -> Continue along main track at the saved speed
  passCurrentStationMainTrack() {
    const cp = this.checkpoints[this.currentCheckpointIdx];
    if (!cp) return;

    cp.passed = true;
    this.ui.stationModal.classList.add('hidden');

    this.track.setGateOpen(cp.gateIdx, true);
    this.currentCheckpointIdx++;

    if (cp.gateIdx === 4) {
      setTimeout(() => this.triggerFinish(), 1000);
    } else {
      this.gameState = 'PLAYING';
      this.speed = this.savedSpeedBeforeStation || 22;
      this.audio.update(Math.round(this.speed * 2.6), false, 0);
    }
  }

  // Wrong answer on 1st try -> Divert to the wrong branch at the saved speed!
  divertToBrokenBranch(gateIdx) {
    const branch = this.track.branches[gateIdx];
    if (!branch) {
      this.passCurrentStationMainTrack();
      return;
    }

    this.isBranching = true;
    this.currentBranch = branch;
    this.branchDistance = 0;
    this.gameState = 'ON_BRANCH';
    this.speed = this.savedSpeedBeforeStation || 22; // Continue at the speed before stopping!

    this.audio.playDangerBeep();
    this.audio.update(Math.round(this.speed * 2.6), false, 0.25);
  }

  // PLAYER DRIVES ALONG THE EXTENDED WRONG BRANCH UNDER MANUAL CONTROL!
  updateBranchPhysics(dt) {
    const branch = this.currentBranch;
    const branchLen = branch.length;
    const jumpDist = branch.jumpU * branchLen;

    // Player can accelerate (W) or brake (S)
    let motorForce = 0;
    if (this.input.gas) motorForce += this.acceleration;
    if (this.input.brake) motorForce -= this.brakeForce;

    const netAccel = motorForce - this.speed * 0.025;
    this.speed += netAccel * dt;

    if (this.speed < 8) this.speed = 8; // Keep forward rolling momentum
    if (this.speed > this.maxSpeed) this.speed = this.maxSpeed;

    this.branchDistance += this.speed * dt;

    const u = Math.min(this.branchDistance / branchLen, branch.jumpU);
    const pt = branch.curve.getPointAt(u);
    const tangent = branch.curve.getTangentAt(u).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(up, tangent).normalize();
    const normal = new THREE.Vector3().crossVectors(tangent, right).normalize();

    this.cart.updateOnTrack(pt, tangent, normal, right, this.speed, 0, this.speed > 25, branch.curve, u);
    this.updateCamera(pt, tangent, normal, right, dt);

    const speedKmh = Math.round(this.speed * 2.6);
    if (speedKmh > this.stats.maxSpeedKmh) this.stats.maxSpeedKmh = speedKmh;
    const mainProgress = this.distance / this.track.totalLength;
    this.updateHUD(speedKmh, 0.35, mainProgress);
    this.audio.update(speedKmh, this.input.brake, 0.35);

    // REACHED THE BROKEN CLIFF EDGE -> LAUNCH INTO AERIAL FLIGHT!
    if (this.branchDistance >= jumpDist) {
      this.launchIntoAerialFlight();
    }
  }

  // Launch into soaring aerial flight across the gap
  launchIntoAerialFlight() {
    this.savedSpeedBeforeStation = Math.max(this.speed, this.savedSpeedBeforeStation || 22);
    this.gameState = 'FLYING_AIR';
    this.audio.playFlightWhoosh(); // Thrilling aerial launch whoosh without cutting engine sound
    this.cameraShake = 1.0;
  }

  // AERIAL FLIGHT EFFECT: Gliding across the gap towards the landing pad!
  updateFlyingAir(dt, now) {
    const branch = this.currentBranch;
    const branchLen = branch.length;
    const landDist = branch.landU * branchLen;

    // Train glides majestically through the air at its carried speed
    const flightSpeed = Math.max(this.speed, this.savedSpeedBeforeStation || 26, 24);
    this.speed = flightSpeed;
    this.branchDistance += flightSpeed * dt;

    const u = Math.min(this.branchDistance / branchLen, branch.landU);
    const pt = branch.curve.getPointAt(u);
    const tangent = branch.curve.getTangentAt(u).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(up, tangent).normalize();
    const normal = new THREE.Vector3().crossVectors(tangent, right).normalize();

    // Flight posture: nose slightly pitched up, wind sparks trailing
    this.cart.updateOnTrack(pt, tangent, normal, right, flightSpeed, 0, true, branch.curve, u);
    this.cart.bodyMesh.rotation.x = -0.15; // Aerodynamic lift tilt

    // Cinematic chase camera following the flight
    this.updateCamera(pt, tangent, normal, right, dt);
    const speedKmh = Math.round(flightSpeed * 2.6);
    this.updateHUD(speedKmh, 0.25, this.distance / this.track.totalLength);
    this.audio.update(speedKmh, false, 0.2);

    // REACHED THE LANDING & RECONNECT POINT -> HOVER AND POP QUESTION MODAL!
    if (this.branchDistance >= landDist - 1.5) {
      this.reachLandingReconnectPoint();
    }
  }

  // Reached the landing pad -> hover and prompt the 2nd chance question!
  reachLandingReconnectPoint() {
    this.savedSpeedBeforeStation = Math.max(this.speed, this.savedSpeedBeforeStation || 22);
    this.gameState = 'JUMP_SUSPENDED';
    this.speed = 0;
    this.audio.update(0, false, 0);

    const cp = this.checkpoints[this.currentCheckpointIdx];
    this.showStationQuestionModal(cp, true);
  }

  // Gentle hovering above the landing pad while answering
  updateJumpSuspended(dt, now) {
    if (!this.currentBranch) return;
    const branch = this.currentBranch;
    const pt = branch.curve.getPointAt(branch.landU);
    const tangent = branch.curve.getTangentAt(branch.landU).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(up, tangent).normalize();
    const normal = new THREE.Vector3().crossVectors(tangent, right).normalize();

    // Soft floating bob over the landing rails
    const hoverPt = pt.clone().addScaledVector(normal, 0.4 + Math.sin(now * 0.006) * 0.15);
    this.cart.updateOnTrack(hoverPt, tangent, normal, right, 0, 0, false);
    this.updateCamera(pt, tangent, normal, right, dt);
  }

  // 2nd Chance CORRECT -> Touch down onto rails and reconnect at the saved speed!
  touchDownAndReconnect() {
    this.gameState = 'JUMP_LANDING';
    this.ui.stationModal.classList.add('hidden'); // Guarantee modal is closed!
    
    const branch = this.currentBranch;
    this.branchDistance = branch.landU * branch.length;
    this.speed = this.savedSpeedBeforeStation || 22; // Resume at the speed before stopping!
    this.audio.update(Math.round(this.speed * 2.6), false, 0.25);
  }

  // Roll down reconnect ramp and merge into main track with full audio & HUD updates
  updateJumpLanding(dt) {
    const branch = this.currentBranch;
    const branchLen = branch.length;

    // Player can accelerate or brake through the landing ramp
    let motorForce = 0;
    if (this.input.gas) motorForce += this.acceleration;
    if (this.input.brake) motorForce -= this.brakeForce;

    this.speed += (motorForce - this.speed * 0.02) * dt;
    if (this.speed < 12) this.speed = 12;
    if (this.speed > this.maxSpeed) this.speed = this.maxSpeed;

    this.branchDistance += this.speed * dt;
    
    const u = Math.min(this.branchDistance / branchLen, 1.0);
    const pt = branch.curve.getPointAt(u);
    const tangent = branch.curve.getTangentAt(u).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(up, tangent).normalize();
    const normal = new THREE.Vector3().crossVectors(tangent, right).normalize();

    this.cart.updateOnTrack(pt, tangent, normal, right, this.speed, 0, false, branch.curve, u);
    this.updateCamera(pt, tangent, normal, right, dt);

    const speedKmh = Math.round(this.speed * 2.6);
    if (speedKmh > this.stats.maxSpeedKmh) this.stats.maxSpeedKmh = speedKmh;
    this.updateHUD(speedKmh, 0.25, branch.rejoinU);
    this.audio.update(speedKmh, this.input.brake, 0.25);

    // RE-MERGE INTO MAIN TRACK!
    if (u >= 0.98) {
      this.isBranching = false;
      this.distance = branch.rejoinU * this.track.totalLength;
      
      const cp = this.checkpoints[this.currentCheckpointIdx];
      cp.passed = true;
      this.track.setGateOpen(cp.gateIdx, true);
      this.currentCheckpointIdx++;

      this.gameState = 'PLAYING';
      this.speed = Math.max(this.speed, this.savedSpeedBeforeStation || 20);
    }
  }

  // 2nd Chance FAILED -> Fall into abyss
  triggerJumpFailCrash() {
    this.gameState = 'DERAILED';
    this.audio.playCrashSound();
    this.cameraShake = 2.5;

    const forwardVel = new THREE.Vector3(0, 2, 15);
    const outwardVel = new THREE.Vector3(0, -12, 0);
    this.cart.triggerDerailment(forwardVel, outwardVel);

    setTimeout(() => {
      this.showModal('RAYLARDAN DÜŞTÜN!', 'İki denemede de doğru yolu bulamadın ve vagon uçuruma yuvarlandı. Kitaba tekrar göz atıp yeniden deneyebilirsin!', 'crash');
    }, 1200);
  }

  updateStationStop(dt) {
    const totalLen = this.track.totalLength;
    const u = Math.min(Math.max(this.distance / totalLen, 0.0001), 0.9999);
    const pt = this.track.curve.getPointAt(u);
    const tangent = this.track.curve.getTangentAt(u).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(up, tangent).normalize();
    const normal = new THREE.Vector3().crossVectors(tangent, right).normalize();

    this.cart.updateOnTrack(pt, tangent, normal, right, 0, 0, false, this.track.curve, u);
    this.updateCamera(pt, tangent, normal, right, dt);
  }

  triggerDerail(tangent, right, turnSign) {
    this.gameState = 'DERAILED';
    this.ui.dangerWarning.classList.add('hidden');
    this.audio.playCrashSound();
    this.cameraShake = 2.0;

    const forwardVel = tangent.clone().multiplyScalar(this.speed);
    const outwardVel = right.clone().multiplyScalar(turnSign * this.speed * 0.85);

    this.cart.triggerDerailment(forwardVel, outwardVel);

    setTimeout(() => {
      this.showModal('RAYDAN ÇIKTI!', 'Viraja çok yüksek hızla girdin ve vagon savruldu! Virajlara yaklaşırken [S / Fren] tuşunu kullan.', 'crash');
    }, 1200);
  }

  triggerFinish() {
    this.gameState = 'FINISHED';
    this.audio.playVictorySound();
    this.speed = 0;
    this.showModal('HARİKA İŞ ÇIKARDIN! 🏆', `Tebrikler! "${this.bookData.title}" paketindeki tüm genel kültür sorularını tamamladın ve treni Gökyüzü Terminaline güvenle ulaştırdın!`, 'victory');
  }

  showModal(title, desc, type) {
    this.ui.modalTitle.innerText = title;
    this.ui.modalDesc.innerText = desc;
    this.ui.statMaxSpeed.innerText = this.stats.maxSpeedKmh;
    this.ui.statProgress.innerText = Math.round((this.distance / this.track.totalLength) * 100) + '%';
    
    const mascotIcon = document.getElementById('modal-mascot-icon');
    if (mascotIcon) {
      mascotIcon.innerText = (type === 'victory') ? '🏆' : '🦉';
    }
    this.ui.gameModal.querySelector('.modal-card').className = 'modal-card ' + type;
    this.ui.gameModal.classList.remove('hidden');
  }

  updateCamera(pt, tangent, normal, right, dt) {
    const camMode = this.cameraModes[this.currentCamModeIdx];
    let targetPos, lookAtPos;

    if (camMode === 'chase') {
      const distBack = 9.5 + (this.speed / this.maxSpeed) * 4.5;
      const heightUp = 3.6 + (this.speed / this.maxSpeed) * 1.2;

      targetPos = pt.clone()
        .addScaledVector(tangent, -distBack)
        .addScaledVector(normal, heightUp);
      
      lookAtPos = pt.clone().addScaledVector(tangent, 12).addScaledVector(normal, 1.2);

      const targetFOV = 60 + (this.speed / this.maxSpeed) * 18;
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFOV, 0.08);
      this.camera.updateProjectionMatrix();

    } else if (camMode === 'cockpit') {
      targetPos = pt.clone().addScaledVector(normal, 1.4).addScaledVector(tangent, 0.4);
      lookAtPos = pt.clone().addScaledVector(tangent, 30).addScaledVector(normal, 1.0);
    }

    this.camera.position.lerp(targetPos, 0.12);

    if (this.cameraShake > 0.01) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShake;
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShake;
      this.cameraShake *= 0.92;
    } else if (this.speed > 55) {
      const rumble = ((this.speed - 55) / 15) * 0.08;
      this.camera.position.x += (Math.random() - 0.5) * rumble;
      this.camera.position.y += (Math.random() - 0.5) * rumble;
    }

    this.camera.lookAt(lookAtPos);
  }

  updateDerailedCamera(dt) {
    const cartPos = this.cart.group.position;
    this.camera.lookAt(cartPos);

    if (this.cameraShake > 0.01) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShake;
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShake;
      this.cameraShake *= 0.94;
    }
  }

  updateHUD(speedKmh, gForce, progressRatio) {
    this.ui.speedText.innerText = speedKmh;
    
    const pct = Math.min((speedKmh / 160) * 100, 100);
    this.ui.speedGaugeFill.style.width = pct + '%';

    const gPct = Math.min((gForce / this.maxSafeGForce) * 100, 100);
    this.ui.gforceFill.style.width = gPct + '%';
    
    if (gForce > this.warningGForce) {
      this.ui.gforceFill.style.backgroundColor = '#ef4444';
    } else if (gForce > 0.8) {
      this.ui.gforceFill.style.backgroundColor = '#facc15';
    } else {
      this.ui.gforceFill.style.backgroundColor = '#4ade80';
    }

    const progPct = Math.min(Math.round(progressRatio * 100), 100);
    this.ui.progressBarFill.style.width = progPct + '%';
    this.ui.progressCartIcon.style.left = progPct + '%';
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
