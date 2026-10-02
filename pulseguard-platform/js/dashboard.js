/**
 * IIOT Multi-Device Telemetry Dashboard - Managed by Team Penguin
 * Clean Industrial SCADA & Predictive Maintenance Engine
 * 
 * Features:
 * - Dedicated 3D Digital Twin EXCLUSIVELY inside each machine's Inspect Dashboard performance view
 * - No redundant 3D twin on the live dashboard page outside the inspect panel
 * - AI Health Score & AI Estimated Maintenance Date calculation
 * - Dropdown Dashboard: clicking "Inspect Dashboard" expands the full machine dashboard inline beneath that card
 * - Multi-device monitoring with dynamic "Add New Machine" capability
 * - Industrial alert buzzer sound on ANY abnormality
 * - Role-based authentication (Maintenance Developer vs Custom User)
 * - Comprehensive PDF Audit Report generation (jsPDF)
 */

// Initial Default Machines Fleet
const defaultDevices = {
  'MOTOR-01': {
    id: 'MOTOR-01',
    name: 'Conveyor Belt Drive Motor',
    application: 'Main Assembly Line Material Handling',
    powerKw: 0.75,
    ratedFla: 1.80,
    voltage: 230,
    location: 'Assembly Bay A-1',
    scenario: 'NORMAL',
    
    telemetry: {
      temp: 42.5,
      vibRms: 0.052,
      vibPeak: 0.084,
      current: 1.34,
      powerWatts: 295,
      motorHealthScore: 98,
      motorHealth: 'NORMAL',
      isoZone: 'Zone A (Good)',
      failureRisk: 'LOW',
      failureRiskScore: 6,
      rulHours: 8500
    },

    sensors: {
      ds18b20: 'OK',
      mpu6050: 'OK',
      acs712: 'OK',
      esp32: 'OK'
    },

    tempConfig: {
      targetTemp: 45.0,
      warningThreshold: 60.0,
      tripThreshold: 75.0,
      coolingRelay: 'IDLE',
      manualOverride: false,
      manualTemp: 45.0,
      manualVib: 0.06,
      manualCurrent: 1.40
    },

    schedule: {
      shiftStart: '08:00',
      shiftEnd: '18:00',
      operatingDays: 6,
      tariffInr: 8.00,
      isShiftActive: true,
      hoursRunToday: 6.8,
      kwhToday: 4.85,
      costTodayInr: 38.80,
      monthlyProjectedInr: 1008.80,
      wearTearIndex: 18.0,
      wearTearAdvice: 'Normal wear progression. Scheduled lubrication in 420 operating hours.'
    },

    history: { labels: [], temp: [], vib: [], current: [] },
    abnormalActivities: [],
    isDropdownOpen: true // Motor-01 expanded by default for immediate inspection
  },

  'MOTOR-02': {
    id: 'MOTOR-02',
    name: 'Thermal Exhaust Blower Motor',
    application: 'Foundry Area Heat Extraction',
    powerKw: 1.50,
    ratedFla: 3.20,
    voltage: 415,
    location: 'Ventilation Duct B-4',
    scenario: 'NORMAL',
    
    telemetry: {
      temp: 48.2,
      vibRms: 0.078,
      vibPeak: 0.122,
      current: 2.45,
      powerWatts: 880,
      motorHealthScore: 95,
      motorHealth: 'NORMAL',
      isoZone: 'Zone A (Good)',
      failureRisk: 'LOW',
      failureRiskScore: 9,
      rulHours: 7200
    },

    sensors: {
      ds18b20: 'OK',
      mpu6050: 'OK',
      acs712: 'OK',
      esp32: 'OK'
    },

    tempConfig: {
      targetTemp: 50.0,
      warningThreshold: 68.0,
      tripThreshold: 82.0,
      coolingRelay: 'IDLE',
      manualOverride: false,
      manualTemp: 50.0,
      manualVib: 0.08,
      manualCurrent: 2.50
    },

    schedule: {
      shiftStart: '06:00',
      shiftEnd: '22:00',
      operatingDays: 6,
      tariffInr: 8.00,
      isShiftActive: true,
      hoursRunToday: 9.2,
      kwhToday: 12.80,
      costTodayInr: 102.40,
      monthlyProjectedInr: 2662.40,
      wearTearIndex: 29.0,
      wearTearAdvice: 'High duty cycle. Recommend 15-min thermal stabilization at 14:00 to reduce heat fatigue.'
    },

    history: { labels: [], temp: [], vib: [], current: [] },
    abnormalActivities: [],
    isDropdownOpen: false
  },

  'MOTOR-03': {
    id: 'MOTOR-03',
    name: 'Coolant Circulation Pump Motor',
    application: 'CNC Chiller Water Supply',
    powerKw: 2.20,
    ratedFla: 4.80,
    voltage: 415,
    location: 'Chiller Plant Room C-1',
    scenario: 'NORMAL',
    
    telemetry: {
      temp: 39.8,
      vibRms: 0.044,
      vibPeak: 0.072,
      current: 3.12,
      powerWatts: 1140,
      motorHealthScore: 99,
      motorHealth: 'NORMAL',
      isoZone: 'Zone A (Good)',
      failureRisk: 'LOW',
      failureRiskScore: 4,
      rulHours: 11200
    },

    sensors: {
      ds18b20: 'OK',
      mpu6050: 'OK',
      acs712: 'OK',
      esp32: 'OK'
    },

    tempConfig: {
      targetTemp: 40.0,
      warningThreshold: 58.0,
      tripThreshold: 72.0,
      coolingRelay: 'IDLE',
      manualOverride: false,
      manualTemp: 40.0,
      manualVib: 0.05,
      manualCurrent: 3.10
    },

    schedule: {
      shiftStart: '00:00',
      shiftEnd: '23:59',
      operatingDays: 7,
      tariffInr: 8.00,
      isShiftActive: true,
      hoursRunToday: 14.5,
      kwhToday: 16.53,
      costTodayInr: 132.24,
      monthlyProjectedInr: 3967.20,
      wearTearIndex: 22.0,
      wearTearAdvice: 'Continuous 24/7 duty. Impeller cavitation check recommended next month.'
    },

    history: { labels: [], temp: [], vib: [], current: [] },
    abnormalActivities: [],
    isDropdownOpen: false
  }
};

let devices = JSON.parse(JSON.stringify(defaultDevices));

// Global Application State
const globalState = {
  activeDeviceId: 'MOTOR-01',
  sampleRateMs: 1500,
  isPaused: false,
  mqttPacketsSent: 5410,
  lastUpdated: new Date(),
  allReadingsLog: [],
  systemLogs: [],
  isAudioMuted: false,
  isBuzzerSounding: false,
  audioInitialized: false
};

// Load any custom added machines from localStorage
function loadCustomMachines() {
  try {
    const saved = localStorage.getItem('iiot_custom_machines');
    if (saved) {
      const custom = JSON.parse(saved);
      Object.keys(custom).forEach(id => {
        if (!devices[id]) {
          devices[id] = custom[id];
        }
      });
    }
  } catch (e) {
    console.warn("Could not load custom machines from localStorage:", e);
  }
}

// -------------------------------------------------------------
// 1. AI HEALTH SCORE & ANOMALY DETECTION ENGINE
// -------------------------------------------------------------
function calculateAiHealthScore(dev) {
  const t = dev.telemetry;
  const cfg = dev.tempConfig;
  const s = dev.sensors;

  let score = 100;
  let deductions = [];

  // Vibration check based on ISO 10816 standards
  if (t.vibRms >= 0.45) {
    score -= 45;
    deductions.push('Critical Vibration ISO Zone D (-45)');
  } else if (t.vibRms >= 0.28) {
    score -= 25;
    deductions.push('High Vibration ISO Zone C (-25)');
  } else if (t.vibRms >= 0.12) {
    score -= 10;
    deductions.push('Moderate Vibration ISO Zone B (-10)');
  }

  // Thermal stress check
  const tempExcess = t.temp - cfg.targetTemp;
  if (t.temp >= cfg.tripThreshold) {
    score -= 40;
    deductions.push('Thermal Trip Overheat (-40)');
  } else if (t.temp >= cfg.warningThreshold) {
    score -= 20;
    deductions.push('Thermal Warning Threshold Exceeded (-20)');
  } else if (tempExcess > 8.0) {
    score -= 8;
    deductions.push('Operating >8°C above target setpoint (-8)');
  }

  // Current draw check
  if (t.current > dev.ratedFla * 1.5) {
    score -= 30;
    deductions.push('Stator Severe Overcurrent >150% FLA (-30)');
  } else if (t.current > dev.ratedFla * 1.1) {
    score -= 15;
    deductions.push('Mild Stator Overload >110% FLA (-15)');
  }

  // Sensor array health deductions
  if (s.ds18b20 === 'FAULT') { score -= 20; deductions.push('DS18B20 Temp Probe Fault (-20)'); }
  if (s.mpu6050 === 'FAULT') { score -= 25; deductions.push('MPU6050 Vibration Sensor Fault (-25)'); }
  if (s.acs712 === 'FAULT') { score -= 15; deductions.push('ACS712 Current Hall Fault (-15)'); }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let classification = 'OPTIMAL / LOW STRESS';
  let confidence = 96;

  if (score < 40) {
    classification = 'CRITICAL / IMMEDIATE ACTION REQUIRED';
    confidence = 98;
  } else if (score < 70) {
    classification = 'WARNING / ABNORMAL WEAR DETECTED';
    confidence = 94;
  } else if (score < 85) {
    classification = 'ACCEPTABLE / MONITOR CLOSELY';
    confidence = 91;
  }

  return {
    score: score,
    classification: classification,
    confidence: confidence,
    deductions: deductions
  };
}

// -------------------------------------------------------------
// 2. AI ESTIMATED MAINTENANCE DATE CALCULATION
// -------------------------------------------------------------
function calculateAiMaintenanceDate(dev) {
  const t = dev.telemetry;
  const sch = dev.schedule;
  const cfg = dev.tempConfig;

  let stressMultiplier = 1.0;

  if (t.vibRms >= 0.45) stressMultiplier *= 7.5;
  else if (t.vibRms >= 0.28) stressMultiplier *= 3.4;
  else if (t.vibRms >= 0.12) stressMultiplier *= 1.3;

  const tempExcess = Math.max(0, t.temp - cfg.targetTemp);
  if (tempExcess > 25) stressMultiplier *= 4.5;
  else if (tempExcess > 12) stressMultiplier *= 2.2;
  else if (tempExcess > 5) stressMultiplier *= 1.3;

  if (t.current > dev.ratedFla * 1.5) stressMultiplier *= 3.0;
  else if (t.current > dev.ratedFla * 1.1) stressMultiplier *= 1.4;

  const baseRul = Math.max(20, t.rulHours);
  const effectiveRulHours = Math.max(8, Math.round(baseRul / stressMultiplier));

  let dailyHours = 10;
  try {
    const [startH, startM] = sch.shiftStart.split(':').map(Number);
    const [endH, endM] = sch.shiftEnd.split(':').map(Number);
    dailyHours = Math.max(4, Math.min(24, (endH + endM / 60) - (startH + startM / 60)));
  } catch (e) {
    dailyHours = 10;
  }

  const daysPerWeekFactor = (sch.operatingDays || 6) / 7;
  const effectiveDailyHours = dailyHours * daysPerWeekFactor;
  const daysRemaining = Math.max(1, Math.round(effectiveRulHours / effectiveDailyHours));

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysRemaining);

  const formattedDate = targetDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return {
    dateStr: formattedDate,
    daysRemaining: daysRemaining,
    effectiveRulHours: effectiveRulHours,
    stressMultiplier: stressMultiplier.toFixed(1),
    urgency: daysRemaining <= 7 ? 'CRITICAL' : (daysRemaining <= 30 ? 'SOON' : 'NORMAL')
  };
}

// -------------------------------------------------------------
// INDUSTRIAL ALERT BUZZER (Web Audio API Synthesizer)
// -------------------------------------------------------------
let audioCtx = null;

function initAudioContext() {
  if (globalState.audioInitialized) return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
      globalState.audioInitialized = true;
    }
  } catch (e) {
    console.warn('Web Audio not supported', e);
  }
}

window.addEventListener('click', () => {
  if (!globalState.audioInitialized) initAudioContext();
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}, { once: false });

function playIndustrialAlarmPulse() {
  if (globalState.isAudioMuted || !audioCtx) return;
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const t = audioCtx.currentTime;

    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(980, t);
    osc1.frequency.exponentialRampToValueAtTime(740, t + 0.16);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(490, t);
    osc2.frequency.exponentialRampToValueAtTime(370, t + 0.16);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(audioCtx.destination);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.19);
    osc2.stop(t + 0.19);
  } catch (err) {
    console.warn('Audio alert error:', err);
  }
}

function evaluateFleetAbnormalities() {
  let hasAbnormality = false;
  let abnormalDevices = [];

  Object.keys(devices).forEach(id => {
    const d = devices[id];
    const isAbnormal = 
      d.telemetry.motorHealth !== 'NORMAL' ||
      d.sensors.ds18b20 === 'FAULT' ||
      d.sensors.mpu6050 === 'FAULT' ||
      d.sensors.acs712 === 'FAULT' ||
      d.telemetry.temp >= d.tempConfig.warningThreshold ||
      d.telemetry.vibRms >= 0.28 ||
      d.telemetry.current > (d.ratedFla * 1.15);

    if (isAbnormal) {
      hasAbnormality = true;
      abnormalDevices.push(`${d.id} (${d.telemetry.motorHealth})`);
    }
  });

  const banner = document.getElementById('alarmBuzzerBanner');
  const bannerText = document.getElementById('alarmBuzzerText');
  const buzzerStatusPill = document.getElementById('buzzerStatusPill');

  if (hasAbnormality) {
    globalState.isBuzzerSounding = true;
    if (banner) {
      banner.classList.remove('hidden');
      banner.classList.add('flex');
    }
    if (bannerText) {
      bannerText.innerText = `🚨 ALERT BUZZER SOUNDING: Abnormality active on ${abnormalDevices.join(', ')}! Check motor panels immediately.`;
    }
    if (buzzerStatusPill) {
      buzzerStatusPill.className = 'text-xs font-extrabold px-3 py-1 rounded bg-red-600 text-white animate-pulse shadow-sm';
      buzzerStatusPill.innerText = '🚨 BUZZER: ALARM ACTIVE';
    }

    playIndustrialAlarmPulse();
  } else {
    globalState.isBuzzerSounding = false;
    if (banner) {
      banner.classList.add('hidden');
      banner.classList.remove('flex');
    }
    if (buzzerStatusPill) {
      buzzerStatusPill.className = 'text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-300';
      buzzerStatusPill.innerText = globalState.isAudioMuted ? '🔇 Buzzer: Muted' : '🔔 Buzzer: Armed';
    }
  }
}

// -------------------------------------------------------------
// 3. EACH PERFORMANCE VIEW'S OWN 3D DIGITAL TWIN (Inside Inspect)
// -------------------------------------------------------------
let dropdown3DInstances = {}; // Map of devId -> { renderer, scene, camera, motorGroup, rotorShaft, tempProbe, vibProbe, isDragging, prevMouse }

function initDropdown3DMotor(dev) {
  const canvas = document.getElementById(`dropdown3DCanvas_${dev.id}`);
  if (!canvas || typeof THREE === 'undefined') return;

  const width = canvas.clientWidth || 380;
  const height = canvas.clientHeight || 240;

  // If already initialized for this device, just resize and ensure projection
  if (dropdown3DInstances[dev.id]) {
    try {
      const inst = dropdown3DInstances[dev.id];
      inst.renderer.setSize(width, height);
      inst.camera.aspect = width / height;
      inst.camera.updateProjectionMatrix();
    } catch (e) {}
    return;
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070b14);

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 3.2, 7.0);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Lighting
  const ambLight = new THREE.AmbientLight(0xffffff, 0.85);
  scene.add(ambLight);

  const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
  dirLight.position.set(5, 8, 5);
  scene.add(dirLight);

  const motorGroup = new THREE.Group();

  // Stator body (color-accented by voltage: 415V darker industrial blue, 230V royal blue)
  const statorColor = dev.voltage === 415 ? 0x1e40af : 0x2563eb;
  const statorGeo = new THREE.CylinderGeometry(1.5, 1.5, 3.2, 32);
  const statorMat = new THREE.MeshStandardMaterial({ color: statorColor, metalness: 0.45, roughness: 0.3 });
  const statorMesh = new THREE.Mesh(statorGeo, statorMat);
  statorMesh.rotation.z = Math.PI / 2;
  motorGroup.add(statorMesh);

  // Cooling ribs
  const finGeo = new THREE.CylinderGeometry(1.68, 1.68, 0.08, 32);
  const finMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.5, roughness: 0.4 });
  for (let i = -1.3; i <= 1.3; i += 0.35) {
    const fin = new THREE.Mesh(finGeo, finMat);
    fin.rotation.z = Math.PI / 2;
    fin.position.x = i;
    motorGroup.add(fin);
  }

  // Bearing caps
  const capGeo = new THREE.CylinderGeometry(1.4, 1.2, 0.45, 32);
  const capMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.2 });
  const fCap = new THREE.Mesh(capGeo, capMat);
  fCap.rotation.z = Math.PI / 2;
  fCap.position.x = 1.82;
  motorGroup.add(fCap);

  const rCap = new THREE.Mesh(capGeo, capMat);
  rCap.rotation.z = Math.PI / 2;
  rCap.position.x = -1.82;
  motorGroup.add(rCap);

  // Shaft
  const shaftGeo = new THREE.CylinderGeometry(0.3, 0.3, 5.0, 24);
  const shaftMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.1 });
  const rotorShaft = new THREE.Mesh(shaftGeo, shaftMat);
  rotorShaft.rotation.z = Math.PI / 2;
  rotorShaft.position.x = 0.5;
  motorGroup.add(rotorShaft);

  // Terminal box
  const termGeo = new THREE.BoxGeometry(1.1, 0.7, 1.0);
  const termMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.4, roughness: 0.4 });
  const termBox = new THREE.Mesh(termGeo, termMat);
  termBox.position.set(0, 1.75, 0);
  motorGroup.add(termBox);

  // Mounting feet
  const footGeo = new THREE.BoxGeometry(2.6, 0.2, 2.4);
  const footMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.5, roughness: 0.5 });
  const footMesh = new THREE.Mesh(footGeo, footMat);
  footMesh.position.set(0, -1.65, 0);
  motorGroup.add(footMesh);

  // Sensor Hotspot Probes
  const probeGeo = new THREE.SphereGeometry(0.2, 16, 16);
  const tMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 0.85 });
  const tempProbe = new THREE.Mesh(probeGeo, tMat);
  tempProbe.position.set(0.5, 1.55, 0.7);
  motorGroup.add(tempProbe);

  const vMat = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 0.85 });
  const vibProbe = new THREE.Mesh(probeGeo, vMat);
  vibProbe.position.set(1.9, 0.8, 0.7);
  motorGroup.add(vibProbe);

  scene.add(motorGroup);

  const inst = {
    renderer,
    scene,
    camera,
    motorGroup,
    rotorShaft,
    tempProbe,
    vibProbe,
    isDragging: false,
    prevMouse: { x: 0, y: 0 }
  };

  // Mouse drag events on this canvas
  canvas.addEventListener('mousedown', (e) => {
    inst.isDragging = true;
    inst.prevMouse = { x: e.clientX, y: e.clientY };
  });

  window.addEventListener('mouseup', () => { inst.isDragging = false; });

  window.addEventListener('mousemove', (e) => {
    if (!inst.isDragging || !inst.motorGroup) return;
    const deltaX = e.clientX - inst.prevMouse.x;
    const deltaY = e.clientY - inst.prevMouse.y;
    inst.motorGroup.rotation.y += deltaX * 0.009;
    inst.motorGroup.rotation.x += deltaY * 0.009;
    inst.prevMouse = { x: e.clientX, y: e.clientY };
  });

  dropdown3DInstances[dev.id] = inst;
}

// -------------------------------------------------------------
// CENTRAL ANIMATION LOOP (Exclusively Animates Open Dropdown 3D Twins)
// -------------------------------------------------------------
function animateAll3D() {
  requestAnimationFrame(animateAll3D);

  // Animate each inspected performance view's own 3D digital twin
  Object.keys(dropdown3DInstances).forEach(devId => {
    const inst = dropdown3DInstances[devId];
    const d = devices[devId];
    if (!inst || !d) return;

    // Render if dropdown is currently open
    if (d.isDropdownOpen) {
      if (!inst.isDragging && inst.motorGroup) {
        inst.motorGroup.rotation.y += 0.005;
      }
      if (inst.rotorShaft) {
        inst.rotorShaft.rotation.x += 0.12;
      }

      // Update glowing sensor probes on this motor's own 3D model
      if (inst.tempProbe) {
        if (d.telemetry.temp >= d.tempConfig.tripThreshold) {
          inst.tempProbe.material.color.setHex(0xef4444);
          inst.tempProbe.material.emissive.setHex(0xef4444);
        } else if (d.telemetry.temp >= d.tempConfig.warningThreshold) {
          inst.tempProbe.material.color.setHex(0xf59e0b);
          inst.tempProbe.material.emissive.setHex(0xf59e0b);
        } else {
          inst.tempProbe.material.color.setHex(0x38bdf8);
          inst.tempProbe.material.emissive.setHex(0x38bdf8);
        }
      }

      if (inst.vibProbe) {
        if (d.telemetry.vibRms >= 0.28) {
          inst.vibProbe.material.color.setHex(0xef4444);
          inst.vibProbe.material.emissive.setHex(0xef4444);
        } else {
          inst.vibProbe.material.color.setHex(0x10b981);
          inst.vibProbe.material.emissive.setHex(0x10b981);
        }
      }

      inst.renderer.render(inst.scene, inst.camera);
    }
  });
}

// -------------------------------------------------------------
// 4. DROPDOWN DASHBOARD ACCORDION ("Inspect Dashboard")
// -------------------------------------------------------------
let dropdownCharts = {}; // Map of deviceId -> { tempChart, vibChart, currChart }

function toggleInspectDropdown(deviceId) {
  if (!devices[deviceId]) return;
  const dev = devices[deviceId];
  dev.isDropdownOpen = !dev.isDropdownOpen;

  // Set as active inspection unit
  globalState.activeDeviceId = deviceId;

  // Update active border on all cards
  Object.keys(devices).forEach(id => {
    const cardEl = document.getElementById(`card_${id}`);
    if (cardEl) {
      if (id === globalState.activeDeviceId) {
        cardEl.classList.add('ring-2', 'ring-blue-600');
      } else {
        cardEl.classList.remove('ring-2', 'ring-blue-600');
      }
    }
  });

  const panel = document.getElementById(`dropdownDashboard_${deviceId}`);
  const btn = document.getElementById(`cardInspectBtn_${deviceId}`);

  if (panel) {
    if (dev.isDropdownOpen) {
      panel.classList.add('open');
      if (btn) {
        btn.innerText = '▲ Close Dashboard';
        btn.className = 'py-2 px-4 rounded-lg text-xs font-bold transition text-center shadow-sm bg-blue-700 text-white hover:bg-blue-800';
      }
      setTimeout(() => {
        initDropdown3DMotor(dev);
        initDropdownChartsForDevice(dev);
      }, 60);
    } else {
      panel.classList.remove('open');
      if (btn) {
        btn.innerText = '▼ Inspect Dashboard';
        btn.className = 'py-2 px-4 rounded-lg text-xs font-bold transition text-center shadow-sm bg-slate-800 text-white hover:bg-slate-900';
      }
    }
  }

  addLog('INFO', `${dev.isDropdownOpen ? 'Expanded' : 'Collapsed'} performance view with 3D Digital Twin for ${dev.id}.`);
}

function initDropdownChartsForDevice(dev) {
  const tCanvas = document.getElementById(`dropdownTempChart_${dev.id}`);
  const vCanvas = document.getElementById(`dropdownVibChart_${dev.id}`);
  const cCanvas = document.getElementById(`dropdownCurrChart_${dev.id}`);

  if (!tCanvas || !vCanvas || !cCanvas) return;

  // Destroy previous if existing
  if (dropdownCharts[dev.id]) {
    try {
      dropdownCharts[dev.id].temp.destroy();
      dropdownCharts[dev.id].vib.destroy();
      dropdownCharts[dev.id].curr.destroy();
    } catch (e) {}
  }

  const commonOpts = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { display: false }, grid: { color: '#f1f5f9' } },
      y: { ticks: { font: { size: 9 }, color: '#64748b' }, grid: { color: '#e2e8f0' } }
    }
  };

  const tCtx = tCanvas.getContext('2d');
  const tempChart = new Chart(tCtx, {
    type: 'line',
    data: {
      labels: dev.history.labels,
      datasets: [{
        label: 'Temp (°C)',
        data: dev.history.temp,
        borderColor: '#0284c7',
        borderWidth: 2,
        tension: 0.25,
        fill: true,
        backgroundColor: 'rgba(2, 132, 199, 0.08)',
        pointRadius: 1
      }]
    },
    options: {
      ...commonOpts,
      scales: { ...commonOpts.scales, y: { min: 20, max: 95 } }
    }
  });

  const vCtx = vCanvas.getContext('2d');
  const vibChart = new Chart(vCtx, {
    type: 'line',
    data: {
      labels: dev.history.labels,
      datasets: [{
        label: 'Vibration (g)',
        data: dev.history.vib,
        borderColor: '#d97706',
        borderWidth: 2,
        tension: 0.25,
        fill: true,
        backgroundColor: 'rgba(217, 119, 6, 0.08)',
        pointRadius: 1
      }]
    },
    options: {
      ...commonOpts,
      scales: { ...commonOpts.scales, y: { min: 0, max: 0.70 } }
    }
  });

  const cCtx = cCanvas.getContext('2d');
  const currChart = new Chart(cCtx, {
    type: 'line',
    data: {
      labels: dev.history.labels,
      datasets: [{
        label: 'Current (A)',
        data: dev.history.current,
        borderColor: '#10b981',
        borderWidth: 2,
        tension: 0.25,
        fill: true,
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        pointRadius: 1
      }]
    },
    options: {
      ...commonOpts,
      scales: { ...commonOpts.scales, y: { min: 0, max: Math.ceil(dev.ratedFla * 2.2) } }
    }
  });

  dropdownCharts[dev.id] = { temp: tempChart, vib: vibChart, curr: currChart };
}

// -------------------------------------------------------------
// TELEMETRY SIMULATION LOOP
// -------------------------------------------------------------
function stepDeviceTelemetry(dev, timestampStr) {
  const t = dev.telemetry;
  const cfg = dev.tempConfig;
  const sch = dev.schedule;

  if (cfg.manualOverride) {
    t.temp = parseFloat(cfg.manualTemp) || t.temp;
    t.vibRms = parseFloat(cfg.manualVib) || t.vibRms;
    t.current = parseFloat(cfg.manualCurrent) || t.current;
    t.vibPeak = +(t.vibRms * 1.55).toFixed(3);
    t.powerWatts = Math.round(dev.voltage * t.current * 0.88);
  } else {
    switch (dev.scenario) {
      case 'NORMAL': {
        const noiseT = (Math.random() - 0.48) * 0.25;
        const delta = cfg.targetTemp - t.temp;
        t.temp = +(t.temp + (delta * 0.05) + noiseT).toFixed(1);
        t.vibRms = +(0.050 + (Math.random() * 0.012)).toFixed(3);
        t.vibPeak = +(t.vibRms * 1.5 + (Math.random() * 0.02)).toFixed(3);
        t.current = +(dev.ratedFla * 0.75 + (Math.random() * 0.08 - 0.04)).toFixed(2);
        t.powerWatts = Math.round(dev.voltage * t.current * 0.88);
        dev.sensors.ds18b20 = 'OK';
        dev.sensors.mpu6050 = 'OK';
        dev.sensors.acs712 = 'OK';
        break;
      }
      case 'WARNING': {
        t.temp = +(Math.min(cfg.tripThreshold - 2, t.temp + 0.35 + (Math.random() * 0.15))).toFixed(1);
        t.vibRms = +(Math.min(0.55, t.vibRms + 0.015 + (Math.random() * 0.01))).toFixed(3);
        t.vibPeak = +(t.vibRms * 1.85).toFixed(3);
        t.current = +(dev.ratedFla * 1.15 + (Math.random() * 0.1 - 0.05)).toFixed(2);
        t.powerWatts = Math.round(dev.voltage * t.current * 0.90);
        break;
      }
      case 'FAULT': {
        t.temp = +(Math.min(94.0, t.temp + 0.9 + (Math.random() * 0.3))).toFixed(1);
        t.vibRms = +(Math.min(0.68, t.vibRms + 0.03)).toFixed(3);
        t.vibPeak = +(t.vibRms * 2.1).toFixed(3);
        t.current = +(dev.ratedFla * 2.2 + (Math.random() * 0.2)).toFixed(2);
        t.powerWatts = Math.round(dev.voltage * t.current * 0.92);
        break;
      }
      case 'SENSOR_FAILURE': {
        dev.sensors.mpu6050 = 'FAULT';
        t.vibRms = 0.000;
        t.vibPeak = 0.000;
        t.temp = +(cfg.targetTemp + (Math.random() * 0.4)).toFixed(1);
        t.current = +(dev.ratedFla * 0.72).toFixed(2);
        t.powerWatts = Math.round(dev.voltage * t.current * 0.88);
        break;
      }
    }
  }

  if (t.temp > cfg.targetTemp + 2.0) cfg.coolingRelay = 'ACTIVE (FAN ON)';
  else if (t.temp <= cfg.targetTemp) cfg.coolingRelay = 'IDLE';

  if (t.vibRms < 0.12) t.isoZone = 'Zone A (Good)';
  else if (t.vibRms < 0.28) t.isoZone = 'Zone B (Acceptable)';
  else if (t.vibRms < 0.45) t.isoZone = 'Zone C (Warning / Wear)';
  else t.isoZone = 'Zone D (Danger / Unacceptable)';

  let health = 100;
  let status = 'NORMAL';

  if (dev.sensors.mpu6050 === 'FAULT' || dev.sensors.ds18b20 === 'FAULT' || dev.sensors.acs712 === 'FAULT') {
    status = 'SENSOR_FAULT';
    health = 68;
    recordAbnormalActivity(dev, 'SENSOR_FAULT', 'Sensor Disconnect', `Sensor array fault isolated: MPU6050 ${dev.sensors.mpu6050}, DS18B20 ${dev.sensors.ds18b20}.`);
  } else if (t.temp >= cfg.tripThreshold || t.vibRms >= 0.45 || t.current >= dev.ratedFla * 1.8) {
    status = 'FAULT';
    health = 32;
    t.rulHours = Math.max(50, t.rulHours - 150);
    recordAbnormalActivity(dev, 'CRITICAL', 'Thermal / Overload Trip', `CRITICAL EXCEEDANCE: Temp ${t.temp}°C, Vib ${t.vibRms}g, Current ${t.current}A.`);
  } else if (t.temp >= cfg.warningThreshold || t.vibRms >= 0.28 || t.current >= dev.ratedFla * 1.1) {
    status = 'WARNING';
    health = 72;
    t.rulHours = Math.max(800, t.rulHours - 20);
    recordAbnormalActivity(dev, 'WARNING', 'High Heat / Bearing Wear', `WARNING: Temperature (${t.temp}°C) or Vibration (${t.vibRms}g) exceeding normal operational thresholds.`);
  } else {
    status = 'NORMAL';
    health = 98;
  }

  t.motorHealth = status;
  t.motorHealthScore = health;

  sch.hoursRunToday = +(sch.hoursRunToday + (globalState.sampleRateMs / 3600000)).toFixed(2);
  const powerKwLive = (t.powerWatts / 1000);
  const kwhDelta = (powerKwLive * (globalState.sampleRateMs / 3600000));
  sch.kwhToday = +(sch.kwhToday + kwhDelta).toFixed(3);
  sch.costTodayInr = +(sch.kwhToday * sch.tariffInr).toFixed(2);
  sch.monthlyProjectedInr = +(sch.costTodayInr * sch.operatingDays * 4.3).toFixed(2);

  const vibStress = (t.vibRms / 0.05);
  const thermalStress = Math.max(1, (t.temp - 40) / 10);
  sch.wearTearIndex = Math.min(100, +(sch.wearTearIndex + (0.005 * vibStress * thermalStress)).toFixed(1));

  dev.history.labels.push(timestampStr);
  dev.history.temp.push(t.temp);
  dev.history.vib.push(t.vibRms);
  dev.history.current.push(t.current);

  if (dev.history.labels.length > 25) {
    dev.history.labels.shift();
    dev.history.temp.shift();
    dev.history.vib.shift();
    dev.history.current.shift();
  }

  // Record for PDF export
  const aiHealth = calculateAiHealthScore(dev);
  const aiMaint = calculateAiMaintenanceDate(dev);

  globalState.allReadingsLog.push({
    timestamp: timestampStr,
    deviceId: dev.id,
    deviceName: dev.name,
    temp: t.temp,
    targetTemp: cfg.targetTemp,
    vibRms: t.vibRms,
    isoZone: t.isoZone,
    current: t.current,
    powerWatts: t.powerWatts,
    aiHealthScore: aiHealth.score,
    aiMaintDate: aiMaint.dateStr,
    status: t.motorHealth,
    costInr: sch.costTodayInr
  });

  if (globalState.allReadingsLog.length > 300) {
    globalState.allReadingsLog.shift();
  }
}

function recordAbnormalActivity(dev, severity, sensor, description) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString();

  const recent = dev.abnormalActivities[dev.abnormalActivities.length - 1];
  if (recent && recent.severity === severity && recent.sensor === sensor && (now - recent.dateObj) < 8000) {
    return;
  }

  const record = {
    timestamp: timeStr,
    dateObj: now,
    deviceId: dev.id,
    deviceName: dev.name,
    severity: severity,
    sensor: sensor,
    temp: dev.telemetry.temp,
    vib: dev.telemetry.vibRms,
    current: dev.telemetry.current,
    description: description,
    action: severity === 'CRITICAL' ? 'Immediate interlock trip & overhaul required' : (severity === 'SENSOR_FAULT' ? 'Check sensor harness wire' : 'Lubricate bearing housing')
  };

  dev.abnormalActivities.push(record);
  addLog(severity, `[${dev.id}] ${description}`);
}

function tickSimulation() {
  if (globalState.isPaused) return;

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  globalState.lastUpdated = now;
  globalState.mqttPacketsSent += Object.keys(devices).length;

  Object.keys(devices).forEach(id => {
    stepDeviceTelemetry(devices[id], timeStr);
  });

  evaluateFleetAbnormalities();

  // Update open dropdown charts
  Object.keys(dropdownCharts).forEach(devId => {
    const ch = dropdownCharts[devId];
    if (ch && devices[devId] && devices[devId].isDropdownOpen) {
      ch.temp.update('none');
      ch.vib.update('none');
      ch.curr.update('none');
    }
  });

  updateGlobalUI(timeStr);
  updateFleetSummaryCards(false); // In-place DOM update, keeps canvas & inputs intact!
}

function updateGlobalUI(timeStr) {
  const tsEl = document.getElementById('liveTimestamp');
  if (tsEl) tsEl.innerText = timeStr;

  const mqttCount = document.getElementById('mqttPacketCount');
  if (mqttCount) mqttCount.innerText = globalState.mqttPacketsSent;
}

// -------------------------------------------------------------
// RENDER FLEET WITH ACCORDION DROPDOWN DASHBOARDS & OWN 3D DIGITAL TWIN
// -------------------------------------------------------------
function updateFleetSummaryCards(rebuildDom = false) {
  const container = document.getElementById('fleetSummaryGrid');
  if (!container) return;

  const numDevices = Object.keys(devices).length;
  const needsRebuild = rebuildDom || container.children.length !== numDevices;

  if (needsRebuild) {
    let html = '';
    Object.keys(devices).forEach(devId => {
      const d = devices[devId];
      const isInspected = d.id === globalState.activeDeviceId;
      const aiHealth = calculateAiHealthScore(d);
      const aiMaint = calculateAiMaintenanceDate(d);
      const isOpen = d.isDropdownOpen;

      html += `
        <!-- INDIVIDUAL MOTOR CARD (Vertical Scrolling Item) -->
        <div id="card_${d.id}" class="card-3d-depth p-5 transition ${isInspected ? 'ring-2 ring-blue-600 bg-white' : 'bg-white'}">
          
          <!-- CARD TOP ROW (Summary) -->
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            <!-- Machine Identity & Specifications -->
            <div class="lg:w-1/4">
              <div class="flex items-center gap-2">
                <span class="font-extrabold text-sm px-2.5 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">${d.id}</span>
                <span id="cardBadge_${d.id}" class="text-xs font-bold px-2 py-0.5 rounded border ${getStatusBadgeClass(d.telemetry.motorHealth)}">
                  ${d.telemetry.motorHealth}
                </span>
                <span id="cardManualTag_${d.id}" class="text-[9px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded border border-purple-200" style="display: ${d.tempConfig.manualOverride ? 'inline-block' : 'none'};">MANUAL</span>
              </div>
              <div class="font-bold text-slate-900 text-sm mt-1.5">${d.name}</div>
              <div class="text-xs text-slate-500">${d.application} • ${d.location}</div>
              <div class="text-[11px] text-slate-400 mt-1 font-medium">${d.powerKw} kW • ${d.voltage}V • FLA: ${d.ratedFla}A</div>
            </div>

            <!-- Real-Time Core Telemetry Readouts -->
            <div class="lg:w-2/5 grid grid-cols-3 gap-2.5 text-center">
              
              <!-- Temp -->
              <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <span class="text-[10px] text-slate-400 font-semibold uppercase">Temperature</span>
                <div id="cardTemp_${d.id}" class="text-base font-extrabold text-slate-900">${d.telemetry.temp.toFixed(1)}°C</div>
                <span id="cardTargetTemp_${d.id}" class="text-[10px] text-blue-700 font-medium">Set: ${d.tempConfig.targetTemp.toFixed(1)}°C</span>
              </div>

              <!-- Vibration -->
              <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <span class="text-[10px] text-slate-400 font-semibold uppercase">Vibration</span>
                <div id="cardVib_${d.id}" class="text-base font-extrabold text-slate-900">${d.telemetry.vibRms.toFixed(3)}g</div>
                <span id="cardIso_${d.id}" class="text-[10px] font-semibold ${getIsoTextColor(d.telemetry.isoZone)}">${d.telemetry.isoZone.split(' ')[0]}</span>
              </div>

              <!-- AI Health & Maint Date Quick Glance -->
              <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <span class="text-[10px] text-blue-800 font-semibold uppercase">AI Health</span>
                <div id="cardAiHealth_${d.id}" class="text-base font-extrabold ${aiHealth.score > 80 ? 'text-emerald-700' : (aiHealth.score > 50 ? 'text-amber-700' : 'text-red-700')}">${aiHealth.score}%</div>
                <span id="cardAiMaint_${d.id}" class="text-[10px] text-slate-500 font-medium">Due: ${aiMaint.dateStr}</span>
              </div>

            </div>

            <!-- Schedule & Actions -->
            <div class="lg:w-1/3 flex flex-col sm:flex-row lg:flex-col justify-between sm:items-center lg:items-stretch gap-3 border-t lg:border-t-0 lg:border-l lg:border-slate-200 lg:pl-5 pt-3 lg:pt-0 text-xs">
              <div class="flex items-center justify-between sm:justify-start lg:justify-between gap-2">
                <span class="text-slate-500">Power Bill Today:</span>
                <span id="cardCost_${d.id}" class="font-extrabold text-slate-900 text-sm">₹ ${d.schedule.costTodayInr.toFixed(2)} INR</span>
              </div>

              <div class="flex items-center gap-2 pt-1">
                <!-- Inspect Drop Down Button -->
                <button id="cardInspectBtn_${d.id}" onclick="toggleInspectDropdown('${d.id}')" class="w-full py-2.5 px-4 rounded-lg text-xs font-bold transition text-center shadow-sm ${isOpen ? 'bg-blue-700 text-white hover:bg-blue-800' : 'bg-slate-800 text-white hover:bg-slate-900'}">
                  <span>${isOpen ? '▲ Close Dashboard' : '▼ Inspect Dashboard (With 3D Digital Twin)'}</span>
                </button>
              </div>
            </div>

          </div>

          <!-- ============================================================== -->
          <!-- DROPDOWN DASHBOARD: EACH PERFORMANCE VIEW WITH OWN 3D TWIN     -->
          <!-- ============================================================== -->
          <div id="dropdownDashboard_${d.id}" class="inspect-dropdown-panel ${isOpen ? 'open' : ''} mt-5 pt-5 border-t border-slate-200 space-y-6">
            
            <!-- SECTION A: MACHINE'S OWN DEDICATED 3D DIGITAL TWIN + AI DIAGNOSTICS ROW -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              
              <!-- LEFT (lg:col-span-7): THIS MOTOR'S OWN 3D DIGITAL TWIN VIEWPORT -->
              <div class="lg:col-span-7 p-4 rounded-xl bg-slate-900 border border-slate-800 text-white flex flex-col justify-between shadow-md">
                
                <!-- 3D Header for this specific machine -->
                <div class="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-2">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded bg-blue-600 text-white font-extrabold text-xs tracking-wider">${d.id}</span>
                    <span class="text-xs font-bold text-sky-400">Dedicated 3D Digital Twin</span>
                  </div>
                  <div class="flex items-center gap-1.5 text-[11px] text-slate-300">
                    <span class="status-dot green"></span>
                    <span>Live Sensor CAD Model</span>
                  </div>
                </div>

                <!-- 3D Canvas Viewport for this specific machine -->
                <div class="relative w-full h-56 sm:h-64 rounded-lg bg-slate-950/90 border border-slate-800 overflow-hidden">
                  <canvas id="dropdown3DCanvas_${d.id}" class="w-full h-full block cursor-grab active:cursor-grabbing"></canvas>
                  
                  <!-- Sensor Hotspots Overlay Legend -->
                  <div class="absolute bottom-2 left-2 right-2 p-1.5 rounded bg-slate-900/90 backdrop-blur text-[10px] text-white flex flex-wrap justify-between items-center gap-2 border border-slate-700">
                    <div class="flex items-center gap-2">
                      <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-sky-400 inline-block"></span> DS18B20 Temp</span>
                      <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span> MPU6050 Vib</span>
                      <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-amber-400 inline-block"></span> ACS712 Current</span>
                    </div>
                    <span class="text-slate-400 text-[9px]">↻ Drag to Orbit 3D</span>
                  </div>
                </div>

                <!-- Telemetry Sub-bar beneath 3D Twin -->
                <div class="mt-2.5 grid grid-cols-4 gap-2 text-center text-[10px]">
                  <div class="p-1.5 rounded bg-slate-800/80 border border-slate-700">
                    <span class="text-slate-400 block">Stator Temp</span>
                    <strong id="dropdown3DTemp_${d.id}" class="text-white text-xs">${d.telemetry.temp.toFixed(1)}°C</strong>
                  </div>
                  <div class="p-1.5 rounded bg-slate-800/80 border border-slate-700">
                    <span class="text-slate-400 block">Bearing Vib</span>
                    <strong id="dropdown3DVib_${d.id}" class="text-white text-xs">${d.telemetry.vibRms.toFixed(3)}g</strong>
                  </div>
                  <div class="p-1.5 rounded bg-slate-800/80 border border-slate-700">
                    <span class="text-slate-400 block">Current Draw</span>
                    <strong id="dropdown3DCurr_${d.id}" class="text-white text-xs">${d.telemetry.current.toFixed(2)}A</strong>
                  </div>
                  <div class="p-1.5 rounded bg-slate-800/80 border border-slate-700">
                    <span class="text-slate-400 block">Active Power</span>
                    <strong id="dropdown3DPower_${d.id}" class="text-sky-300 text-xs">${d.telemetry.powerWatts}W</strong>
                  </div>
                </div>

              </div>

              <!-- RIGHT (lg:col-span-5): AI PREDICTIVE INTELLIGENCE & HEALTH METRICS FOR THIS MOTOR -->
              <div class="lg:col-span-5 flex flex-col justify-between gap-3">
                
                <!-- AI Health Card -->
                <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 text-white flex items-center justify-between gap-3 shadow-md">
                  <div class="space-y-1">
                    <div class="text-[10px] uppercase font-bold tracking-wider text-slate-400">AI Motor Health Score</div>
                    <div id="dropdownAiClass_${d.id}" class="text-sm font-extrabold text-white">${aiHealth.classification}</div>
                    <div id="dropdownAiConf_${d.id}" class="text-[11px] text-sky-400 font-semibold">${aiHealth.confidence}% Model Confidence</div>
                    <div class="text-[10px] text-slate-400 mt-1">Multi-sensor anomaly &amp; ISO 10816 evaluation</div>
                  </div>
                  
                  <div class="w-14 h-14 rounded-full border-2 border-emerald-400 flex items-center justify-center font-extrabold text-base text-emerald-300 shrink-0">
                    <span id="dropdownAiScore_${d.id}">${aiHealth.score}%</span>
                  </div>
                </div>

                <!-- AI Maintenance Forecast Date Card -->
                <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 text-white space-y-1.5 shadow-md">
                  <div class="flex items-center justify-between">
                    <span class="text-[10px] uppercase font-bold tracking-wider text-slate-400">AI Maintenance Forecast Date</span>
                    <span class="text-[9px] font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">AI RUL</span>
                  </div>
                  <div id="dropdownMaintDate_${d.id}" class="text-base font-extrabold text-amber-400">📅 ${aiMaint.dateStr}</div>
                  <div id="dropdownMaintDays_${d.id}" class="text-[11px] text-slate-300">Remaining: ~${aiMaint.daysRemaining} Days (${aiMaint.effectiveRulHours} Run Hours)</div>
                  <div id="dropdownWear_${d.id}" class="text-[10px] text-slate-400 pt-1 border-t border-slate-800">${d.schedule.wearTearIndex.toFixed(1)}% Wear Stress (${aiMaint.stressMultiplier}x rate)</div>
                </div>

                <!-- Operational Duty & Cost -->
                <div class="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-white flex items-center justify-between text-xs shadow-md">
                  <div>
                    <span class="text-slate-400 block text-[10px]">ELECTRICITY COST TODAY</span>
                    <strong class="text-emerald-400 text-sm">₹ ${d.schedule.costTodayInr.toFixed(2)} INR</strong>
                  </div>
                  <div class="text-right">
                    <span class="text-slate-400 block text-[10px]">MONTHLY PROJECTION</span>
                    <strong id="dropdownMonthly_${d.id}" class="text-white text-xs">₹ ${d.schedule.monthlyProjectedInr.toFixed(1)} INR</strong>
                  </div>
                </div>

              </div>

            </div>

            <!-- SECTION B: REAL-TIME CHARTS FOR THIS MOTOR (3 GRAPHS) -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div class="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div class="flex justify-between items-center text-xs mb-2">
                  <span class="font-bold text-slate-800">Temperature vs Time</span>
                  <span class="text-[10px] font-semibold text-blue-700">DS18B20 (°C)</span>
                </div>
                <div class="h-32 w-full relative">
                  <canvas id="dropdownTempChart_${d.id}"></canvas>
                </div>
              </div>

              <div class="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div class="flex justify-between items-center text-xs mb-2">
                  <span class="font-bold text-slate-800">Vibration RMS vs Time</span>
                  <span class="text-[10px] font-semibold text-amber-700">MPU6050 (g)</span>
                </div>
                <div class="h-32 w-full relative">
                  <canvas id="dropdownVibChart_${d.id}"></canvas>
                </div>
              </div>

              <div class="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div class="flex justify-between items-center text-xs mb-2">
                  <span class="font-bold text-slate-800">Current Draw vs Time</span>
                  <span class="text-[10px] font-semibold text-emerald-700">ACS712 (Amps)</span>
                </div>
                <div class="h-32 w-full relative">
                  <canvas id="dropdownCurrChart_${d.id}"></canvas>
                </div>
              </div>

            </div>

            <!-- SECTION C: INTERACTIVE CONTROL FORMS -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              
              <!-- Temperature Setpoint & Manual Override -->
              <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div class="flex justify-between items-center border-b pb-2">
                  <span class="font-bold text-slate-900">Temperature Maintenance &amp; Manual Override</span>
                  <span id="dropdownRelay_${d.id}" class="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">${d.tempConfig.coolingRelay}</span>
                </div>

                <div>
                  <div class="flex justify-between items-center mb-1">
                    <span class="text-slate-600">Target Operating Temp:</span>
                    <strong id="dropdownTargetTempVal_${d.id}" class="text-blue-700">${d.tempConfig.targetTemp}°C</strong>
                  </div>
                  <input type="range" min="30" max="85" step="0.5" value="${d.tempConfig.targetTemp}" 
                    oninput="onTargetTempSliderChange('${d.id}', this.value)"
                    class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600">
                </div>

                <!-- Manual Value Injector -->
                <div class="p-2.5 rounded bg-white border border-slate-200 space-y-2">
                  <div class="flex justify-between items-center">
                    <span class="font-bold text-slate-800 text-[11px]">Manual Value Setting</span>
                    <label class="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" ${d.tempConfig.manualOverride ? 'checked' : ''} 
                        onchange="onManualOverrideToggle('${d.id}', this.checked)"
                        class="w-3.5 h-3.5 text-blue-600">
                      <span class="text-[10px] font-semibold">Override Active</span>
                    </label>
                  </div>

                  <div class="grid grid-cols-3 gap-1.5 text-[10px]">
                    <div>
                      <label>Manual Temp (°C)</label>
                      <input type="number" step="0.5" value="${d.tempConfig.manualTemp}" 
                        onchange="onManualValueInput('${d.id}', 'manualTemp', this.value)"
                        class="w-full px-1.5 py-1 border rounded bg-slate-50">
                    </div>
                    <div>
                      <label>Manual Vib (g)</label>
                      <input type="number" step="0.01" value="${d.tempConfig.manualVib}" 
                        onchange="onManualValueInput('${d.id}', 'manualVib', this.value)"
                        class="w-full px-1.5 py-1 border rounded bg-slate-50">
                    </div>
                    <div>
                      <label>Manual Current (A)</label>
                      <input type="number" step="0.1" value="${d.tempConfig.manualCurrent}" 
                        onchange="onManualValueInput('${d.id}', 'manualCurrent', this.value)"
                        class="w-full px-1.5 py-1 border rounded bg-slate-50">
                    </div>
                  </div>
                </div>
              </div>

              <!-- Working Timings & Electricity in ₹ INR -->
              <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div class="flex justify-between items-center border-b pb-2">
                  <span class="font-bold text-slate-900">Shift Timings &amp; ₹ INR Billing</span>
                  <span class="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">₹ ${d.schedule.tariffInr}/kWh</span>
                </div>

                <div class="grid grid-cols-3 gap-2">
                  <div>
                    <label class="text-[10px] text-slate-500 block">Shift Start</label>
                    <input type="time" value="${d.schedule.shiftStart}" 
                      onchange="devices['${d.id}'].schedule.shiftStart = this.value;"
                      class="w-full px-2 py-1 border rounded bg-white text-xs">
                  </div>
                  <div>
                    <label class="text-[10px] text-slate-500 block">Shift End</label>
                    <input type="time" value="${d.schedule.shiftEnd}" 
                      onchange="devices['${d.id}'].schedule.shiftEnd = this.value;"
                      class="w-full px-2 py-1 border rounded bg-white text-xs">
                  </div>
                  <div>
                    <label class="text-[10px] text-slate-500 block">Tariff (₹/kWh)</label>
                    <input type="number" step="0.25" value="${d.schedule.tariffInr}" 
                      onchange="devices['${d.id}'].schedule.tariffInr = parseFloat(this.value);"
                      class="w-full px-2 py-1 border rounded bg-white text-xs">
                  </div>
                </div>

                <!-- Simulation Scenarios inside dropdown -->
                <div class="pt-2 border-t border-slate-200">
                  <div class="text-[10px] font-bold text-slate-600 mb-1.5">Quick Scenario Injection:</div>
                  <div class="grid grid-cols-4 gap-1.5 text-[10px]">
                    <button onclick="injectDeviceScenario('${d.id}', 'NORMAL')" class="p-1 rounded bg-white hover:bg-slate-100 border text-slate-700 font-semibold text-center">
                      🟢 Normal
                    </button>
                    <button onclick="injectDeviceScenario('${d.id}', 'WARNING')" class="p-1 rounded bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-semibold text-center">
                      🟡 Vib Wear
                    </button>
                    <button onclick="injectDeviceScenario('${d.id}', 'FAULT')" class="p-1 rounded bg-red-50 hover:bg-red-100 border border-red-300 text-red-900 font-semibold text-center">
                      🔴 Overload
                    </button>
                    <button onclick="injectDeviceScenario('${d.id}', 'SENSOR_FAILURE')" class="p-1 rounded bg-purple-50 hover:bg-purple-100 border border-purple-300 text-purple-900 font-semibold text-center">
                      🟣 Sensor Fail
                    </button>
                  </div>
                </div>

              </div>

            </div>

            <!-- Actions Footer inside dropdown -->
            <div class="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button onclick="toggleInspectDropdown('${d.id}')" class="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold">
                ▲ Close Performance View
              </button>
            </div>
          </div>

        </div>
      `;
    });

    container.innerHTML = html;

    // Initialize 3D Twin & charts for opened dropdowns
    Object.keys(devices).forEach(devId => {
      if (devices[devId].isDropdownOpen) {
        setTimeout(() => {
          initDropdown3DMotor(devices[devId]);
          initDropdownChartsForDevice(devices[devId]);
        }, 70);
      }
    });

  } else {
    // In-place DOM update without re-creating canvases or losing user input focus!
    Object.keys(devices).forEach(devId => {
      const d = devices[devId];
      const aiHealth = calculateAiHealthScore(d);
      const aiMaint = calculateAiMaintenanceDate(d);

      const badgeEl = document.getElementById(`cardBadge_${d.id}`);
      if (badgeEl) {
        badgeEl.innerText = d.telemetry.motorHealth;
        badgeEl.className = `text-xs font-bold px-2 py-0.5 rounded border ${getStatusBadgeClass(d.telemetry.motorHealth)}`;
      }

      const tempEl = document.getElementById(`cardTemp_${d.id}`);
      if (tempEl) tempEl.innerText = `${d.telemetry.temp.toFixed(1)}°C`;

      const targetEl = document.getElementById(`cardTargetTemp_${d.id}`);
      if (targetEl) targetEl.innerText = `Set: ${d.tempConfig.targetTemp.toFixed(1)}°C`;

      const vibEl = document.getElementById(`cardVib_${d.id}`);
      if (vibEl) vibEl.innerText = `${d.telemetry.vibRms.toFixed(3)}g`;

      const isoEl = document.getElementById(`cardIso_${d.id}`);
      if (isoEl) {
        isoEl.innerText = d.telemetry.isoZone.split(' ')[0];
        isoEl.className = `text-[10px] font-semibold ${getIsoTextColor(d.telemetry.isoZone)}`;
      }

      const aiHealthEl = document.getElementById(`cardAiHealth_${d.id}`);
      if (aiHealthEl) {
        aiHealthEl.innerText = `${aiHealth.score}%`;
        aiHealthEl.className = `text-base font-extrabold ${aiHealth.score > 80 ? 'text-emerald-700' : (aiHealth.score > 50 ? 'text-amber-700' : 'text-red-700')}`;
      }

      const aiMaintEl = document.getElementById(`cardAiMaint_${d.id}`);
      if (aiMaintEl) aiMaintEl.innerText = `Due: ${aiMaint.dateStr}`;

      const costEl = document.getElementById(`cardCost_${d.id}`);
      if (costEl) costEl.innerText = `₹ ${d.schedule.costTodayInr.toFixed(2)} INR`;

      // Update in dropdown if open
      if (d.isDropdownOpen) {
        // Sub-bar numbers beneath this motor's own 3D twin
        const t3D = document.getElementById(`dropdown3DTemp_${d.id}`);
        const v3D = document.getElementById(`dropdown3DVib_${d.id}`);
        const c3D = document.getElementById(`dropdown3DCurr_${d.id}`);
        const p3D = document.getElementById(`dropdown3DPower_${d.id}`);

        if (t3D) t3D.innerText = `${d.telemetry.temp.toFixed(1)}°C`;
        if (v3D) v3D.innerText = `${d.telemetry.vibRms.toFixed(3)}g`;
        if (c3D) c3D.innerText = `${d.telemetry.current.toFixed(2)}A`;
        if (p3D) p3D.innerText = `${d.telemetry.powerWatts}W`;

        const dropScore = document.getElementById(`dropdownAiScore_${d.id}`);
        if (dropScore) dropScore.innerText = `${aiHealth.score}%`;

        const dropClass = document.getElementById(`dropdownAiClass_${d.id}`);
        if (dropClass) dropClass.innerText = aiHealth.classification;

        const dropConf = document.getElementById(`dropdownAiConf_${d.id}`);
        if (dropConf) dropConf.innerText = `${aiHealth.confidence}% Model Confidence`;

        const dropMaintDate = document.getElementById(`dropdownMaintDate_${d.id}`);
        if (dropMaintDate) dropMaintDate.innerText = `📅 ${aiMaint.dateStr}`;

        const dropMaintDays = document.getElementById(`dropdownMaintDays_${d.id}`);
        if (dropMaintDays) dropMaintDays.innerText = `Remaining: ~${aiMaint.daysRemaining} Days (${aiMaint.effectiveRulHours} Run Hours)`;

        const dropWear = document.getElementById(`dropdownWear_${d.id}`);
        if (dropWear) dropWear.innerText = `${d.schedule.wearTearIndex.toFixed(1)}% Wear Stress (${aiMaint.stressMultiplier}x rate)`;

        const dropMonthly = document.getElementById(`dropdownMonthly_${d.id}`);
        if (dropMonthly) dropMonthly.innerText = `Monthly Proj: ₹ ${d.schedule.monthlyProjectedInr.toFixed(1)} INR`;

        const dropRelay = document.getElementById(`dropdownRelay_${d.id}`);
        if (dropRelay) dropRelay.innerText = d.tempConfig.coolingRelay;
      }
    });
  }
}

function onTargetTempSliderChange(deviceId, val) {
  if (!devices[deviceId]) return;
  devices[deviceId].tempConfig.targetTemp = parseFloat(val);
  const el = document.getElementById(`dropdownTargetTempVal_${deviceId}`);
  if (el) el.innerText = `${parseFloat(val).toFixed(1)}°C`;
  const cardEl = document.getElementById(`cardTargetTemp_${deviceId}`);
  if (cardEl) cardEl.innerText = `Set: ${parseFloat(val).toFixed(1)}°C`;
}

function onManualOverrideToggle(deviceId, isChecked) {
  if (!devices[deviceId]) return;
  devices[deviceId].tempConfig.manualOverride = isChecked;
  const tag = document.getElementById(`cardManualTag_${deviceId}`);
  if (tag) tag.style.display = isChecked ? 'inline-block' : 'none';
}

function onManualValueInput(deviceId, field, val) {
  if (!devices[deviceId]) return;
  devices[deviceId].tempConfig[field] = parseFloat(val);
  devices[deviceId].tempConfig.manualOverride = true;
  const tag = document.getElementById(`cardManualTag_${deviceId}`);
  if (tag) tag.style.display = 'inline-block';
}

function injectDeviceScenario(deviceId, scenario) {
  if (!devices[deviceId]) return;
  devices[deviceId].scenario = scenario;
  addLog('INFO', `Injected scenario '${scenario}' on ${deviceId}.`);
  updateFleetSummaryCards(false);
}

function getIsoTextColor(zone) {
  if (zone.includes('Zone A')) return 'text-emerald-700';
  if (zone.includes('Zone B')) return 'text-blue-700';
  if (zone.includes('Zone C')) return 'text-amber-700';
  return 'text-red-700';
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'NORMAL': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'WARNING': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'FAULT': return 'bg-red-100 text-red-800 border-red-200';
    case 'SENSOR_FAULT': return 'bg-purple-100 text-purple-800 border-purple-200';
    default: return 'bg-slate-100 text-slate-800 border-slate-200';
  }
}

// -------------------------------------------------------------
// ADD MACHINE MODAL & AUTH
// -------------------------------------------------------------
function openAddMachineModal() {
  const modal = document.getElementById('addMachineModal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeAddMachineModal() {
  const modal = document.getElementById('addMachineModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function handleAddMachineSubmit(e) {
  e.preventDefault();

  const idInput = document.getElementById('newMachineId').value.trim().toUpperCase();
  const nameInput = document.getElementById('newMachineName').value.trim();
  const appInput = document.getElementById('newMachineApp').value.trim();
  const locInput = document.getElementById('newMachineLocation').value.trim();
  const powerInput = parseFloat(document.getElementById('newMachinePower').value) || 1.1;
  const flaInput = parseFloat(document.getElementById('newMachineFla').value) || 2.4;
  const voltInput = parseInt(document.getElementById('newMachineVoltage').value, 10) || 415;
  const targetTempInput = parseFloat(document.getElementById('newMachineTargetTemp').value) || 45.0;
  const tariffInput = parseFloat(document.getElementById('newMachineTariff').value) || 8.00;

  if (!idInput || !nameInput) {
    alert("Please provide a valid Machine ID and Machine Name.");
    return;
  }

  if (devices[idInput]) {
    alert(`Machine with ID '${idInput}' already exists.`);
    return;
  }

  const newDev = {
    id: idInput,
    name: nameInput,
    application: appInput || 'Industrial Machine Drive',
    powerKw: powerInput,
    ratedFla: flaInput,
    voltage: voltInput,
    location: locInput || 'Workshop Bay',
    scenario: 'NORMAL',
    telemetry: {
      temp: targetTempInput - 2.5,
      vibRms: 0.055,
      vibPeak: 0.088,
      current: +(flaInput * 0.72).toFixed(2),
      powerWatts: Math.round(voltInput * flaInput * 0.72 * 0.88),
      motorHealthScore: 98,
      motorHealth: 'NORMAL',
      isoZone: 'Zone A (Good)',
      failureRisk: 'LOW',
      failureRiskScore: 5,
      rulHours: 9000
    },
    sensors: { ds18b20: 'OK', mpu6050: 'OK', acs712: 'OK', esp32: 'OK' },
    tempConfig: {
      targetTemp: targetTempInput,
      warningThreshold: targetTempInput + 18.0,
      tripThreshold: targetTempInput + 30.0,
      coolingRelay: 'IDLE',
      manualOverride: false,
      manualTemp: targetTempInput,
      manualVib: 0.06,
      manualCurrent: flaInput * 0.75
    },
    schedule: {
      shiftStart: '08:00',
      shiftEnd: '18:00',
      operatingDays: 6,
      tariffInr: tariffInput,
      isShiftActive: true,
      hoursRunToday: 1.2,
      kwhToday: 0.95,
      costTodayInr: +(0.95 * tariffInput).toFixed(2),
      monthlyProjectedInr: +(0.95 * tariffInput * 6 * 4.3).toFixed(2),
      wearTearIndex: 12.0,
      wearTearAdvice: 'Newly commissioned unit. Initial break-in period optimal.'
    },
    history: { labels: [], temp: [], vib: [], current: [] },
    abnormalActivities: [],
    isDropdownOpen: true // Open newly added machine dropdown automatically with its own 3D twin
  };

  const initialTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  for (let i = 6; i >= 0; i--) {
    newDev.history.labels.push(initialTime);
    newDev.history.temp.push(newDev.telemetry.temp);
    newDev.history.vib.push(newDev.telemetry.vibRms);
    newDev.history.current.push(newDev.telemetry.current);
  }

  devices[idInput] = newDev;

  try {
    const custom = JSON.parse(localStorage.getItem('iiot_custom_machines') || '{}');
    custom[idInput] = newDev;
    localStorage.setItem('iiot_custom_machines', JSON.stringify(custom));
  } catch (e) {}

  updateFleetSummaryCards(true); // Rebuild cards with new machine & 3D twin
  closeAddMachineModal();
  globalState.activeDeviceId = idInput;

  addLog('INFO', `Successfully deployed new machine ${idInput} with dedicated 3D Digital Twin.`);
  alert(`Machine ${idInput} deployed successfully into active monitoring fleet!`);
}

function checkUserAuthHeader() {
  try {
    const raw = localStorage.getItem('iiot_auth');
    const auth = raw ? JSON.parse(raw) : null;
    const authBadge = document.getElementById('userAuthStatusBadge');
    const authAction = document.getElementById('userAuthAction');

    if (authBadge && authAction) {
      if (auth && auth.role === 'developer') {
        authBadge.className = 'text-xs font-bold px-2.5 py-1 rounded bg-blue-100 text-blue-900 border border-blue-300';
        authBadge.innerHTML = '🔧 <strong>Maintaince Developer</strong>';
        authAction.innerText = 'Log Out';
        authAction.href = 'login.html';
      } else if (auth && auth.username) {
        authBadge.className = 'text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-800 border border-slate-300';
        authBadge.innerHTML = `👤 Operator: <strong>${auth.username}</strong>`;
        authAction.innerText = 'Switch Portal';
        authAction.href = 'login.html';
      } else {
        authBadge.className = 'text-xs font-medium px-2.5 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200';
        authBadge.innerHTML = '👤 Operator Mode';
        authAction.innerText = 'Developer Login';
        authAction.href = 'login.html#developer';
      }
    }
  } catch (e) {}
}

function addLog(level, msg) {
  const time = new Date().toLocaleTimeString();
  globalState.systemLogs.unshift({ time, level, msg });
  if (globalState.systemLogs.length > 50) globalState.systemLogs.pop();
  renderLogs();
}

function renderLogs() {
  const container = document.getElementById('logStreamContainer');
  if (!container) return;

  container.innerHTML = globalState.systemLogs.map(l => {
    let color = 'text-slate-700';
    if (l.level === 'CRITICAL') color = 'text-red-700 font-semibold';
    if (l.level === 'WARNING') color = 'text-amber-700 font-semibold';
    return `<div class="py-1 border-b border-slate-100 flex items-start gap-2 text-[11px]">
      <span class="text-slate-400 font-mono shrink-0">${l.time}</span>
      <span class="${color}">${l.msg}</span>
    </div>`;
  }).join('');
}

// -------------------------------------------------------------
// PDF REPORT (Includes AI Health Score & AI Maintenance Date)
// -------------------------------------------------------------
function downloadComprehensivePdfReport() {
  try {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
      alert("jsPDF library loading... Please check connection.");
      return;
    }

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-IN');

    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.text("IIOT Predictive Maintenance System - Audit Report", 14, 12);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${dateStr} at ${timeStr} | Official Industrial Fleet Audit`, 14, 19);
    doc.text("Team Penguin Engineering Portal | Currency: INR (Rs.)", 14, 24);

    let startY = 34;

    // Section 1: Fleet Executive Status Table
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("1. Rotating Asset Fleet Health & AI Maintenance Forecast", 14, startY);

    const fleetRows = Object.keys(devices).map(id => {
      const d = devices[id];
      const aiHealth = calculateAiHealthScore(d);
      const aiMaint = calculateAiMaintenanceDate(d);
      return [
        d.id,
        d.name,
        d.telemetry.motorHealth,
        `${d.telemetry.temp.toFixed(1)} C (Set: ${d.tempConfig.targetTemp} C)`,
        `${d.telemetry.vibRms.toFixed(3)}g (${d.telemetry.isoZone.split(' ')[0]})`,
        `${aiHealth.score}% (${aiHealth.classification.split('/')[0].trim()})`,
        aiMaint.dateStr,
        `Rs. ${d.schedule.costTodayInr.toFixed(2)}`
      ];
    });

    doc.autoTable({
      startY: startY + 4,
      head: [['ID', 'Machine Name', 'Health', 'Temperature', 'Vibration RMS', 'AI Health Score', 'AI Maint Date', 'Cost Today']],
      body: fleetRows,
      theme: 'grid',
      headStyles: { fillColor: [29, 78, 216], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7.5 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 }
    });

    // Section 2: Abnormal Activities & Anomaly Register
    startY = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("2. Abnormal Activities & Incident Register", 14, startY);

    let allAnomalies = [];
    Object.keys(devices).forEach(id => {
      devices[id].abnormalActivities.forEach(a => allAnomalies.push(a));
    });

    if (allAnomalies.length === 0) {
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("No active abnormal incidents recorded during current telemetry session. All rotating assets operating within ISO 10816 limits.", 14, startY + 5);
      startY += 10;
    } else {
      const anomalyRows = allAnomalies.slice(0, 15).map(a => [
        a.timestamp,
        a.deviceId,
        a.sensor,
        a.severity,
        a.description,
        a.action
      ]);

      doc.autoTable({
        startY: startY + 4,
        head: [['Time', 'Device', 'Sensor/Tag', 'Severity', 'Abnormal Activity Description', 'Corrective Action']],
        body: anomalyRows,
        theme: 'grid',
        headStyles: { fillColor: [185, 28, 28], fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7 },
        alternateRowStyles: { fillColor: [254, 242, 242] },
        margin: { left: 14, right: 14 }
      });
      startY = doc.lastAutoTable.finalY + 8;
    }

    // Section 3: High-Resolution Telemetry Snapshot
    if (startY > 220) {
      doc.addPage();
      startY = 20;
    }

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("3. Raw Telemetry Stream Snapshot (Last 15 Packets)", 14, startY);

    const logRows = globalState.allReadingsLog.slice(-15).reverse().map(l => [
      l.timestamp,
      l.deviceId,
      `${l.temp.toFixed(1)} C`,
      `${l.vibRms.toFixed(3)}g`,
      `${l.current.toFixed(2)} A`,
      `${l.powerWatts} W`,
      `${l.aiHealthScore}%`,
      l.aiMaintDate,
      l.status
    ]);

    doc.autoTable({
      startY: startY + 4,
      head: [['Timestamp', 'Device ID', 'Temp', 'Vibration', 'Current', 'Power', 'AI Health', 'AI Maint Date', 'Status']],
      body: logRows.length > 0 ? logRows : [['--', '--', '--', '--', '--', '--', '--', '--', 'NO LOGS']],
      theme: 'grid',
      headStyles: { fillColor: [71, 85, 105], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 }
    });

    // Developer Credits Footer on Every Page
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFillColor(241, 245, 249);
      doc.rect(0, 282, pageWidth, 15, 'F');
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("ALL CREDITS AND DEVELOPED BY TEAM PENGUIN", 14, 287);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text("1. Syed Siddiq Hussaini 160524747018 | 2. Syed Rafay Ali 160524747055 | 3. Mohammed Abdul Raheem 160524747053", 14, 292);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 26, 290);
    }

    doc.save(`IIOT_Fleet_Audit_Report_${Date.now()}.pdf`);
    addLog('INFO', 'Generated and downloaded comprehensive PDF audit report.');
  } catch (err) {
    console.error("PDF generation failed:", err);
    alert("PDF generation failed. See console for details.");
  }
}

// -------------------------------------------------------------
// EVENT LISTENERS & SETUP
// -------------------------------------------------------------
function setupEventListeners() {
  const btnOpenAdd = document.getElementById('btnOpenAddMachineModal');
  if (btnOpenAdd) btnOpenAdd.addEventListener('click', openAddMachineModal);

  const btnCloseAdd = document.getElementById('btnCloseAddMachineModal');
  if (btnCloseAdd) btnCloseAdd.addEventListener('click', closeAddMachineModal);

  const formAdd = document.getElementById('addMachineForm');
  if (formAdd) formAdd.addEventListener('submit', handleAddMachineSubmit);

  const btnPause = document.getElementById('btnPause');
  if (btnPause) {
    btnPause.addEventListener('click', () => {
      globalState.isPaused = !globalState.isPaused;
      btnPause.innerHTML = globalState.isPaused ? '▶ Resume' : '⏸ Pause';
      addLog('INFO', globalState.isPaused ? 'Telemetry paused.' : 'Telemetry resumed.');
    });
  }

  const sampleRateSelect = document.getElementById('sampleRateSelect');
  if (sampleRateSelect) {
    sampleRateSelect.addEventListener('change', (e) => {
      globalState.sampleRateMs = parseInt(e.target.value, 10);
      clearInterval(simulationInterval);
      simulationInterval = setInterval(tickSimulation, globalState.sampleRateMs);
      addLog('INFO', `Sample rate set to ${globalState.sampleRateMs}ms.`);
    });
  }

  const btnToggleAudio = document.getElementById('btnToggleAudio');
  if (btnToggleAudio) {
    btnToggleAudio.addEventListener('click', () => {
      initAudioContext();
      globalState.isAudioMuted = !globalState.isAudioMuted;
      btnToggleAudio.innerText = globalState.isAudioMuted ? '🔇 Buzzer Muted' : '🔔 Buzzer Armed';
      evaluateFleetAbnormalities();
    });
  }

  const btnDownloadPdf = document.getElementById('btnDownloadPdf');
  if (btnDownloadPdf) {
    btnDownloadPdf.addEventListener('click', downloadComprehensivePdfReport);
  }
}

let simulationInterval = null;
document.addEventListener('DOMContentLoaded', () => {
  loadCustomMachines();
  checkUserAuthHeader();
  setupEventListeners();

  const initialTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  Object.keys(devices).forEach(devId => {
    const d = devices[devId];
    if (!d.history.labels || d.history.labels.length === 0) {
      d.history.labels = [];
      d.history.temp = [];
      d.history.vib = [];
      d.history.current = [];
      for (let i = 6; i >= 0; i--) {
        d.history.labels.push(initialTime);
        d.history.temp.push(d.telemetry.temp);
        d.history.vib.push(d.telemetry.vibRms);
        d.history.current.push(d.telemetry.current);
      }
    }
  });

  updateFleetSummaryCards(true); // Initial build of all cards and open dropdowns

  // Start the 3D animation engine (powers all open dropdown 3D digital twins)
  animateAll3D();

  addLog('INFO', 'IIOT Predictive Maintenance System initialized with inspect-panel 3D Digital Twins.');

  simulationInterval = setInterval(tickSimulation, globalState.sampleRateMs);
});
