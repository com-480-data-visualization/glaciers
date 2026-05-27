const INVENTORY_YEARS = [1850, 1931, 1973, 2010, 2016];
const MIN_YEAR = 1850;
const MAX_YEAR = 2016;
const LATEST_INVENTORY_YEAR = 2016;

const STORY_GLACIERS = {
  'B36-26': { name: 'Aletsch', url: '../glaciers/aletsch.html' },
  'B56-07': { name: 'Gorner', url: '../glaciers/gorner.html' },
  'B43-03': { name: 'Rhone', url: '../glaciers/rhone.html' }
};

const VELOCITY_GLACIER_NAMES = new Set([
  'Allalingletscher',
  'Glacier de Corbassière',
  'Glacier du Giétro',
  'Grosser Aletschgletscher',
  'Hohlaubgletscher',
  'Rhonegletscher',
  'Schwarzberggletscher',
  'Silvrettagletscher'
]);

const swissBounds = L.latLngBounds([43.3, 5.7], [48.9, 11.0]);
const map = L.map('map', {
  center: [46.55, 8.2],
  zoom: 9,
  minZoom: 7,
  maxZoom: 16,
  maxBounds: swissBounds,
  maxBoundsViscosity: 1.0,
  preferCanvas: true,
  zoomControl: false,
  attributionControl: false
});

L.control.zoom({ position: 'topright' }).addTo(map);
L.control.attribution({ position: 'bottomright', prefix: false })
  .addAttribution('Map: <a href="https://openstreetmap.org">OSM</a> | Data: <a href="https://glamos.ch">GLAMOS</a>')
  .addTo(map);

const baseTileLayer = L.tileLayer('https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg', {
  maxZoom: 18,
  minZoom: 7,
  attribution: '&copy; <a href="https://www.swisstopo.admin.ch">swisstopo</a>'
});

const popup = document.getElementById('glacierPopup');
const popupClose = document.getElementById('popupClose');
const popupName = document.getElementById('popupName');
const yearSlider = document.getElementById('yearSlider');
const yearDisplay = document.getElementById('yearDisplay');
const ticks = document.getElementById('sliderTicks');
const chartContainer = document.getElementById('popupChartContainer');
const velocityToggleBtn = document.getElementById('velocityToggle');
const velocityPanel = document.getElementById('velocityPanel');
const velYearSlider = document.getElementById('velYearSlider');
const replayStoryBtn = document.getElementById('replayStory');
const mapLegend = document.getElementById('mapLegend');
const mapLoading = document.getElementById('mapLoading');
const loadingText = document.getElementById('loadingText');

let glacierMetadata = {};
let geojsonCache = {};
let loadingTokens = new Set();
let baselineAreaBySGI = {};
let activeGlacierSGI = null;
let selectedYear = MIN_YEAR;
let lostAreaLayerGroup = L.layerGroup().addTo(map);
let glacierLayerGroup = L.layerGroup().addTo(map);
let storyLayerGroup = L.layerGroup().addTo(map);
let velocityLayerGroup = L.layerGroup();
let velocityVisible = false;
let velocityData = null;
let introPlayed = false;
let isIntroAnimating = false;
let renderRequestId = 0;
let scheduledRender = null;
let fitInitialBounds = true;

function setLoading(token, isLoading, label = 'Loading glacier data') {
  if (isLoading) {
    loadingTokens.add(token);
    loadingText.textContent = label;
  } else {
    loadingTokens.delete(token);
  }
  mapLoading.classList.toggle('visible', loadingTokens.size > 0);
}

baseTileLayer.on('loading', () => setLoading('tiles', true, 'Loading map tiles'));
baseTileLayer.on('load', () => setLoading('tiles', false));
baseTileLayer.addTo(map);

function getFeatureAreaKm2(feature) {
  return (feature?.properties?.area_m2 || feature?.properties?.Shape_Area || 0) / 1000000;
}

function findFeatureBySGI(geojson, sgi) {
  return geojson?.features?.find(f => f.properties.SGI === sgi) || null;
}

function getInventoryBracket(year) {
  const y = Math.max(MIN_YEAR, Math.min(MAX_YEAR, Number(year)));
  for (let i = 0; i < INVENTORY_YEARS.length - 1; i++) {
    const previousYear = INVENTORY_YEARS[i];
    const nextYear = INVENTORY_YEARS[i + 1];
    if (y === previousYear) return { previousYear, nextYear: previousYear, t: 0 };
    if (y > previousYear && y < nextYear) {
      return { previousYear, nextYear, t: (y - previousYear) / (nextYear - previousYear) };
    }
  }
  return { previousYear: MAX_YEAR, nextYear: MAX_YEAR, t: 0 };
}

async function ensureInventoryYear(year) {
  if (geojsonCache[year]) return geojsonCache[year];
  setLoading(`inventory-${year}`, true, `Loading ${year} glacier inventory`);
  try {
    const response = await fetch(`../data/glaciers_${year}.geojson`);
    if (!response.ok) throw new Error(`Could not load inventory ${year}`);
    geojsonCache[year] = await response.json();
    return geojsonCache[year];
  } finally {
    setLoading(`inventory-${year}`, false);
  }
}

async function ensureBracketInventories(year) {
  const bracket = getInventoryBracket(year);
  await ensureInventoryYear(bracket.previousYear);
  await ensureInventoryYear(bracket.nextYear);
  return bracket;
}

function interpolateValue(previousValue, nextValue, t) {
  if (!Number.isFinite(previousValue)) return nextValue || 0;
  if (!Number.isFinite(nextValue)) return previousValue || 0;
  return previousValue + (nextValue - previousValue) * t;
}

function getInterpolatedArea(sgi, year) {
  const bracket = getInventoryBracket(year);
  const previousFeature = findFeatureBySGI(geojsonCache[bracket.previousYear], sgi);
  const nextFeature = findFeatureBySGI(geojsonCache[bracket.nextYear], sgi);
  return interpolateValue(getFeatureAreaKm2(previousFeature), getFeatureAreaKm2(nextFeature), bracket.t);
}

function getRelativeLossPct(sgi, year) {
  const baseline = baselineAreaBySGI[sgi];
  if (!baseline) return 0;
  return Math.max(0, ((baseline - getInterpolatedArea(sgi, year)) / baseline) * 100);
}

function getLossColor(lossPct) {
  if (lossPct < 10) return '#2f80a9';
  if (lossPct < 25) return '#60a6bf';
  if (lossPct < 40) return '#f2c166';
  if (lossPct < 60) return '#e98245';
  if (lossPct < 80) return '#cf4638';
  return '#7f1d1d';
}

function styleInventoryFeature(year, opacity) {
  return feature => {
    const sgi = feature.properties.SGI;
    const isActive = sgi === activeGlacierSGI;
    const isStory = STORY_GLACIERS[sgi];
    const lossPct = getRelativeLossPct(sgi, selectedYear);
    return {
      stroke: isActive || isStory,
      color: isActive ? '#08233a' : isStory ? '#ffffff' : '#16384d',
      weight: isActive ? 2.5 : isStory ? 1.8 : 0.5,
      fillColor: velocityVisible ? '#1b4f72' : getLossColor(lossPct),
      fillOpacity: velocityVisible ? 0.78 : Math.max(0.08, opacity * (isActive ? 0.92 : 0.74)),
      opacity: velocityVisible ? 0.9 : Math.max(0.12, opacity),
      dashArray: isStory && !isActive ? '4,5' : null
    };
  };
}

function bindGlacierInteractions(layer, feature) {
  const sgi = feature.properties.SGI;
  const glacierName = feature.properties['glacier name'] || `Glacier ${sgi}`;
  const story = STORY_GLACIERS[sgi];

  layer.on('click', () => {
    activeGlacierSGI = sgi;
    if (story) {
      openPopup({ name: glacierName, story });
    } else {
      openPopup({ name: glacierName });
    }
    map.flyToBounds(layer.getBounds(), {
      paddingTopLeft: [50, 50],
      paddingBottomRight: [360, 150],
      duration: 0.8
    });
    scheduleGlacierUpdate(selectedYear);
  });

  layer.on('mouseover', function () {
    this.setStyle({ stroke: true, color: '#08233a', weight: 2.5, fillOpacity: 0.95 });
    if (!L.Browser.ie) layer.bringToFront();
  });

  layer.on('mouseout', function () {
    scheduleGlacierUpdate(selectedYear);
  });

  layer.bindTooltip(
    `<b>${glacierName}</b><br>${getRelativeLossPct(sgi, selectedYear).toFixed(1)}% area loss since 1850`,
    { sticky: true }
  );
}

function buildDisplayData(geojson) {
  const features = velocityVisible
    ? geojson.features.filter(f => VELOCITY_GLACIER_NAMES.has(f.properties['glacier name']))
    : geojson.features;
  return { ...geojson, features };
}

function addInventoryLayer(year, opacity) {
  const displayData = buildDisplayData(geojsonCache[year]);
  const layer = L.geoJSON(displayData, {
    style: styleInventoryFeature(year, opacity),
    onEachFeature: (feature, featureLayer) => bindGlacierInteractions(featureLayer, feature)
  });
  glacierLayerGroup.addLayer(layer);
  return layer;
}

function drawLostArea(year) {
  lostAreaLayerGroup.clearLayers();
  if (velocityVisible || isIntroAnimating) return;

  if (!geojsonCache[MIN_YEAR]) return;
  const baselineDisplayData = buildDisplayData(geojsonCache[MIN_YEAR]);
  lostAreaLayerGroup.addLayer(L.geoJSON(baselineDisplayData, {
    interactive: false,
    style: feature => ({
      fillOpacity: 0,
      color: STORY_GLACIERS[feature.properties.SGI] || feature.properties.SGI === activeGlacierSGI ? '#8f2d17' : '#a75a37',
      weight: STORY_GLACIERS[feature.properties.SGI] || feature.properties.SGI === activeGlacierSGI ? 1.6 : 0.7,
      opacity: STORY_GLACIERS[feature.properties.SGI] || feature.properties.SGI === activeGlacierSGI ? 0.8 : 0.45,
      fillColor: '#f08a4b',
      fillOpacity: year > MIN_YEAR ? 0.26 : 0,
      dashArray: '5,5'
    })
  }));
}

function drawStoryHighlights() {
  storyLayerGroup.clearLayers();
  Object.entries(STORY_GLACIERS).forEach(([sgi, story]) => {
    const feature = findFeatureBySGI(geojsonCache[LATEST_INVENTORY_YEAR], sgi);
    if (!feature) return;
    const outline = L.geoJSON(feature, {
      style: {
        fillOpacity: 0,
        color: '#ffffff',
        weight: 3,
        opacity: 0.9,
        className: 'story-glacier-outline'
      },
      onEachFeature: (_, layer) => {
        layer.on('click', () => {
          activeGlacierSGI = sgi;
          openPopup({ name: feature.properties['glacier name'], story });
        });
      }
    });
    storyLayerGroup.addLayer(outline);

    const center = outline.getBounds().getCenter();
    const label = L.marker(center, {
      icon: L.divIcon({
        className: 'story-label',
        html: `<a href="${story.url}">${story.name}</a>`,
        iconSize: [96, 28],
        iconAnchor: [48, 14]
      })
    });
    storyLayerGroup.addLayer(label);
  });
}

function updateStats(year) {
  const countEl = document.getElementById('totalGlaciers');
  const areaEl = document.getElementById('totalArea');
  const changeEl = document.getElementById('totalChange');

  if (velocityVisible) {
    countEl.textContent = VELOCITY_GLACIER_NAMES.size;
    areaEl.textContent = '2016 outlines';
    changeEl.textContent = 'velocity only';
    changeEl.style.color = 'var(--earth-500)';
    return;
  }

  let totalArea = 0;
  let baselineArea = 0;
  if (activeGlacierSGI) {
    totalArea = getInterpolatedArea(activeGlacierSGI, year);
    baselineArea = baselineAreaBySGI[activeGlacierSGI] || 0;
    countEl.textContent = '1';
  } else {
    Object.keys(baselineAreaBySGI).forEach(sgi => {
      totalArea += getInterpolatedArea(sgi, year);
      baselineArea += baselineAreaBySGI[sgi];
    });
    countEl.textContent = Object.keys(baselineAreaBySGI).length;
  }

  areaEl.textContent = totalArea.toFixed(1);
  const change = baselineArea ? ((totalArea - baselineArea) / baselineArea) * 100 : 0;
  changeEl.textContent = `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
  changeEl.style.color = change < 0 ? 'var(--danger)' : 'var(--accent-green)';
}

async function updateGlacierPolygons(year) {
  const requestId = ++renderRequestId;
  selectedYear = Number(year);
  yearDisplay.textContent = selectedYear;

  const renderYear = velocityVisible ? LATEST_INVENTORY_YEAR : selectedYear;
  const bracket = await ensureBracketInventories(renderYear);
  if (requestId !== renderRequestId) return;

  glacierLayerGroup.clearLayers();
  const previousOpacity = bracket.previousYear === bracket.nextYear ? 1 : 1 - bracket.t;
  const nextOpacity = bracket.previousYear === bracket.nextYear ? 0 : bracket.t;

  drawLostArea(renderYear);
  const primaryLayer = addInventoryLayer(bracket.previousYear, previousOpacity);
  if (bracket.nextYear !== bracket.previousYear) addInventoryLayer(bracket.nextYear, nextOpacity);

  drawStoryHighlights();
  updateStats(renderYear);

  if (activeGlacierSGI && popup.classList.contains('open')) {
    drawGlacierChart(activeGlacierSGI, selectedYear);
  }

  if (!activeGlacierSGI && primaryLayer.getBounds().isValid() && fitInitialBounds) {
    fitInitialBounds = false;
    map.fitBounds(primaryLayer.getBounds(), { padding: [20, 20] });
  }
}

function scheduleGlacierUpdate(year) {
  selectedYear = Number(year);
  yearDisplay.textContent = selectedYear;
  if (scheduledRender) cancelAnimationFrame(scheduledRender);
  scheduledRender = requestAnimationFrame(() => {
    scheduledRender = null;
    updateGlacierPolygons(selectedYear);
  });
}

function drawSliderTicks() {
  ticks.innerHTML = '';
  INVENTORY_YEARS.forEach(year => {
    const tick = document.createElement('span');
    tick.className = 'slider-tick';
    tick.textContent = year;
    tick.style.left = `${((year - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100}%`;
    tick.addEventListener('click', () => {
      yearSlider.value = year;
      scheduleGlacierUpdate(year);
    });
    ticks.appendChild(tick);
  });
}

const velTicks = document.getElementById('velSliderTicks');
[1990, 1995, 2000, 2005, 2010, 2015, 2020, 2025].forEach(year => {
  const tick = document.createElement('span');
  tick.className = 'slider-tick';
  tick.textContent = year;
  tick.addEventListener('click', () => {
    velYearSlider.value = year;
    document.getElementById('velYearDisplay').textContent = year;
    if (velocityVisible) renderVelocityLayer(year);
  });
  velTicks.appendChild(tick);
});

yearSlider.addEventListener('input', e => scheduleGlacierUpdate(Number(e.target.value)));

async function drawGlacierChart(sgi, currentYear) {
  chartContainer.innerHTML = '<div class="popup-note">Loading inventory areas...</div>';
  await Promise.all(INVENTORY_YEARS.map(year => ensureInventoryYear(year)));
  const data = INVENTORY_YEARS.map(year => {
    const feat = findFeatureBySGI(geojsonCache[year], sgi);
    return feat ? { year, area: getFeatureAreaKm2(feat) } : null;
  }).filter(Boolean);

  if (data.length < 2) {
    chartContainer.innerHTML = '<div class="popup-note">Not enough inventory data.</div>';
    return;
  }

  const svgWidth = 400;
  const svgHeight = 180;
  const padLeft = 50;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 40;
  const drawWidth = svgWidth - padLeft - padRight;
  const drawHeight = svgHeight - padTop - padBottom;
  const yMax = Math.max(...data.map(d => d.area)) * 1.15;
  const interpolatedArea = getInterpolatedArea(sgi, currentYear);
  const getX = year => padLeft + ((year - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * drawWidth;
  const getY = area => (padTop + drawHeight) - ((area / yMax) * drawHeight);
  const linePoints = data.map(d => `${getX(d.year)},${getY(d.area)}`).join(' ');
  const polyPoints = `${getX(data[0].year)},${padTop + drawHeight} ${linePoints} ${getX(data[data.length - 1].year)},${padTop + drawHeight}`;
  const activeX = getX(currentYear);
  const activeY = getY(interpolatedArea);

  const yAxisSVG = [yMax, yMax / 2, 0].map(value => {
    const y = getY(value);
    return `<text x="0" y="${y + 4}" class="chart-axis-text">${value.toFixed(1)}</text>
      <line x1="${padLeft - 20}" y1="${y}" x2="${svgWidth - padRight}" y2="${y}" class="chart-grid-line" />`;
  }).join('');

  const xAxisSVG = data.map((d, index) => {
    const yOffset = index % 2 === 0 ? 28 : 15;
    return `<text x="${getX(d.year)}" y="${padTop + drawHeight + yOffset}" class="chart-axis-text" text-anchor="middle">${d.year}</text>`;
  }).join('');

  const pointsSVG = data.map(d => `<circle cx="${getX(d.year)}" cy="${getY(d.area)}" r="3" class="chart-point" />`).join('');

  chartContainer.innerHTML = `
    <svg viewBox="0 0 ${svgWidth} ${svgHeight}" width="100%" height="100%" class="chart-svg">
      <defs>
        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--glacier-light, #85c1e9)" stop-opacity="0.4" />
          <stop offset="100%" stop-color="var(--glacier-light, #85c1e9)" stop-opacity="0" />
        </linearGradient>
      </defs>
      ${yAxisSVG}
      <polygon points="${polyPoints}" fill="url(#areaGradient)" />
      <polyline points="${linePoints}" class="chart-main-line" />
      ${xAxisSVG}
      ${pointsSVG}
      <line x1="${activeX}" y1="${activeY}" x2="${activeX}" y2="${padTop + drawHeight}" class="chart-active-line" />
      <text x="${activeX}" y="${activeY - 12}" class="chart-active-text" text-anchor="middle">${currentYear}: ${interpolatedArea.toFixed(2)}</text>
      <circle cx="${activeX}" cy="${activeY}" r="4.5" class="chart-active-point" />
    </svg>`;
}

function openPopup(glacier) {
  popupName.textContent = glacier.name;
  const locationEl = document.getElementById('popupLocation');
  const storyAction = document.getElementById('storyAction');
  const data = glacierMetadata[activeGlacierSGI];
  locationEl.textContent = data ? `${data.range}, ${data.canton}` : 'Swiss Alps';
  locationEl.href = `https://www.google.com/maps/place/${encodeURIComponent(glacier.name)}`;

  if (glacier.story) {
    storyAction.href = glacier.story.url;
    storyAction.textContent = `Open ${glacier.story.name} detailed story`;
    storyAction.classList.add('visible');
  } else {
    storyAction.classList.remove('visible');
  }

  popup.classList.add('open');
  drawGlacierChart(activeGlacierSGI, selectedYear);
}

function closePopup() {
  popup.classList.remove('open');
  activeGlacierSGI = null;
  scheduleGlacierUpdate(selectedYear);
}

popupClose.addEventListener('click', closePopup);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closePopup();
  if (e.key === 'ArrowLeft') {
    yearSlider.value = Math.max(MIN_YEAR, Number(yearSlider.value) - 1);
    scheduleGlacierUpdate(Number(yearSlider.value));
  }
  if (e.key === 'ArrowRight') {
    yearSlider.value = Math.min(MAX_YEAR, Number(yearSlider.value) + 1);
    scheduleGlacierUpdate(Number(yearSlider.value));
  }
});

let isScrubbing = false;
chartContainer.addEventListener('pointerdown', e => {
  isScrubbing = true;
  chartContainer.setPointerCapture(e.pointerId);
  handleChartScrub(e);
});
chartContainer.addEventListener('pointermove', e => {
  if (isScrubbing) handleChartScrub(e);
});
chartContainer.addEventListener('pointerup', () => { isScrubbing = false; });
chartContainer.addEventListener('pointercancel', () => { isScrubbing = false; });

function handleChartScrub(e) {
  const rect = chartContainer.getBoundingClientRect();
  if (rect.width === 0) return;
  const scaleX = 400 / rect.width;
  const svgX = (e.clientX - rect.left) * scaleX;
  const year = Math.round(MIN_YEAR + ((svgX - 50) / (400 - 50 - 20)) * (MAX_YEAR - MIN_YEAR));
  const boundedYear = Math.max(MIN_YEAR, Math.min(MAX_YEAR, year));
  yearSlider.value = boundedYear;
  scheduleGlacierUpdate(boundedYear);
}

const VELOCITY_YEARS = [1990, 1991, 1992, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

function lv03ToWgs84(E, N) {
  const y = (E - 600000) / 1e6;
  const x = (N - 200000) / 1e6;
  const lon = 2.6779094 + 4.728982 * y + 0.791484 * y * x + 0.1306 * y * x * x - 0.0436 * y * y * y;
  const lat = 16.9023892 + 3.238272 * x - 0.270978 * y * y - 0.002528 * x * x - 0.0447 * y * y * x - 0.0140 * x * x * x;
  return [lat * 100 / 36, lon * 100 / 36];
}

async function loadVelocityCSV() {
  setLoading('velocity-csv', true, 'Loading flow velocity data');
  try {
    const resp = await fetch('../data/csv/flowvelocity_2025_imputed_no_ablation.csv');
    const text = await resp.text();
    const features = text.split('\n').slice(1).filter(line => line.trim()).map(line => {
      const cols = line.split(',');
      const stake = cols[0]?.trim();
      const glacier = cols[1]?.trim();
      const sgi = cols[2]?.trim();
      const dateTo = cols[6]?.trim();
      const E = parseFloat(cols[8]);
      const N = parseFloat(cols[9]);
      const altitude = parseFloat(cols[10]);
      const dx = parseFloat(cols[12]);
      const dy = parseFloat(cols[13]);
      const velocity = parseFloat(cols[16]);
      if (!stake || !dateTo || isNaN(E) || isNaN(N) || isNaN(velocity) || isNaN(dx) || isNaN(dy)) return null;
      const [lat, lon] = lv03ToWgs84(E, N);
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lon, lat] },
        properties: {
          stake,
          glacier,
          sgi,
          year: parseInt(dateTo.substring(0, 4), 10),
          dx,
          dy,
          velocity,
          angle: Math.atan2(dx, dy) * 180 / Math.PI,
          altitude,
          date_from: cols[4]?.trim(),
          date_to: dateTo
        }
      };
    }).filter(Boolean);
    return { type: 'FeatureCollection', features };
  } finally {
    setLoading('velocity-csv', false);
  }
}

function velColor(v) {
  if (v < 2) return '#4fc3f7';
  if (v < 4) return '#29b6f6';
  if (v < 6) return '#ffd54f';
  if (v < 8) return '#ff8f00';
  return '#f44336';
}

function arrowSVG(angle, vel, color) {
  const len = Math.min(8 + vel * 3.5, 36);
  return `<svg viewBox="-20 -20 40 40" width="40" height="40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <g transform="rotate(${angle})">
      <line x1="0" y1="${len / 2}" x2="0" y2="${-len / 2}" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
      <polygon points="0,${-len / 2 - 5} -4,${-len / 2 + 3} 4,${-len / 2 + 3}" fill="${color}"/>
    </g>
  </svg>`;
}

function nearestVelocityYear(year) {
  return VELOCITY_YEARS.reduce((a, b) => Math.abs(b - year) < Math.abs(a - year) ? b : a);
}

async function renderVelocityLayer(year) {
  velocityLayerGroup.clearLayers();
  const legendEl = document.getElementById('velocityLegend');
  if (!velocityVisible) {
    legendEl.classList.remove('visible');
    return;
  }

  if (!velocityData) velocityData = await loadVelocityCSV();
  const velYear = nearestVelocityYear(year);
  document.getElementById('velYearDisplay').textContent = velYear;
  velYearSlider.value = velYear;
  const features = velocityData.features.filter(f => f.properties.year === velYear);

  if (map.getZoom() < 11) {
    const byGlacier = {};
    features.forEach(f => {
      const p = f.properties;
      const [lon, lat] = f.geometry.coordinates;
      if (!byGlacier[p.glacier]) byGlacier[p.glacier] = { lats: [], lons: [], dxs: [], dys: [], vels: [] };
      byGlacier[p.glacier].lats.push(lat);
      byGlacier[p.glacier].lons.push(lon);
      byGlacier[p.glacier].dxs.push(p.dx);
      byGlacier[p.glacier].dys.push(p.dy);
      byGlacier[p.glacier].vels.push(p.velocity);
    });

    Object.entries(byGlacier).forEach(([name, g]) => {
      const lat = g.lats.reduce((a, b) => a + b) / g.lats.length;
      const lon = g.lons.reduce((a, b) => a + b) / g.lons.length;
      const meanDx = g.dxs.reduce((a, b) => a + b) / g.dxs.length;
      const meanDy = g.dys.reduce((a, b) => a + b) / g.dys.length;
      const meanVel = g.vels.reduce((a, b) => a + b) / g.vels.length;
      addVelocityMarker([lat, lon], Math.atan2(meanDx, meanDy) * 180 / Math.PI, meanVel, `<b>${name}</b><br>${meanVel.toFixed(1)} m/yr average · ${g.lats.length} stakes`);
    });
  } else {
    features.forEach(f => {
      const p = f.properties;
      const [lon, lat] = f.geometry.coordinates;
      addVelocityMarker([lat, lon], p.angle, p.velocity, `<b>${p.glacier}</b><br>${p.velocity.toFixed(1)} m/yr · ${Math.round(p.altitude)} m<br>${p.date_from} to ${p.date_to}`);
    });
  }

  if (!map.hasLayer(velocityLayerGroup)) velocityLayerGroup.addTo(map);
  legendEl.classList.add('visible');
}

function addVelocityMarker(latLng, angle, velocity, tooltip) {
  const color = velColor(velocity);
  const marker = L.marker(latLng, {
    icon: L.divIcon({
      html: arrowSVG(angle, velocity, color),
      className: 'velocity-arrow',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    })
  });
  marker.bindTooltip(tooltip, { direction: 'top', offset: [0, -20] });
  velocityLayerGroup.addLayer(marker);
}

velocityToggleBtn.addEventListener('click', async () => {
  velocityVisible = !velocityVisible;
  velocityToggleBtn.classList.toggle('active', velocityVisible);
  velocityToggleBtn.textContent = velocityVisible ? 'Area Timeline' : 'Flow Velocity';
  velocityPanel.classList.toggle('visible', velocityVisible);
  document.getElementById('mainSliderRow').classList.toggle('hidden', velocityVisible);
  document.getElementById('timelineHeader').classList.toggle('hidden', velocityVisible);
  mapLegend.classList.toggle('hidden', velocityVisible);
  document.getElementById('outlineYearLabel').textContent = velocityVisible ? 'Outline year: 2016 inventory' : '';

  if (velocityVisible) {
    await updateGlacierPolygons(LATEST_INVENTORY_YEAR);
    await renderVelocityLayer(Number(velYearSlider.value));
  } else {
    velocityLayerGroup.clearLayers();
    if (map.hasLayer(velocityLayerGroup)) map.removeLayer(velocityLayerGroup);
    document.getElementById('velocityLegend').classList.remove('visible');
    await updateGlacierPolygons(Number(yearSlider.value));
  }
});

velYearSlider.addEventListener('input', e => {
  const year = nearestVelocityYear(Number(e.target.value));
  document.getElementById('velYearDisplay').textContent = year;
  if (velocityVisible) renderVelocityLayer(year);
});

map.on('zoomend', () => {
  if (velocityVisible) renderVelocityLayer(Number(velYearSlider.value));
});

function runStoryAnimation(onFinish) {
  if (velocityVisible) velocityToggleBtn.click();
  activeGlacierSGI = null;
  isIntroAnimating = true;
  fitInitialBounds = false;
  const start = performance.now();
  const duration = 9000;
  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    const year = Math.round(MIN_YEAR + t * (MAX_YEAR - MIN_YEAR));
    yearSlider.value = year;
    scheduleGlacierUpdate(year);
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      isIntroAnimating = false;
      yearSlider.value = MAX_YEAR;
      updateGlacierPolygons(MAX_YEAR).then(() => {
        drawStoryHighlights();
        if (onFinish) onFinish();
      });
    }
  }
  requestAnimationFrame(step);
}

function setupIntro() {
  const overlay = document.getElementById('introOverlay');
  const play = document.getElementById('introPlay');
  const skip = document.getElementById('introSkip');

  function finishIntro() {
    overlay.classList.add('hidden');
    introPlayed = true;
    drawStoryHighlights();
  }

  play.addEventListener('click', () => {
    overlay.classList.add('hidden');
    runStoryAnimation(finishIntro);
  });

  skip.addEventListener('click', finishIntro);
  replayStoryBtn.addEventListener('click', () => runStoryAnimation());
}

async function initApp() {
  drawSliderTicks();
  try {
    const locationResponse = await fetch('../data/glaciers_location.json');
    if (locationResponse.ok) glacierMetadata = await locationResponse.json();
  } catch (error) {
    console.error('Failed to load glacier location data:', error);
  }

  await ensureInventoryYear(MIN_YEAR);

  geojsonCache[MIN_YEAR].features.forEach(feature => {
    baselineAreaBySGI[feature.properties.SGI] = getFeatureAreaKm2(feature);
  });

  setupIntro();
  await updateGlacierPolygons(MIN_YEAR);
}

initApp().catch(error => {
  console.error('Failed to initialize glacier map:', error);
});
