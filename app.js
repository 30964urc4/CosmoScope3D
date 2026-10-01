import { CELESTIAL_SYSTEMS } from './systems_data.js';
import { SolarSystemViewer3D } from './scene3d.js';

class CosmoScopeApp {
  constructor() {
    this.systems = CELESTIAL_SYSTEMS;
    this.currentSystem = null;
    this.viewer = null;
    this.filteredList = [...this.systems];

    // Filter states
    this.filters = {
      keyword: '',
      stars: 'all',
      spectral: 'all',
      planets: 'all',
      tempRange: 'all',
      onlyHabitable: false,
      onlyTerrestrial: false,
      onlyGasGiants: false,
      maxDistance: 4000
    };

    // DOM Elements
    this.canvasContainer = document.getElementById('canvas-container');
    this.modeSystemBtn = document.getElementById('mode-system-btn');
    this.modeGalaxyBtn = document.getElementById('mode-galaxy-btn');
    this.searchInput = document.getElementById('system-search-input');
    this.searchSuggestions = document.getElementById('search-suggestions');
    this.clearSearchBtn = document.getElementById('clear-search-btn');
    this.toggleFilterBtn = document.getElementById('toggle-filter-btn');
    this.filterBadge = document.getElementById('active-filter-badge');
    this.filterDrawer = document.getElementById('filter-drawer');
    this.closeFilterBtn = document.getElementById('close-filter-btn');
    this.filterKeywordInput = document.getElementById('filter-keyword-input');
    this.filteredCountDisplay = document.getElementById('filtered-systems-count');
    this.filteredGallery = document.getElementById('filtered-gallery');
    this.presetChips = document.querySelectorAll('.preset-chip');

    // HUD Elements
    this.hudName = document.getElementById('hud-system-name');
    this.hudTag = document.getElementById('hud-system-tag');
    this.hudDist = document.getElementById('hud-system-dist');
    this.hudRa = document.getElementById('hud-ra-val');
    this.hudDec = document.getElementById('hud-dec-val');
    this.hudConstellation = document.getElementById('hud-constellation-val');
    this.hudRadDist = document.getElementById('hud-rad-dist-val');
    this.hudCartesian = document.getElementById('hud-cartesian-val');

    this.hudStars = document.getElementById('hud-stars-val');
    this.hudPlanets = document.getElementById('hud-planets-val');
    this.hudHz = document.getElementById('hud-hz-val');
    this.hudTeff = document.getElementById('hud-teff-val');
    this.hudDesc = document.getElementById('hud-description-text');
    this.planetsRibbon = document.getElementById('planets-ribbon');

    // Tooltip
    this.tooltip = document.getElementById('celestial-tooltip');
    this.ttBadge = document.getElementById('tt-badge');
    this.ttName = document.getElementById('tt-name');
    this.ttType = document.getElementById('tt-type');
    this.ttDistStar = document.getElementById('tt-dist-star');
    this.ttDistEarth = document.getElementById('tt-dist-earth');
    this.ttTemp = document.getElementById('tt-temp');
    this.ttMassGrav = document.getElementById('tt-mass-grav');
    this.ttRa = document.getElementById('tt-ra');
    this.ttDec = document.getElementById('tt-dec');
    this.ttPeriod = document.getElementById('tt-period');
    this.ttRadius = document.getElementById('tt-radius');
    this.ttDesc = document.getElementById('tt-desc');

    this.activeSuggestionIndex = -1;
    this.init();
  }

  init() {
    // 1. Initialize 3D Scene
    this.viewer = new SolarSystemViewer3D(
      this.canvasContainer,
      (userData, x, y) => this.handle3DHover(userData, x, y),
      (userData) => this.handle3DClick(userData)
    );

    // 2. Pass whole catalog for Earth-centered 3D Galactic Coordinate Space
    this.viewer.setSystemsData(this.systems);

    // 3. Load Default System (Sistema Solar - Origin [0,0,0])
    const initialSystem = this.systems.find(s => s.name === 'Sistema Solar') || this.systems[0];
    this.selectSystem(initialSystem);

    // 4. Setup Event Listeners
    this.setupViewModeEvents();
    this.setupSearchEvents();
    this.setupFilterEvents();
    this.setupPresetEvents();
    this.setupViewportControlEvents();
    this.setupGuideHint();

    console.log(`CosmoScope 3D initialized with ${this.systems.length} systems and Earth coordinates.`);
  }

  setupViewModeEvents() {
    this.modeSystemBtn.addEventListener('click', () => {
      this.modeSystemBtn.classList.add('active');
      this.modeGalaxyBtn.classList.remove('active');
      this.viewer.setViewMode('system');
    });

    this.modeGalaxyBtn.addEventListener('click', () => {
      this.modeGalaxyBtn.classList.add('active');
      this.modeSystemBtn.classList.remove('active');
      this.viewer.setViewMode('galaxy');
    });
  }

  selectSystem(system) {
    if (!system) return;
    this.currentSystem = system;

    // Load in 3D Scene
    this.viewer.loadSystem(system);

    // Update HUD Info
    this.updateHUD(system);

    // Update Bottom Ribbon
    this.updatePlanetsRibbon(system);

    // Close search dropdown if open
    this.searchSuggestions.style.display = 'none';
  }

  updateHUD(system) {
    this.hudName.textContent = system.name;
    const isSolar = system.name === 'Sistema Solar';
    this.hudTag.textContent = isSolar ? 'SISTEMA SOLAR (ORIGEN [0,0,0])' : (system.starsCount > 1 ? `SISTEMA BINARIO / MÚLTIPLE (${system.starsCount} SOLES)` : 'SISTEMA EXOPLANETARIO');
    
    this.hudDist.textContent = isSolar ? '📍 Origen de coordenadas: Planeta Tierra' : `📍 A ${system.distanceLy ? system.distanceLy.toLocaleString() : 'Desconocida'} años luz de la Tierra`;
    
    // Astronomical Coordinates (Origin Earth)
    this.hudRa.textContent = system.raHms || (system.raDeg !== undefined ? `${system.raDeg}°` : '00h 00m 00s');
    this.hudDec.textContent = system.decDms || (system.decDeg !== undefined ? `${system.decDeg}°` : '+00° 00\' 00"');
    this.hudConstellation.textContent = system.constellation || 'Desconocida';
    this.hudRadDist.textContent = isSolar ? '0.0 Años Luz (0 pc)' : `${system.distanceLy ? system.distanceLy.toLocaleString() : '—'} AL (${system.distancePc ? system.distancePc.toLocaleString() : '—'} pc)`;

    // Cartesian Coordinates [X, Y, Z] from Earth
    if (system.coordsEarth && system.coordsEarth.x !== null) {
      this.hudCartesian.innerHTML = `
        <span class="vec-tag vx">X: ${system.coordsEarth.x > 0 ? '+' : ''}${system.coordsEarth.x}</span>
        <span class="vec-tag vy">Y: ${system.coordsEarth.y > 0 ? '+' : ''}${system.coordsEarth.y}</span>
        <span class="vec-tag vz">Z: ${system.coordsEarth.z > 0 ? '+' : ''}${system.coordsEarth.z}</span>
      `;
    } else {
      this.hudCartesian.innerHTML = `<span class="vec-tag vx">X: 0.0</span><span class="vec-tag vy">Y: 0.0</span><span class="vec-tag vz">Z: 0.0</span>`;
    }

    const lumStr = system.starLumSolar ? ` &bull; ${system.starLumSolar} L☉` : '';
    this.hudStars.innerHTML = `${system.starsCount} ${system.starsCount === 1 ? 'Sol' : 'Soles'} <small style="color:var(--text-secondary);">(${system.starSpecType || 'Tipo Solar'}${lumStr})</small>`;
    this.hudPlanets.textContent = `${system.planetsCount} ${system.planetsCount === 1 ? 'planeta' : 'planetas'}`;
    this.hudHz.textContent = `${system.hzInner || 0.95} - ${system.hzOuter || 1.67} UA`;
    
    const teffVal = system.starTeff || 5778;
    const teffC = Math.round(teffVal - 273.15);
    this.hudTeff.innerHTML = `${teffVal.toLocaleString()} K <small style="color:var(--accent-amber); font-weight:normal;">(${teffC > 0 ? '+' : ''}${teffC.toLocaleString()} °C)</small>`;
    
    this.hudDesc.textContent = system.customDesc || system.description || this.generateSystemDescription(system);
  }

  updatePlanetsRibbon(system) {
    this.planetsRibbon.innerHTML = '';
    
    // Add central star chip
    const starChip = document.createElement('button');
    starChip.className = 'ribbon-planet-chip';
    starChip.innerHTML = `<span class="planet-dot" style="background: #ffd166; box-shadow: 0 0 6px #ffd166;"></span> ☀️ ${system.name}`;
    starChip.addEventListener('click', () => {
      this.viewer.resetCamera();
      this.highlightActiveRibbonChip(starChip);
    });
    this.planetsRibbon.appendChild(starChip);

    // Add planet chips
    (system.planets || []).forEach((p, idx) => {
      const chip = document.createElement('button');
      chip.className = `ribbon-planet-chip ${p.inHabitableZone ? 'hz-badge' : ''}`;
      const color = p.color || (p.inHabitableZone ? '#38bdf8' : '#cbd5e1');
      chip.innerHTML = `
        <span class="planet-dot" style="background: ${color};"></span>
        <span>${p.name}</span>
        ${p.inHabitableZone ? '🌱' : ''}
      `;
      chip.addEventListener('click', () => {
        this.viewer.focusPlanetByIndex(idx);
        this.highlightActiveRibbonChip(chip);
      });
      this.planetsRibbon.appendChild(chip);
    });
  }

  highlightActiveRibbonChip(activeChip) {
    document.querySelectorAll('.ribbon-planet-chip').forEach(c => c.classList.remove('active'));
    if (activeChip) activeChip.classList.add('active');
  }

  // 3D Raycasting Hover Interaction
  handle3DHover(data, x, y) {
    if (!data) {
      this.tooltip.style.display = 'none';
      return;
    }

    this.tooltip.style.display = 'block';

    const ttWidth = 320;
    const ttHeight = 310;
    let posX = x + 18;
    let posY = y + 18;

    if (posX + ttWidth > window.innerWidth) posX = x - ttWidth - 18;
    if (posY + ttHeight > window.innerHeight) posY = y - ttHeight - 18;

    this.tooltip.style.left = `${posX}px`;
    this.tooltip.style.top = `${posY}px`;

    // Galaxy Star Point in 3D Galaxy Map
    if (data.type === 'galaxy_system') {
      const sys = data.systemData || {};
      this.ttBadge.textContent = 'Sistema en Mapa Galáctico';
      this.ttBadge.style.color = '#38bdf8';
      this.ttName.textContent = data.name;
      this.ttType.textContent = `🌌 Constelación: ${data.constellation || 'Vía Láctea'}`;
      this.ttType.style.color = '#38bdf8';

      this.ttDistStar.textContent = 'Centro del sistema';
      this.ttDistEarth.textContent = `${data.distLy ? data.distLy.toLocaleString() : '0'} Años Luz`;
      
      const gTeff = sys.starTeff || 5778;
      const gTeffC = Math.round(gTeff - 273.15);
      if (this.ttTemp) this.ttTemp.textContent = `${gTeff.toLocaleString()} K (${gTeffC > 0 ? '+' : ''}${gTeffC.toLocaleString()} °C)`;
      if (this.ttMassGrav) this.ttMassGrav.textContent = `${sys.starMass ? sys.starMass + ' M☉' : '1.0 M☉'}`;
      
      this.ttRa.textContent = data.raHms || '00h 00m';
      this.ttDec.textContent = data.decDms || '+00° 00\'';
      this.ttPeriod.textContent = `${sys.planetsCount || 1} planetas`;
      this.ttRadius.textContent = `${sys.starsCount || 1} Sol(es)`;

      this.ttDesc.textContent = sys.customDesc || `Sistema estelar ubicado a ${data.distLy} AL de la Tierra en ${data.constellation || 'el cielo profundo'}. Haz clic para enfocar y ver sus órbitas en 3D.`;
      return;
    }

    // Star in System View
    if (data.type === 'star') {
      this.ttBadge.textContent = 'Estrella / Sol';
      this.ttBadge.style.color = '#f59e0b';
      this.ttName.textContent = data.name;
      this.ttType.textContent = `⭐ Tipo: ${data.specType} &bull; ${data.constellation || ''}`;
      this.ttType.style.color = '#f59e0b';
      
      this.ttDistStar.textContent = 'Centro del sistema';
      this.ttDistEarth.textContent = data.distLy ? `${data.distLy} Años Luz` : '0 AL (Local)';
      
      const sTeff = data.teff || 5778;
      const sTeffC = Math.round(sTeff - 273.15);
      if (this.ttTemp) this.ttTemp.textContent = `${sTeff.toLocaleString()} K (${sTeffC > 0 ? '+' : ''}${sTeffC.toLocaleString()} °C)`;
      if (this.ttMassGrav) this.ttMassGrav.textContent = `${data.massSolar ? data.massSolar + ' M☉' : '1.0 M☉'}`;
      
      this.ttRa.textContent = data.raHms || '00h 00m';
      this.ttDec.textContent = data.decDms || '+00° 00\'';
      this.ttPeriod.textContent = '—';
      this.ttRadius.textContent = `${data.radiusSolar} x Sol`;
      
      this.ttDesc.textContent = data.customDesc || `Estrella anfitriona con temperatura fotosférica de ${sTeff.toLocaleString()} K que suministra la energía térmica y gravitatoria al sistema.`;

    } else if (data.type === 'planet') {
      this.ttBadge.textContent = data.planetType || 'Exoplaneta';
      this.ttBadge.style.color = data.inHabitableZone ? '#10b981' : '#38bdf8';
      this.ttName.textContent = data.name;
      
      if (data.inConservativeHZ) {
        this.ttType.innerHTML = '🌱 <strong>En Zona Habitable Conservadora</strong>';
        this.ttType.style.color = '#10b981';
      } else if (data.inHabitableZone) {
        this.ttType.innerHTML = '🌿 <strong>En Zona Habitable Optimista</strong>';
        this.ttType.style.color = '#34d399';
      } else if (data.semiMajorAxisAu < (this.currentSystem.hzInner || 0.9)) {
        this.ttType.innerHTML = '🔥 <strong>Zona Tórrida / Muy Cálida</strong>';
        this.ttType.style.color = '#ef4444';
      } else {
        this.ttType.innerHTML = '❄️ <strong>Zona Exterior Fría / Gélida</strong>';
        this.ttType.style.color = '#60a5fa';
      }

      this.ttDistStar.textContent = `${data.semiMajorAxisAu || 1.0} UA`;
      this.ttDistEarth.textContent = this.currentSystem.distanceLy ? `${this.currentSystem.distanceLy} Años Luz` : '0 AL (Local)';
      
      const pTeqK = data.eqTempK;
      const pTeqC = data.eqTempC !== undefined && data.eqTempC !== null ? data.eqTempC : (pTeqK ? Math.round(pTeqK - 273.15) : null);
      if (this.ttTemp) {
        if (pTeqK) {
          this.ttTemp.textContent = `${pTeqK} K (${pTeqC > 0 ? '+' : ''}${pTeqC} °C)`;
        } else {
          this.ttTemp.textContent = 'Calculada ~250 K';
        }
      }

      if (this.ttMassGrav) {
        const mStr = data.massEarth ? `${data.massEarth} M⊕` : '—';
        const gStr = data.surfaceGravityG ? `${data.surfaceGravityG} g` : '1.0 g';
        this.ttMassGrav.textContent = `${mStr} (${gStr})`;
      }

      this.ttPeriod.textContent = `${data.orbitalPeriodDays} días`;
      this.ttRadius.textContent = `${data.radiusEarth} x Tierra`;
      this.ttRa.textContent = data.raHms || '00h 00m';
      this.ttDec.textContent = data.decDms || '+00° 00\'';

      this.ttDesc.textContent = data.customDesc || this.generatePlanetDescription(data, this.currentSystem);
    }
  }

  handle3DClick(data) {
    if (!data) return;
    if (data.type === 'galaxy_system') {
      // Clicked a star in the Earth-centered galaxy view!
      this.selectSystem(data.systemData);
      this.modeSystemBtn.click();
    } else if (data.type === 'planet') {
      const chips = document.querySelectorAll('.ribbon-planet-chip');
      if (chips[data.index + 1]) {
        this.highlightActiveRibbonChip(chips[data.index + 1]);
      }
    }
  }

  generateSystemDescription(s) {
    const stars = s.starsCount || 1;
    const planets = s.planetsCount || 1;
    const dist = s.distanceLy;
    const hzPlanets = (s.planets || []).filter(p => p.inHabitableZone).length;
    const teff = s.starTeff || 5778;
    const teffC = Math.round(teff - 273.15);
    const spec = s.starSpecType || 'G';
    const constell = s.constellation || 'Vía Láctea';

    let hzInfo = '';
    if (hzPlanets > 0) {
      hzInfo = ` Alberga ${hzPlanets} planeta(s) dentro de su Zona Habitable (${s.hzInner} - ${s.hzOuter} UA).`;
    } else {
      hzInfo = ` La zona de habitabilidad teórica se extiende de ${s.hzInner || 0.9} a ${s.hzOuter || 1.6} UA.`;
    }

    const distStr = dist ? `${dist.toLocaleString()} años luz en la constelación de ${constell}` : 'distancia local (Tierra origen 0,0,0)';
    return `Sistema estelar compuesto por ${stars > 1 ? stars + ' estrellas' : 'una estrella tipo ' + spec} con temperatura de ${teff.toLocaleString()} K (${teffC > 0 ? '+' : ''}${teffC} °C) y ${planets} mundo(s) confirmado(s) por la NASA, situado a ${distStr}.${hzInfo}`;
  }

  generatePlanetDescription(p, s) {
    const type = p.planetType || p.type || 'Mundo planetario';
    const rad = p.radiusEarth || 1.0;
    const grav = p.surfaceGravityG ? `${p.surfaceGravityG} veces la gravedad terrestre` : 'gravedad moderada';
    const teqK = p.eqTempK || 270;
    const teqC = Math.round(teqK - 273.15);
    const tempStr = `${teqK} K (${teqC > 0 ? '+' : ''}${teqC} °C)`;
    const method = p.discoveryMethod || 'observación astronómica';
    const year = p.discoveryYear ? `en el año ${p.discoveryYear}` : 'en los registros de la NASA';

    let thermalNarrative = '';
    if (teqK >= 1500) {
      thermalNarrative = `Mundo de lava incandescente con temperaturas abrasadoras de ${tempStr}, capaz de fundir silicatos y metales en superficie.`;
    } else if (teqK >= 373) {
      thermalNarrative = `Mundo muy cálido con ${tempStr}, sometido a una intensa insolación estelar que impide la estabilidad de agua líquida superficial.`;
    } else if (p.inHabitableZone || (teqK >= 200 && teqK <= 320)) {
      thermalNarrative = `Mundo templado con temperatura de equilibrio de ${tempStr}, ubicado en la Zona Habitable (Goldilocks) con potencial para retener agua líquida superficial.`;
    } else {
      thermalNarrative = `Mundo gélido de las regiones exteriores con ${tempStr}, donde el agua y los compuestos volátiles permanecen en estado sólido helado.`;
    }

    return `${type} con ${rad} veces el radio de la Tierra y ${grav}. ${thermalNarrative} Registrado mediante ${method} ${year}. Coordenadas celestes observables desde la Tierra: RA ${s.raHms || '—'}, Dec ${s.decDms || '—'}.`;
  }

  // =========================================================================
  // SEARCH & AUTOCOMPLETE
  // =========================================================================

  setupSearchEvents() {
    this.searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim().toLowerCase();
      this.activeSuggestionIndex = -1;
      if (query.length > 0) {
        this.clearSearchBtn.style.display = 'block';
        this.showSuggestions(query);
      } else {
        this.clearSearchBtn.style.display = 'none';
        this.searchSuggestions.style.display = 'none';
      }
    });

    this.searchInput.addEventListener('keydown', (e) => {
      const items = this.searchSuggestions.querySelectorAll('.search-item');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (items.length > 0) {
          this.activeSuggestionIndex = (this.activeSuggestionIndex + 1) % items.length;
          this.highlightActiveSuggestion(items);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (items.length > 0) {
          this.activeSuggestionIndex = (this.activeSuggestionIndex - 1 + items.length) % items.length;
          this.highlightActiveSuggestion(items);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (this.activeSuggestionIndex >= 0 && items[this.activeSuggestionIndex]) {
          items[this.activeSuggestionIndex].click();
        } else if (items.length > 0) {
          items[0].click();
        }
      }
    });

    this.clearSearchBtn.addEventListener('click', () => {
      this.searchInput.value = '';
      this.clearSearchBtn.style.display = 'none';
      this.searchSuggestions.style.display = 'none';
      this.activeSuggestionIndex = -1;
      this.searchInput.focus();
    });

    document.addEventListener('click', (e) => {
      if (!this.searchInput.contains(e.target) && !this.searchSuggestions.contains(e.target)) {
        this.searchSuggestions.style.display = 'none';
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== this.searchInput && document.activeElement !== this.filterKeywordInput) {
        e.preventDefault();
        this.searchInput.focus();
      }
      if (e.key === 'Escape') {
        this.searchSuggestions.style.display = 'none';
        this.filterDrawer.style.display = 'none';
        this.toggleFilterBtn.classList.remove('active');
      }
    });
  }

  highlightActiveSuggestion(items) {
    items.forEach((item, idx) => {
      item.classList.toggle('active', idx === this.activeSuggestionIndex);
      if (idx === this.activeSuggestionIndex) {
        item.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  showSuggestions(query) {
    const matches = [];
    const isHabQuery = query.includes('habit') || query.includes('goldilocks') || query.includes('vida');
    const isBinaryQuery = query.includes('binar') || query.includes('doble') || query.includes('tatooine') || query.includes('dos sol');
    const isRockyQuery = query.includes('rocos') || query.includes('tierr') || query.includes('terrest');
    const isGasQuery = query.includes('gas') || query.includes('jovian') || query.includes('gigante');

    for (const sys of this.systems) {
      let matchedPlanet = null;
      const hostMatch = sys.name.toLowerCase().includes(query);
      const constMatch = (sys.constellation || '').toLowerCase().includes(query);
      
      if (!hostMatch && sys.planets) {
        matchedPlanet = sys.planets.find(p => p.name.toLowerCase().includes(query));
      }

      let tagMatch = false;
      if (isHabQuery && (sys.planets || []).some(p => p.inHabitableZone)) tagMatch = true;
      if (isBinaryQuery && (sys.starsCount > 1 || sys.name === 'Kepler-16')) tagMatch = true;
      if (isRockyQuery && (sys.planets || []).some(p => (p.radiusEarth || 1.0) < 2.0)) tagMatch = true;
      if (isGasQuery && (sys.planets || []).some(p => (p.radiusEarth || 1.0) >= 6.0)) tagMatch = true;

      if (hostMatch || matchedPlanet || constMatch || tagMatch) {
        matches.push({ system: sys, matchedPlanet });
        if (matches.length >= 14) break;
      }
    }

    if (matches.length === 0) {
      this.searchSuggestions.innerHTML = `<div style="padding:14px; color: var(--text-muted); text-align:center;">No se encontraron sistemas con "${query}"</div>`;
      this.searchSuggestions.style.display = 'block';
      return;
    }

    this.searchSuggestions.innerHTML = '';
    matches.forEach(item => {
      const div = document.createElement('div');
      div.className = 'search-item';
      const hzPlanets = (item.system.planets || []).filter(p => p.inHabitableZone).length;
      
      div.innerHTML = `
        <div class="search-item-info">
          <span class="search-item-title">${item.system.name} ${item.matchedPlanet ? `&bull; <span style="color:var(--accent-cyan); font-weight:normal;">(${item.matchedPlanet.name})</span>` : ''}</span>
          <span class="search-item-sub">🛰️ ${item.system.constellation || 'Cielo'} &bull; RA ${item.system.raHms || ''} &bull; 📍 ${item.system.distanceLy ? item.system.distanceLy.toLocaleString() + ' AL' : 'Local'}</span>
        </div>
        <div class="search-item-badges">
          ${hzPlanets > 0 ? `<span class="search-badge hz">🌱 ${hzPlanets} Habitable${hzPlanets > 1 ? 's' : ''}</span>` : ''}
          <span class="search-badge">${item.system.planetsCount} Planetas</span>
        </div>
      `;
      div.addEventListener('click', () => {
        this.selectSystem(item.system);
        this.searchInput.value = item.system.name;
        this.searchSuggestions.style.display = 'none';
        if (item.matchedPlanet) {
          const pIndex = item.system.planets.indexOf(item.matchedPlanet);
          if (pIndex !== -1) {
            setTimeout(() => this.viewer.focusPlanetByIndex(pIndex), 350);
          }
        }
      });
      this.searchSuggestions.appendChild(div);
    });

    this.searchSuggestions.style.display = 'block';
  }

  // =========================================================================
  // ADVANCED FILTERING DRAWER ("BUSCADOR POR FILTRO")
  // =========================================================================

  setupFilterEvents() {
    this.toggleFilterBtn.addEventListener('click', () => {
      const isVisible = this.filterDrawer.style.display === 'flex';
      this.filterDrawer.style.display = isVisible ? 'none' : 'flex';
      this.toggleFilterBtn.classList.toggle('active', !isVisible);
      if (!isVisible) {
        if (this.filterKeywordInput) this.filterKeywordInput.focus();
        this.applyFilters();
      }
    });

    this.closeFilterBtn.addEventListener('click', () => {
      this.filterDrawer.style.display = 'none';
      this.toggleFilterBtn.classList.remove('active');
    });

    // Keyword Search inside Drawer
    if (this.filterKeywordInput) {
      this.filterKeywordInput.addEventListener('input', (e) => {
        this.filters.keyword = e.target.value.trim().toLowerCase();
        this.applyFilters();
      });
    }

    // Star Count Buttons
    document.querySelectorAll('#star-count-filter .filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('#star-count-filter .filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.filters.stars = e.target.dataset.val;
        this.applyFilters();
      });
    });

    // Spectral Type Filter Buttons
    document.querySelectorAll('#spectral-type-filter .filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('#spectral-type-filter .filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.filters.spectral = e.target.dataset.val;
        this.applyFilters();
      });
    });

    // Planet Count Buttons
    document.querySelectorAll('#planet-count-filter .filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('#planet-count-filter .filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.filters.planets = e.target.dataset.val;
        this.applyFilters();
      });
    });

    // Temperature Range Filter Buttons
    document.querySelectorAll('#temp-range-filter .filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('#temp-range-filter .filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.filters.tempRange = e.target.dataset.val;
        this.applyFilters();
      });
    });

    // Checkboxes
    const chkHab = document.getElementById('filter-habitable');
    const chkTer = document.getElementById('filter-terrestrial');
    const chkGas = document.getElementById('filter-gas-giants');

    [chkHab, chkTer, chkGas].forEach(chk => {
      if (chk) {
        chk.addEventListener('change', () => {
          this.filters.onlyHabitable = chkHab.checked;
          this.filters.onlyTerrestrial = chkTer.checked;
          this.filters.onlyGasGiants = chkGas.checked;
          this.applyFilters();
        });
      }
    });

    // Distance Slider
    const distSlider = document.getElementById('filter-distance');
    const distDisplay = document.getElementById('distance-value-display');
    if (distSlider) {
      distSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        this.filters.maxDistance = val;
        distDisplay.textContent = val >= 4000 ? 'Todas las distancias' : `Hasta ${val.toLocaleString()} Años Luz`;
        this.applyFilters();
      });
    }

    // Reset Filters
    document.getElementById('reset-filters-btn').addEventListener('click', () => {
      this.filters = {
        keyword: '',
        stars: 'all',
        spectral: 'all',
        planets: 'all',
        tempRange: 'all',
        onlyHabitable: false,
        onlyTerrestrial: false,
        onlyGasGiants: false,
        maxDistance: 4000
      };
      if (this.filterKeywordInput) this.filterKeywordInput.value = '';
      document.querySelectorAll('#star-count-filter .filter-btn').forEach(b => b.classList.toggle('active', b.dataset.val === 'all'));
      document.querySelectorAll('#spectral-type-filter .filter-btn').forEach(b => b.classList.toggle('active', b.dataset.val === 'all'));
      document.querySelectorAll('#planet-count-filter .filter-btn').forEach(b => b.classList.toggle('active', b.dataset.val === 'all'));
      document.querySelectorAll('#temp-range-filter .filter-btn').forEach(b => b.classList.toggle('active', b.dataset.val === 'all'));
      if (chkHab) chkHab.checked = false;
      if (chkTer) chkTer.checked = false;
      if (chkGas) chkGas.checked = false;
      if (distSlider) {
        distSlider.value = 4000;
        distDisplay.textContent = 'Todas las distancias';
      }
      this.applyFilters();
    });

    document.getElementById('apply-filters-btn').addEventListener('click', () => {
      if (this.filteredList.length > 0) {
        this.selectSystem(this.filteredList[0]);
        this.filterDrawer.style.display = 'none';
        this.toggleFilterBtn.classList.remove('active');
      }
    });
  }

  applyFilters() {
    this.filteredList = this.systems.filter(s => {
      // 1. Text keyword filter
      if (this.filters.keyword) {
        const kw = this.filters.keyword;
        const nameMatch = s.name.toLowerCase().includes(kw);
        const constMatch = (s.constellation || '').toLowerCase().includes(kw);
        const planetMatch = (s.planets || []).some(p => p.name.toLowerCase().includes(kw));
        if (!nameMatch && !constMatch && !planetMatch) return false;
      }

      // 2. Stars Count
      if (this.filters.stars === '1' && s.starsCount !== 1) return false;
      if (this.filters.stars === '2' && s.starsCount !== 2) return false;
      if (this.filters.stars === '3+' && s.starsCount < 3) return false;

      // 3. Spectral Type
      if (this.filters.spectral !== 'all') {
        const spec = (s.starSpecType || '').toUpperCase();
        if (this.filters.spectral === 'solar' && !spec.startsWith('G') && !spec.startsWith('F')) return false;
        if (this.filters.spectral === 'cool' && !spec.startsWith('K') && !spec.startsWith('M')) return false;
        if (this.filters.spectral === 'hot_star' && !spec.startsWith('A') && !spec.startsWith('B') && !spec.startsWith('O')) return false;
      }

      // 4. Planets Count
      if (this.filters.planets === '1' && s.planetsCount !== 1) return false;
      if (this.filters.planets === '2' && s.planetsCount !== 2) return false;
      if (this.filters.planets === '3' && s.planetsCount !== 3) return false;
      if (this.filters.planets === '4' && s.planetsCount !== 4) return false;
      if (this.filters.planets === '5+' && s.planetsCount < 5) return false;

      // 5. Temperature Range of Planets
      if (this.filters.tempRange === 'temperate') {
        const hasTemperate = (s.planets || []).some(p => (p.eqTempK >= 200 && p.eqTempK <= 320) || p.inHabitableZone);
        if (!hasTemperate) return false;
      } else if (this.filters.tempRange === 'hot') {
        const hasHot = (s.planets || []).some(p => p.eqTempK > 320);
        if (!hasHot) return false;
      } else if (this.filters.tempRange === 'cold') {
        const hasCold = (s.planets || []).some(p => p.eqTempK < 200);
        if (!hasCold) return false;
      }

      // 6. Checkboxes
      if (this.filters.onlyHabitable && !(s.planets || []).some(p => p.inHabitableZone)) return false;
      if (this.filters.onlyTerrestrial && !(s.planets || []).some(p => (p.radiusEarth || 1.0) < 2.0)) return false;
      if (this.filters.onlyGasGiants && !(s.planets || []).some(p => (p.radiusEarth || 1.0) >= 6.0)) return false;

      // 7. Distance
      if (this.filters.maxDistance < 4000 && s.distanceLy && s.distanceLy > this.filters.maxDistance) return false;

      return true;
    });

    let activeFilterCount = 0;
    if (this.filters.keyword) activeFilterCount++;
    if (this.filters.stars !== 'all') activeFilterCount++;
    if (this.filters.spectral !== 'all') activeFilterCount++;
    if (this.filters.planets !== 'all') activeFilterCount++;
    if (this.filters.tempRange !== 'all') activeFilterCount++;
    if (this.filters.onlyHabitable) activeFilterCount++;
    if (this.filters.onlyTerrestrial) activeFilterCount++;
    if (this.filters.onlyGasGiants) activeFilterCount++;
    if (this.filters.maxDistance < 4000) activeFilterCount++;

    if (activeFilterCount > 0) {
      this.filterBadge.textContent = activeFilterCount;
      this.filterBadge.style.display = 'inline-block';
    } else {
      this.filterBadge.style.display = 'none';
    }

    this.filteredCountDisplay.textContent = `Mostrando ${this.filteredList.length.toLocaleString()} sistemas coincidentes`;
    this.renderFilteredGallery();
  }

  renderFilteredGallery() {
    this.filteredGallery.innerHTML = '';
    const previewItems = this.filteredList.slice(0, 36);

    if (previewItems.length === 0) {
      this.filteredGallery.innerHTML = `<div style="padding:20px; text-align:center; color:var(--text-muted); font-size:12px;">Ningún sistema coincide con los filtros aplicados. Prueba a restablecer los filtros.</div>`;
      return;
    }

    previewItems.forEach(sys => {
      const item = document.createElement('div');
      item.className = 'gallery-item';
      const hzPlanets = (sys.planets || []).filter(p => p.inHabitableZone).length;
      const minTemp = Math.min(...(sys.planets || []).map(p => p.eqTempK || 280));
      const maxTemp = Math.max(...(sys.planets || []).map(p => p.eqTempK || 280));

      item.innerHTML = `
        <div style="flex:1; min-width:0;">
          <div class="gallery-name" style="display:flex; align-items:center; gap:8px;">
            <span>${sys.name}</span>
            ${hzPlanets > 0 ? `<span class="search-badge hz" style="font-size:9px; padding:2px 6px;">🌱 ${hzPlanets} Habitable${hzPlanets > 1 ? 's' : ''}</span>` : ''}
          </div>
          <div class="gallery-meta">
            🛰️ ${sys.constellation || 'Cielo'} &bull; ☀️ ${sys.starsCount} Sol${sys.starsCount > 1 ? 'es' : ''} (${sys.starSpecType || 'Solar'}) &bull; 🪐 ${sys.planetsCount} Planetas &bull; 🌡️ ${minTemp}K - ${maxTemp}K &bull; 📍 ${sys.distanceLy ? sys.distanceLy.toLocaleString() + ' AL' : 'Local'}
          </div>
        </div>
        <button class="btn-secondary" style="padding: 5px 10px; font-size:11px; white-space:nowrap;">Ver 3D</button>
      `;
      item.addEventListener('click', () => {
        this.selectSystem(sys);
        this.filterDrawer.style.display = 'none';
        this.toggleFilterBtn.classList.remove('active');
      });
      this.filteredGallery.appendChild(item);
    });
  }

  // =========================================================================
  // PRESET BUTTONS
  // =========================================================================

  setupPresetEvents() {
    this.presetChips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        this.presetChips.forEach(c => c.classList.remove('active'));
        e.target.classList.add('active');

        const preset = e.target.dataset.preset;
        this.loadPreset(preset);
      });
    });
  }

  loadPreset(preset) {
    switch (preset) {
      case 'solar':
        this.selectSystem(this.systems.find(s => s.name === 'Sistema Solar'));
        break;
      case 'trappist':
        this.selectSystem(this.systems.find(s => s.name === 'TRAPPIST-1'));
        break;
      case 'binary-tatooine':
        this.selectSystem(this.systems.find(s => s.name === 'Kepler-16'));
        break;
      case 'kepler47':
        this.selectSystem(this.systems.find(s => s.name === 'Kepler-47'));
        break;
      case 'kepler90':
        this.selectSystem(this.systems.find(s => s.name === 'Kepler-90'));
        break;
      case 'proxima':
        this.selectSystem(this.systems.find(s => s.name.includes('Proxima') || s.name.includes('Alpha Centauri')));
        break;
      case 'habitable': {
        const hzSystems = this.systems.filter(s => s.name !== 'Sistema Solar' && (s.planets || []).some(p => p.inHabitableZone));
        if (hzSystems.length > 0) {
          this.selectSystem(hzSystems[Math.floor(Math.random() * hzSystems.length)]);
        }
        break;
      }
      case 'three-planets': {
        const threePlanets = this.systems.filter(s => s.planetsCount === 3);
        if (threePlanets.length > 0) {
          this.selectSystem(threePlanets[Math.floor(Math.random() * threePlanets.length)]);
        }
        break;
      }
      case 'random': {
        const rand = this.systems[Math.floor(Math.random() * this.systems.length)];
        this.selectSystem(rand);
        break;
      }
    }
  }

  // =========================================================================
  // VIEWPORT CONTROLS
  // =========================================================================

  setupViewportControlEvents() {
    const hzBtn = document.getElementById('toggle-hz-btn');
    hzBtn.addEventListener('click', () => {
      const active = hzBtn.classList.toggle('active');
      this.viewer.toggleHabitableZone(active);
    });

    const orbitsBtn = document.getElementById('toggle-orbits-btn');
    orbitsBtn.addEventListener('click', () => {
      const active = orbitsBtn.classList.toggle('active');
      this.viewer.toggleOrbits(active);
    });

    const gridBtn = document.getElementById('toggle-grid-btn');
    gridBtn.addEventListener('click', () => {
      const active = gridBtn.classList.toggle('active');
      this.viewer.toggleGrid(active);
    });

    const labelsBtn = document.getElementById('toggle-labels-btn');
    labelsBtn.addEventListener('click', () => {
      const active = labelsBtn.classList.toggle('active');
      this.viewer.toggleLabels(active);
    });

    document.getElementById('reset-cam-btn').addEventListener('click', () => {
      this.viewer.resetCamera();
      this.highlightActiveRibbonChip(null);
    });

    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const speed = parseFloat(e.target.dataset.speed);
        this.viewer.setSimSpeed(speed);
      });
    });

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && document.activeElement !== this.searchInput) {
        e.preventDefault();
        const activeBtn = document.querySelector('.speed-btn.active');
        const isPaused = activeBtn && activeBtn.dataset.speed === '0';
        const targetBtn = document.querySelector(`.speed-btn[data-speed="${isPaused ? '1' : '0'}"]`);
        if (targetBtn) targetBtn.click();
      }
    });
  }

  setupGuideHint() {
    const hint = document.getElementById('guide-hint');
    const closeBtn = document.getElementById('close-guide-btn');
    closeBtn.addEventListener('click', () => {
      hint.style.opacity = '0';
      setTimeout(() => hint.remove(), 300);
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new CosmoScopeApp();
});
