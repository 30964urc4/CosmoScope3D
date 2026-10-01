import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class SolarSystemViewer3D {
  constructor(containerElement, onHoverCallback, onClickCallback) {
    this.container = containerElement;
    this.onHover = onHoverCallback;
    this.onClick = onClickCallback;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-999, -999);
    
    // View Modes: 'system' or 'galaxy'
    this.viewMode = 'system';

    // Scene groups
    this.starsGroup = new THREE.Group();
    this.planetsGroup = new THREE.Group();
    this.orbitsGroup = new THREE.Group();
    this.hzGroup = new THREE.Group();
    this.labelsGroup = new THREE.Group();
    
    // Galaxy / Earth-Centered coordinate groups
    this.galaxyGroup = new THREE.Group();
    this.earthOriginGroup = new THREE.Group();
    this.celestialGridGroup = new THREE.Group();
    this.laserVectorLine = null;
    this.starField = null;

    // State
    this.allSystems = [];
    this.currentSystem = null;
    this.planetsData = [];
    this.planetMeshes = [];
    this.starMeshes = [];
    this.galaxyStarPoints = [];
    this.interactiveObjects = [];
    this.hoveredObject = null;
    this.focusedObject = null;
    
    this.simSpeed = 1.0;
    this.showHabitableZone = true;
    this.showOrbits = true;
    this.showGrid = true;
    this.showLabels = true;
    this.clock = new THREE.Clock();

    this.init();
  }

  init() {
    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x05070c, 0.0008);

    // 2. Camera setup
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 8000);
    this.camera.position.set(0, 50, 75);

    // 3. Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);

    // 4. Orbit Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxDistance = 3500;
    this.controls.minDistance = 2;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0x334155, 0.6);
    this.scene.add(ambientLight);

    // Add groups
    this.scene.add(this.starsGroup);
    this.scene.add(this.planetsGroup);
    this.scene.add(this.orbitsGroup);
    this.scene.add(this.hzGroup);
    this.scene.add(this.labelsGroup);
    this.scene.add(this.galaxyGroup);
    this.scene.add(this.earthOriginGroup);
    this.scene.add(this.celestialGridGroup);

    // Background stars & Earth-centered celestial grid
    this.createBackgroundStars();
    this.createEarthOriginBeacon();
    this.createCelestialGrid();

    // Hide galaxy group initially
    this.galaxyGroup.visible = false;
    this.earthOriginGroup.visible = false;
    this.celestialGridGroup.visible = false;

    // Event listeners
    window.addEventListener('resize', () => this.onWindowResize());
    this.container.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.container.addEventListener('click', (e) => this.onMouseClick(e));

    // Start loop
    this.animate();
  }

  setSystemsData(systems) {
    this.allSystems = systems;
    this.buildGalaxyMap();
  }

  // =========================================================================
  // EARTH ORIGIN [0,0,0] & CELESTIAL COORDINATE GRID
  // =========================================================================

  createEarthOriginBeacon() {
    // Earth / Sun Beacon at [0,0,0]
    const beaconGeom = new THREE.SphereGeometry(3.5, 32, 32);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const beaconMesh = new THREE.Mesh(beaconGeom, beaconMat);
    beaconMesh.position.set(0, 0, 0);

    const glowGeom = new THREE.SphereGeometry(6.0, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35, side: THREE.BackSide });
    const glowMesh = new THREE.Mesh(glowGeom, glowMat);
    beaconMesh.add(glowMesh);

    // Earth Origin Label Sprite
    const label = this.createPlanetLabel("TIERRA / SISTEMA SOLAR [0,0,0]", true);
    label.position.set(0, 7.5, 0);
    beaconMesh.add(label);

    this.earthOriginGroup.add(beaconMesh);

    // Coordinate Axes (X: Red [RA 0h], Y: Green [RA 6h], Z: Blue [North Celestial Pole +90° Dec])
    const axesHelper = new THREE.AxesHelper(150);
    this.earthOriginGroup.add(axesHelper);
  }

  createCelestialGrid() {
    // Concentric distance reference rings from Earth in Light-Years: 25, 100, 500, 1000, 2500 AL
    const distances = [25, 100, 500, 1000, 2500];
    const ringMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.2 });

    distances.forEach(dist => {
      const pts = [];
      for (let i = 0; i <= 128; i++) {
        const theta = (i / 128) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(theta) * dist, 0, Math.sin(theta) * dist));
      }
      const geom = new THREE.BufferGeometry().setFromPoints(pts);
      const ringLine = new THREE.Line(geom, ringMat);
      this.celestialGridGroup.add(ringLine);

      // Distance marker label
      const distLabel = this.createPlanetLabel(`${dist} Años Luz`, false);
      distLabel.position.set(dist, 2, 0);
      distLabel.scale.set(12, 3, 1);
      this.celestialGridGroup.add(distLabel);
    });

    // Equatorial Plane Grid
    const gridHelper = new THREE.GridHelper(3000, 30, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -0.5;
    this.celestialGridGroup.add(gridHelper);
  }

  buildGalaxyMap() {
    // Remove old points
    while (this.galaxyGroup.children.length > 0) {
      this.galaxyGroup.remove(this.galaxyGroup.children[0]);
    }
    this.galaxyStarPoints = [];

    const starCount = this.allSystems.length;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    this.allSystems.forEach((sys, i) => {
      let x = 0, y = 0, z = 0;
      if (sys.coordsEarth && sys.coordsEarth.x !== null) {
        x = sys.coordsEarth.x;
        y = sys.coordsEarth.y;
        z = sys.coordsEarth.z;
      } else {
        // Fallback procedural offset if no distance known
        const r = sys.distanceLy || 100;
        const theta = (i * 0.1) % (Math.PI * 2);
        x = Math.cos(theta) * r;
        y = Math.sin(theta) * r;
        z = (Math.sin(i) * r * 0.2);
      }

      positions[i * 3] = x;
      positions[i * 3 + 1] = z; // Map Dec (Z) to Three.js Y up
      positions[i * 3 + 2] = y;

      const hasHz = (sys.planets || []).some(p => p.inHabitableZone);
      if (sys.name === 'Sistema Solar') {
        colors[i * 3] = 0.2; colors[i * 3 + 1] = 0.8; colors[i * 3 + 2] = 1.0; // Cyan Earth
      } else if (hasHz) {
        colors[i * 3] = 0.1; colors[i * 3 + 1] = 0.9; colors[i * 3 + 2] = 0.4; // Green Habitable
      } else if (sys.starsCount > 1) {
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.7; colors[i * 3 + 2] = 0.1; // Gold Binary
      } else {
        colors[i * 3] = 0.9; colors[i * 3 + 1] = 0.9; colors[i * 3 + 2] = 1.0; // White/Blue
      }

      // Individual mesh for hover interaction in galaxy view (for famous & close systems)
      if (i < 300 || hasHz || sys.starsCount > 1) {
        const pGeom = new THREE.SphereGeometry(sys.name === 'Sistema Solar' ? 3.0 : 1.8, 8, 8);
        const pMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2])
        });
        const pMesh = new THREE.Mesh(pGeom, pMat);
        pMesh.position.set(x, z, y);
        pMesh.userData = {
          type: 'galaxy_system',
          systemData: sys,
          name: sys.name,
          distLy: sys.distanceLy,
          coordsEarth: sys.coordsEarth,
          raHms: sys.raHms,
          decDms: sys.decDms,
          constellation: sys.constellation
        };
        this.galaxyGroup.add(pMesh);
        this.galaxyStarPoints.push(pMesh);
      }
    });

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starPointsMat = new THREE.PointsMaterial({
      size: 4.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.9
    });

    const starPoints = new THREE.Points(geometry, starPointsMat);
    this.galaxyGroup.add(starPoints);
  }

  updateLaserTargetVector(targetSystem) {
    if (this.laserVectorLine) {
      this.galaxyGroup.remove(this.laserVectorLine);
      this.laserVectorLine = null;
    }

    if (!targetSystem || targetSystem.name === 'Sistema Solar') return;

    let targetX = 0, targetY = 0, targetZ = 0;
    if (targetSystem.coordsEarth && targetSystem.coordsEarth.x !== null) {
      targetX = targetSystem.coordsEarth.x;
      targetY = targetSystem.coordsEarth.z; // mapped to Y
      targetZ = targetSystem.coordsEarth.y; // mapped to Z
    }

    const pts = [
      new THREE.Vector3(0, 0, 0), // Earth origin [0,0,0]
      new THREE.Vector3(targetX, targetY, targetZ)
    ];

    const geom = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.75,
      linewidth: 2
    });

    this.laserVectorLine = new THREE.Line(geom, mat);
    this.galaxyGroup.add(this.laserVectorLine);
  }

  setViewMode(mode) {
    this.viewMode = mode;

    if (mode === 'galaxy') {
      // Show Earth-centered galaxy map
      this.starsGroup.visible = false;
      this.planetsGroup.visible = false;
      this.orbitsGroup.visible = false;
      this.hzGroup.visible = false;
      this.labelsGroup.visible = false;

      this.galaxyGroup.visible = true;
      this.earthOriginGroup.visible = true;
      this.celestialGridGroup.visible = this.showGrid;

      // Update interactive objects to galaxy star meshes
      this.interactiveObjects = [...this.galaxyStarPoints];

      // Camera view from Earth perspective looking out
      this.camera.position.set(0, 400, 800);
      this.controls.target.set(0, 0, 0);
      this.controls.maxDistance = 4000;
      this.controls.minDistance = 10;
      this.controls.update();

      if (this.currentSystem) {
        this.updateLaserTargetVector(this.currentSystem);
      }

    } else {
      // Show individual system view
      this.galaxyGroup.visible = false;
      this.earthOriginGroup.visible = false;
      this.celestialGridGroup.visible = false;

      this.starsGroup.visible = true;
      this.planetsGroup.visible = true;
      this.orbitsGroup.visible = this.showOrbits;
      this.hzGroup.visible = this.showHabitableZone;
      this.labelsGroup.visible = this.showLabels;

      this.interactiveObjects = [...this.starMeshes, ...this.planetMeshes];
      this.adjustCameraForSystem();
    }
  }

  createBackgroundStars() {
    const starCount = 1800;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const r = 1200 + Math.random() * 1200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const colorVariance = Math.random();
      if (colorVariance > 0.8) {
        colors[i * 3] = 0.6; colors[i * 3 + 1] = 0.8; colors[i * 3 + 2] = 1.0;
      } else if (colorVariance > 0.6) {
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.85; colors[i * 3 + 2] = 0.5;
      } else {
        colors[i * 3] = 0.9; colors[i * 3 + 1] = 0.9; colors[i * 3 + 2] = 1.0;
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 1.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.85
    });

    this.starField = new THREE.Points(geometry, material);
    this.scene.add(this.starField);
  }

  getStarColor(teff) {
    if (!teff) return { hex: 0xffd166, colorStr: '#ffd166' };
    if (teff < 3500) return { hex: 0xff4d4d, colorStr: '#ff4d4d' }; // Red dwarf (M)
    if (teff < 5000) return { hex: 0xffaa44, colorStr: '#ffaa44' }; // Orange dwarf (K)
    if (teff < 6000) return { hex: 0xffea78, colorStr: '#ffea78' }; // Yellow dwarf (G)
    if (teff < 7500) return { hex: 0xffffff, colorStr: '#ffffff' }; // Yellow-white (F)
    if (teff < 10000) return { hex: 0xc8e6ff, colorStr: '#c8e6ff' }; // White-blue (A)
    return { hex: 0x88ccff, colorStr: '#88ccff' }; // Blue giant (B/O)
  }

  loadSystem(systemData) {
    this.currentSystem = systemData;
    this.clearSystemScene();

    const starCount = systemData.starsCount || 1;
    const teff = systemData.starTeff || 5778;
    const starColorInfo = this.getStarColor(teff);

    // 1. Central Star(s)
    if (starCount === 1) {
      const starRadius = Math.max(2.2, Math.min(6.0, (systemData.starRadius || 1.0) * 3.0));
      const starGeom = new THREE.SphereGeometry(starRadius, 32, 32);
      const starMat = new THREE.MeshBasicMaterial({ color: starColorInfo.hex });
      const starMesh = new THREE.Mesh(starGeom, starMat);
      starMesh.userData = {
        type: 'star',
        name: systemData.name,
        teff: teff,
        specType: systemData.starSpecType || 'G2V',
        radiusSolar: systemData.starRadius || 1.0,
        massSolar: systemData.starMass || 1.0,
        distLy: systemData.distanceLy,
        raHms: systemData.raHms,
        decDms: systemData.decDms,
        constellation: systemData.constellation,
        coordsEarth: systemData.coordsEarth,
        customDesc: systemData.customDesc || systemData.description
      };
      
      const glowGeom = new THREE.SphereGeometry(starRadius * 1.3, 32, 32);
      const glowMat = new THREE.MeshBasicMaterial({
        color: starColorInfo.hex,
        transparent: true,
        opacity: 0.28,
        side: THREE.BackSide
      });
      const glowMesh = new THREE.Mesh(glowGeom, glowMat);
      starMesh.add(glowMesh);

      const starLight = new THREE.PointLight(starColorInfo.hex, 2.5, 300, 0.5);
      starMesh.add(starLight);

      this.starsGroup.add(starMesh);
      this.starMeshes.push(starMesh);

    } else {
      // Binary or Multiple Star System
      const binaryRadius = 4.0;
      for (let s = 0; s < Math.min(starCount, 3); s++) {
        const sRadius = 2.0 - (s * 0.4);
        const sTeff = teff - (s * 1200);
        const sCol = this.getStarColor(sTeff);
        
        const sGeom = new THREE.SphereGeometry(sRadius, 24, 24);
        const sMat = new THREE.MeshBasicMaterial({ color: sCol.hex });
        const sMesh = new THREE.Mesh(sGeom, sMat);
        
        const angle = (s * (Math.PI * 2 / starCount));
        sMesh.position.set(Math.cos(angle) * binaryRadius, 0, Math.sin(angle) * binaryRadius);
        
        sMesh.userData = {
          type: 'star',
          name: `${systemData.name} ${String.fromCharCode(65 + s)}`,
          teff: sTeff,
          specType: `${systemData.starSpecType || 'Enana'} [Estrella ${s + 1}]`,
          radiusSolar: systemData.starRadius || 1.0,
          massSolar: systemData.starMass || 1.0,
          distLy: systemData.distanceLy,
          raHms: systemData.raHms,
          decDms: systemData.decDms,
          constellation: systemData.constellation,
          coordsEarth: systemData.coordsEarth,
          customDesc: `Componente estelar de un sistema binario. Orbita alrededor del baricentro común del sistema.`
        };

        const sGlow = new THREE.Mesh(
          new THREE.SphereGeometry(sRadius * 1.35, 24, 24),
          new THREE.MeshBasicMaterial({ color: sCol.hex, transparent: true, opacity: 0.3, side: THREE.BackSide })
        );
        sMesh.add(sGlow);

        const sLight = new THREE.PointLight(sCol.hex, 1.8, 200);
        sMesh.add(sLight);

        this.starsGroup.add(sMesh);
        this.starMeshes.push(sMesh);
      }
    }

    // 2. Habitable Zone Ring / Torus & Adaptive Distance Mapping
    const hzIn = systemData.hzInner || 0.95;
    const hzOut = systemData.hzOuter || 1.67;

    // Measure system scale for dynamic, non-colliding orbital mapping
    const allAu = (systemData.planets || []).map(p => p.semiMajorAxisAu || 0.5);
    allAu.push(hzIn, hzOut);
    const maxAu = Math.max(...allAu, 0.1);

    const baseClearance = starRadius + 3.2;

    const mapDist = (au) => {
      if (!au || au <= 0) au = 0.1;
      if (maxAu <= 0.35) {
        // Compact systems like TRAPPIST-1 (0.01 - 0.07 AU)
        return baseClearance + (au / maxAu) * 35.0;
      } else if (maxAu <= 2.5) {
        // Moderate systems (0.05 - 2.5 AU)
        return baseClearance + Math.pow(au / maxAu, 0.58) * 48.0;
      } else {
        // Extended systems like Solar System (up to 30+ AU)
        const logNorm = Math.log10(1 + au * 2.0) / Math.log10(1 + maxAu * 2.0);
        return baseClearance + logNorm * 68.0;
      }
    };

    const rInner = Math.max(baseClearance + 1.0, mapDist(hzIn));
    const rOuter = Math.max(rInner + 3.5, mapDist(hzOut));

    const hzDiskGeom = new THREE.RingGeometry(rInner, rOuter, 64);
    const hzDiskMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide
    });
    const hzMesh = new THREE.Mesh(hzDiskGeom, hzDiskMat);
    hzMesh.rotation.x = Math.PI / 2;
    this.hzGroup.add(hzMesh);

    const createCircleLine = (radius, colorHex) => {
      const pts = [];
      for (let i = 0; i <= 64; i++) {
        const theta = (i / 64) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
      }
      const geom = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({ color: colorHex, transparent: true, opacity: 0.45 });
      return new THREE.Line(geom, mat);
    };

    this.hzGroup.add(createCircleLine(rInner, 0x10b981));
    this.hzGroup.add(createCircleLine(rOuter, 0x059669));

    // 3. Planets & Orbits
    this.planetsData = [...(systemData.planets || [])].sort((a, b) => (a.semiMajorAxisAu || 0) - (b.semiMajorAxisAu || 0));
    let lastOrbitRadius = baseClearance + 0.5;

    this.planetsData.forEach((planet, index) => {
      const semiMajorAu = planet.semiMajorAxisAu || (0.1 + index * 0.3);
      let orbitRadius3D = mapDist(semiMajorAu);
      
      // Strict minimum orbital separation so no two planets overlap
      if (orbitRadius3D <= lastOrbitRadius + 2.2) {
        orbitRadius3D = lastOrbitRadius + 2.2;
      }
      lastOrbitRadius = orbitRadius3D;

      const orbitCircle = createCircleLine(orbitRadius3D, planet.inHabitableZone ? 0x059669 : 0x475569);
      this.orbitsGroup.add(orbitCircle);

      const radEarth = planet.radiusEarth || 1.0;
      const planetRadius3D = Math.min(3.2, Math.max(0.48, Math.log10(radEarth + 1) * 1.35));

      const planetGeom = new THREE.SphereGeometry(planetRadius3D, 24, 24);
      const planetColorHex = planet.color || (planet.inHabitableZone ? '#38bdf8' : '#94a3b8');
      const planetMat = new THREE.MeshStandardMaterial({
        color: planetColorHex,
        roughness: 0.7,
        metalness: 0.1
      });

      const planetMesh = new THREE.Mesh(planetGeom, planetMat);
      const startAngle = (index * 1.618033) % (Math.PI * 2);
      planetMesh.position.set(Math.cos(startAngle) * orbitRadius3D, 0, Math.sin(startAngle) * orbitRadius3D);

      if (planet.hasRings) {
        const ringGeom = new THREE.RingGeometry(planetRadius3D * 1.5, planetRadius3D * 2.5, 32);
        const ringMat = new THREE.MeshStandardMaterial({
          color: 0xe2bf7d,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8
        });
        const ringMesh = new THREE.Mesh(ringGeom, ringMat);
        ringMesh.rotation.x = Math.PI / 2.3;
        planetMesh.add(ringMesh);
      }

      // Visual Keplerian angular speed (inner planets visibly lap outer planets smoothly)
      const periodDays = Math.max(0.4, planet.orbitalPeriodDays || 25);
      const visPeriod = Math.pow(periodDays, 0.38) * 3.6;
      const orbitalSpeed = (Math.PI * 2) / visPeriod;

      planetMesh.userData = {
        type: 'planet',
        index: index,
        name: planet.name,
        radiusEarth: planet.radiusEarth,
        massEarth: planet.massEarth,
        surfaceGravityG: planet.surfaceGravityG,
        orbitalPeriodDays: planet.orbitalPeriodDays,
        semiMajorAxisAu: planet.semiMajorAxisAu,
        eqTempK: planet.eqTempK,
        eqTempC: planet.eqTempC !== undefined ? planet.eqTempC : (planet.eqTempK ? Math.round(planet.eqTempK - 273.15) : null),
        inHabitableZone: planet.inHabitableZone,
        inConservativeHZ: planet.inConservativeHZ,
        planetType: planet.type,
        color: planet.color,
        discoveryMethod: planet.discoveryMethod,
        discoveryYear: planet.discoveryYear,
        raHms: systemData.raHms,
        decDms: systemData.decDms,
        constellation: systemData.constellation,
        coordsEarth: systemData.coordsEarth,
        customDesc: planet.customDesc || planet.description,
        orbitRadius3D: orbitRadius3D,
        currentAngle: startAngle,
        orbitalSpeed: orbitalSpeed
      };

      this.planetsGroup.add(planetMesh);
      this.planetMeshes.push(planetMesh);

      const labelSprite = this.createPlanetLabel(planet.name, planet.inHabitableZone);
      labelSprite.position.set(0, planetRadius3D + 1.2, 0);
      planetMesh.add(labelSprite);
    });

    if (this.viewMode === 'system') {
      this.interactiveObjects = [...this.starMeshes, ...this.planetMeshes];
      this.adjustCameraForSystem();
    } else {
      this.updateLaserTargetVector(systemData);
    }
  }

  createPlanetLabel(text, inHz) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.fillStyle = inHz ? '#10b981' : '#cbd5e1';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.85 });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(6, 1.5, 1);
    return sprite;
  }

  adjustCameraForSystem() {
    let maxDist = 35;
    this.planetMeshes.forEach(p => {
      if (p.userData.orbitRadius3D > maxDist) maxDist = p.userData.orbitRadius3D;
    });

    const targetY = maxDist * 0.9;
    const targetZ = maxDist * 1.2;

    this.camera.position.set(0, targetY, targetZ);
    this.controls.target.set(0, 0, 0);
    this.controls.maxDistance = 600;
    this.controls.minDistance = 3;
    this.controls.update();
    this.focusedObject = null;
  }

  clearSystemScene() {
    while (this.starsGroup.children.length > 0) {
      this.starsGroup.remove(this.starsGroup.children[0]);
    }
    while (this.planetsGroup.children.length > 0) {
      this.planetsGroup.remove(this.planetsGroup.children[0]);
    }
    while (this.orbitsGroup.children.length > 0) {
      this.orbitsGroup.remove(this.orbitsGroup.children[0]);
    }
    while (this.hzGroup.children.length > 0) {
      this.hzGroup.remove(this.hzGroup.children[0]);
    }

    this.starMeshes = [];
    this.planetMeshes = [];
    this.hoveredObject = null;
  }

  onMouseMove(event) {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.checkIntersection(event.clientX, event.clientY);
  }

  onMouseClick(event) {
    if (this.hoveredObject) {
      if (this.viewMode === 'galaxy') {
        const sysData = this.hoveredObject.userData.systemData;
        if (sysData && this.onClick) {
          this.onClick(this.hoveredObject.userData);
        }
      } else {
        this.focusOnObject(this.hoveredObject);
        if (this.onClick) this.onClick(this.hoveredObject.userData);
      }
    }
  }

  focusOnObject(obj) {
    this.focusedObject = obj;
  }

  focusPlanetByIndex(index) {
    if (this.planetMeshes[index]) {
      this.focusOnObject(this.planetMeshes[index]);
    }
  }

  checkIntersection(screenX, screenY) {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveObjects, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      if (this.hoveredObject !== hit) {
        this.hoveredObject = hit;
        this.container.style.cursor = 'pointer';
      }
      if (this.onHover) {
        this.onHover(hit.userData, screenX, screenY);
      }
    } else {
      if (this.hoveredObject) {
        this.hoveredObject = null;
        this.container.style.cursor = 'grab';
        if (this.onHover) {
          this.onHover(null, 0, 0);
        }
      }
    }
  }

  setSimSpeed(speed) {
    this.simSpeed = speed;
  }

  toggleHabitableZone(show) {
    this.showHabitableZone = show;
    this.hzGroup.visible = show;
  }

  toggleOrbits(show) {
    this.showOrbits = show;
    this.orbitsGroup.visible = show;
  }

  toggleGrid(show) {
    this.showGrid = show;
    this.celestialGridGroup.visible = (this.viewMode === 'galaxy' && show);
  }

  toggleLabels(show) {
    this.showLabels = show;
    this.planetMeshes.forEach(p => {
      p.children.forEach(child => {
        if (child.isSprite) child.visible = show;
      });
    });
  }

  resetCamera() {
    if (this.viewMode === 'system') {
      this.adjustCameraForSystem();
    } else {
      this.camera.position.set(0, 400, 800);
      this.controls.target.set(0, 0, 0);
      this.controls.update();
    }
  }

  onWindowResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();

    if (this.viewMode === 'system') {
      // 1. Rotate stars and animate binary stars
      if (this.starMeshes.length > 1) {
        const time = this.clock.getElapsedTime() * 0.5 * this.simSpeed;
        const binDist = 4.0;
        this.starMeshes.forEach((star, i) => {
          const angle = time + (i * (Math.PI * 2 / this.starMeshes.length));
          star.position.set(Math.cos(angle) * binDist, 0, Math.sin(angle) * binDist);
          star.rotation.y += 0.01;
        });
      } else if (this.starMeshes.length === 1) {
        this.starMeshes[0].rotation.y += 0.003;
      }

      // 2. Animate planet orbits and self-rotations
      if (this.simSpeed > 0) {
        this.planetMeshes.forEach(mesh => {
          const data = mesh.userData;
          data.currentAngle += data.orbitalSpeed * delta * this.simSpeed * 0.2;
          mesh.position.x = Math.cos(data.currentAngle) * data.orbitRadius3D;
          mesh.position.z = Math.sin(data.currentAngle) * data.orbitRadius3D;
          mesh.rotation.y += 0.02 * this.simSpeed;
        });
      }

      // 3. Smooth Camera Tracking
      if (this.focusedObject) {
        const targetPos = new THREE.Vector3();
        this.focusedObject.getWorldPosition(targetPos);
        this.controls.target.lerp(targetPos, 0.05);
      }
    } else {
      // Galaxy mode: slowly rotate galaxy points and starfield
      if (this.galaxyGroup) {
        this.galaxyGroup.rotation.y += 0.0001;
      }
    }

    if (this.starField) {
      this.starField.rotation.y += 0.00008;
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
