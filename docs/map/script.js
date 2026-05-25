
// ── HELPERS ──
const popup = document.getElementById('glacierPopup');
const popupClose = document.getElementById('popupClose');
const popupName = document.getElementById('popupName');
let glacierMetadata = {};


function interpolateArea(glacier, year) {
  const years = Object.keys(glacier.areaByYear).map(Number).sort((a,b)=>a-b);
  if (year <= years[0]) return glacier.areaByYear[years[0]];
  if (year >= years[years.length-1]) return glacier.areaByYear[years[years.length-1]];
  let lo = years[0], hi = years[years.length-1];
  for (let i = 0; i < years.length - 1; i++) {
    if (year >= years[i] && year <= years[i+1]) {
      lo = years[i]; hi = years[i+1]; break;
    }
  }
  const t = (year - lo) / (hi - lo);
  return glacier.areaByYear[lo] + t * (glacier.areaByYear[hi] - glacier.areaByYear[lo]);
}

function getColor(glacier, year) {
  const initial = glacier.areaByYear[1973];
  const current = interpolateArea(glacier, year);
  const loss = ((initial - current) / initial) * 100;
  if (loss > 50) return 'var(--danger)';
  const area = current;
  if (area > 30) return '#1a5276';
  if (area > 10) return '#2e86c1';
  return '#85c1e9';
}

function getMarkerSize(area) {
  return Math.max(10, Math.min(24, 8 + area * 0.2));
}


// ── MAP SETUP ──

const swissBounds = L.latLngBounds(
  [43.3, 5.7],  // South-West corner
  [48.9, 11.0]  // North-East corner
);

const map = L.map('map', {
  center: [46.55, 8.2],
  zoom: 8,
  minZoom: 7,
  maxZoom: 16,

  maxBounds: swissBounds, 
  maxBoundsViscosity: 1.0,

  zoomControl: false,
  attributionControl: false
});
map.on('click', clearVectorField);

L.control.zoom({ position: 'topright' }).addTo(map);
L.control.attribution({ position: 'bottomright', prefix: false })
  .addAttribution('Map: <a href="https://openstreetmap.org">OSM</a> | Data: <a href="https://glamos.ch">GLAMOS</a>')
  .addTo(map);

// Swisstopo national map (free WMTS)
L.tileLayer('https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg', {
  maxZoom: 18,
  minZoom: 7,
  attribution: '© <a href="https://www.swisstopo.admin.ch">swisstopo</a>'
}).addTo(map);



// ── GEOJSON SETUP ──
let currentGeojsonLayer = null;
let globalBaselineArea = null;
let activeGlacierSGI = null;

// Cache to store loaded GeoJSONs
const geojsonCache = {}; 

function getGlacierColor(feature, currentYear) {
  const currentArea_km2 = (feature.properties.area_m2 || feature.properties.Shape_Area || 0) / 1000000;

  // Look for 1850 data
  if (currentYear !== 1850 && geojsonCache[1850]) {
    const baselineFeature = geojsonCache[1850].features.find(f => f.properties.SGI === feature.properties.SGI);
    
    if (baselineFeature) {
      const baselineArea_km2 = (baselineFeature.properties.area_m2 || baselineFeature.properties.Shape_Area || 0) / 1000000;
      
      if (baselineArea_km2 > 0) {
        const loss = ((baselineArea_km2 - currentArea_km2) / baselineArea_km2) * 100;
        // Legend: color red if >50% loss
        if (loss > 50) return 'var(--danger)';
      }
    }
  }

  // Legend: color depending on size
  if (currentArea_km2 > 30) return 'var(--glacier-deep)';
  if (currentArea_km2 >= 10) return 'var(--glacier-mid)';
  return 'var(--glacier-light)';
}


// Keep track of our two layers globally to fade them
let layerY0 = null;
let layerY1 = null;

async function updateGlacierPolygons(year) {
  year = parseInt(year);
  const lerp = getLerp(year);
  const y0 = lerp.y0;
  const y1 = lerp.y1;

  // 1. Remove old layers
  if (layerY0) map.removeLayer(layerY0);
  if (layerY1) map.removeLayer(layerY1);

  try {
    // Ensure both anchors are in cache
    for (const y of [y0, y1]) {
      if (!geojsonCache[y]) {
        const response = await fetch(`../data/glaciers_${y}.geojson`);
        if (!response.ok) throw new Error(`HTTP error. Status: ${response.status}`);
        geojsonCache[y] = await response.json();
      }
    }

    const dataY0 = geojsonCache[y0];
    const dataY1 = geojsonCache[y1];

    // Helper to keep style and interactions DRY (Don't Repeat Yourself)
    const createGlacierLayer = (data, targetYear, opacity) => {
      return L.geoJSON(data, {
        style: (feature) => {
          const isActive = feature.properties.SGI === activeGlacierSGI;
          return {
            stroke: isActive,
            color: isActive ? '#042443' : undefined,
            weight: isActive ? 1 : 0,
            fillColor: getGlacierColor(feature, targetYear),
            // Apply opacity logic: mix base opacity (0.85) with current lerp fade
            fillOpacity: isActive ? 1 : (0.85 * opacity)
          };
        },
        onEachFeature: (feature, layer) => {
          if (feature.properties.SGI === activeGlacierSGI && !L.Browser.ie) {
            setTimeout(() => layer.bringToFront(), 10);
          }

          // Click => focus on glacier + open popup
          layer.on('click', () => {
            activeGlacierSGI = feature.properties.SGI;
            const glacierName = feature.properties['glacier name'] || `Glacier ${feature.properties.SGI}`;
            openPopup({ name: glacierName });
            map.flyToBounds(layer.getBounds(), {
              paddingTopLeft: [50, 50],
              paddingBottomRight: [350, 120],
              duration: 0.8
            });
            updateGlacierPolygons(year);
          });

          // Hover => highlight border
          layer.on('mouseover', function () {
            if (feature.properties.SGI === activeGlacierSGI) return;
            this.setStyle({
              stroke: true,
              color: '#042443',
              weight: 1,
              fillOpacity: 1
            });
            if (!L.Browser.ie) layer.bringToFront();
          });

          layer.on('mouseout', function (e) {
            if (feature.properties.SGI === activeGlacierSGI) return;
            
            e.target.setStyle({
              stroke: false,
              weight: 0,
              fillColor: getGlacierColor(feature, targetYear), // Re-fetch correct color
              fillOpacity: opacity // Use the current lerp opacity directly
            });
          });
        }
      });
    };

    // 2. Render both layers with cross-fade logic
    layerY0 = createGlacierLayer(dataY0, y0, (1 - lerp.t)).addTo(map);
    if (lerp.t > 0) {
      layerY1 = createGlacierLayer(dataY1, y1, lerp.t).addTo(map);
    }

    // 3. Header Stats logic (preserving your exact interpolation logic)
    let totalArea = 0;
    let glacierCount = 0;
    let baselineToCompare = null;

    if (year === 1850 && globalBaselineArea === null) {
      dataY0.features.forEach(f => globalBaselineArea += (f.properties.area_m2 || f.properties.Shape_Area || 0) / 1000000);
    }

    if (activeGlacierSGI) {
      const focusedFeature0 = dataY0.features.find(f => f.properties.SGI === activeGlacierSGI);
      const targetFeature1 = dataY1.features.find(f => f.properties.SGI === activeGlacierSGI) || focusedFeature0;

      if (focusedFeature0) {
        glacierCount = 1;
        const area0 = (focusedFeature0.properties.area_m2 || focusedFeature0.properties.Shape_Area || 0) / 1000000;
        const area1 = (targetFeature1.properties.area_m2 || targetFeature1.properties.Shape_Area || 0) / 1000000;
        totalArea = area0 + lerp.t * (area1 - area0);
        const baselineFeature = geojsonCache[1850]?.features.find(f => f.properties.SGI === activeGlacierSGI);
        baselineToCompare = baselineFeature ? (baselineFeature.properties.area_m2 || baselineFeature.properties.Shape_Area || 0) / 1000000 : null;
      }
    } else {
      glacierCount = dataY0.features.length;
      let sum0 = 0; dataY0.features.forEach(f => sum0 += (f.properties.area_m2 || f.properties.Shape_Area || 0) / 1000000);
      let sum1 = 0; dataY1.features.forEach(f => sum1 += (f.properties.area_m2 || f.properties.Shape_Area || 0) / 1000000);
      totalArea = sum0 + lerp.t * (sum1 - sum0);
      baselineToCompare = globalBaselineArea;
    }

    document.getElementById('totalGlaciers').textContent = glacierCount;
    document.getElementById('totalArea').textContent = totalArea.toFixed(1);

    if (activeGlacierSGI && popup.classList.contains('open')) {
      drawGlacierChart(activeGlacierSGI, year);
    }

    const changeEl = document.getElementById('totalChange');
    if (year === 1850) {
      if (!activeGlacierSGI) globalBaselineArea = totalArea;
      changeEl.textContent = '0.0%';
      changeEl.style.color = '#a0a0a0';
    } else if (baselineToCompare) {
      const change = ((totalArea - baselineToCompare) / baselineToCompare) * 100;
      changeEl.textContent = (change > 0 ? '+' : '') + change.toFixed(1) + '%';
      changeEl.style.color = change < 0 ? 'var(--danger)' : 'var(--accent-green)';
    }

  } catch (error) {
    console.error(`Failed to load data for ${year}:`, error);
  }
}


// ── VECTOR FLOW FIELD ──
let vectorLayerGroup = L.layerGroup().addTo(map);
let vectorAnimFrame = null;

function clearVectorField() {
  vectorLayerGroup.clearLayers();
  document.getElementById('vectorLegend').classList.remove('visible');
  if (vectorAnimFrame) cancelAnimationFrame(vectorAnimFrame);
}


// ── YEAR SLIDER ──
const availableYears = [1850, 1931, 1973, 2010, 2016];

function getLerp(targetYear) {
  if (availableYears.includes(targetYear)) {
    return { y0: targetYear, y1: targetYear, t: 0 };
  }
  let y0 = availableYears[0];
  let y1 = availableYears[availableYears.length - 1];
  for (let i = 0; i < availableYears.length - 1; i++) {
    if (targetYear > availableYears[i] && targetYear < availableYears[i+1]) {
      y0 = availableYears[i];
      y1 = availableYears[i+1];
      break;
    }
  }
  const t = (targetYear - y0) / (y1 - y0);
  return { y0, y1, t };
}

const yearSlider = document.getElementById('yearSlider');
const yearDisplay = document.getElementById('yearDisplay');
const ticks = document.getElementById('sliderTicks');

const displayTicks = [];
for (let i = 0; i <= 12; i++) {
  displayTicks.push(Math.round(1850 + i * ((2016 - 1850) / 12)));
}

ticks.innerHTML = ''; 
displayTicks.forEach((year) => {
  const tick = document.createElement('span');
  tick.className = 'slider-tick';
  tick.textContent = year;
  
  tick.addEventListener('click', () => {
    yearSlider.value = year;
    onYearChange(year);
  });
  
  ticks.appendChild(tick);
});

function onYearChange(targetYear) {
  yearDisplay.textContent = targetYear;
  updateGlacierPolygons(targetYear);
}

yearSlider.addEventListener('input', (e) => onYearChange(parseInt(e.target.value)));


// ── MINIMAL POPUP LOGIC ──

// ── SVG CHART ENGINE ──
async function drawGlacierChart(sgi, currentYear) {
  const container = document.getElementById('popupChartContainer');

  container.innerHTML = '<div class="popup-placeholder">// Fetching historical records...</div>';
  
  // Extract data for this specific glacier
  const data = [];
  for (const y of availableYears) {
    if (!geojsonCache[y]) {
      try {
        const response = await fetch(`../data/glaciers_${y}.geojson`);
        if (response.ok) {
          geojsonCache[y] = await response.json();
        }
      } catch (e) {
        console.error(`[-] Failed to fetch ${y} for the chart.`);
      }
    }

    if (geojsonCache[y]) {
      const feat = geojsonCache[y].features.find(f => f.properties.SGI === sgi);
      if (feat) {
        const area_km2 = (feat.properties.area_m2 || feat.properties.Shape_Area || 0) / 1000000;
        data.push({ year: y, area: area_km2 });
      }
    }
  }

  if (data.length < 2) {
    container.innerHTML = '<div class="popup-placeholder">// Not enough historical data.</div>';
    return;
  }

  // Setup Scales
  const svgWidth = 400, svgHeight = 180;
  const padLeft = 50, padRight = 20, padTop = 20, padBottom = 40;
  const drawWidth = svgWidth - padLeft - padRight;   // 340px usable width
  const drawHeight = svgHeight - padTop - padBottom; // 120px usable height

  const minYear = 1850;
  const maxYear = 2016;
  
  const maxArea = Math.max(...data.map(d => d.area));
  const yMax = maxArea * 1.15; 

  // Map: Translate data to pixel coordinates
  const getX = (year) => padLeft + ((year - minYear) / (maxYear - minYear)) * drawWidth;
  const getY = (area) => (padTop + drawHeight) - ((area / yMax) * drawHeight);

  // Generate SVG Path Strings
  const linePoints = data.map(d => `${getX(d.year)},${getY(d.area)}`).join(' ');
  const polyPoints = `${getX(data[0].year)},${padTop + drawHeight} ${linePoints} ${getX(data[data.length-1].year)},${padTop + drawHeight}`;

  // Generate Ticks (Top, Middle, Bottom)
  const yTicks = [
    { value: yMax, y: padTop },
    { value: yMax / 2, y: padTop + (drawHeight / 2) },
    { value: 0, y: padTop + drawHeight }
  ];
  let yAxisSVG = '';
  yTicks.forEach(tick => {
    yAxisSVG += `
      <text x="0" y="${tick.y + 4}" class="chart-axis-text">${tick.value.toFixed(1)}</text>
      <line x1="${padLeft - 20}" y1="${tick.y}" x2="${svgWidth - padRight}" y2="${tick.y}" class="chart-grid-line" />
    `;
  });

  // Generate Data Points
  let pointsSVG = '';
  let xAxisSVG = '';
  let activeIndicatorSVG = '';

  data.forEach((d, index) => {
    const cx = getX(d.year);
    const cy = getY(d.area);

    const yOffset = (index % 2 === 0) ? 28 : 15;
    xAxisSVG += `<text x="${cx}" y="${padTop + drawHeight + yOffset}" class="chart-axis-text" text-anchor="middle">${d.year}</text>`;
    
    // Otherwise, just show regular points
    pointsSVG += `<circle cx="${cx}" cy="${cy}" r="3" class="chart-point" />`;
  });

  // If year present, highlight it (now perfectly interpolated!)
  const lerp = getLerp(currentYear);
  const currentX = getX(currentYear);
  
  const d0 = data.find(d => d.year === lerp.y0);
  const d1 = data.find(d => d.year === lerp.y1);
  
  let currentArea = 0;
  if (d0 && d1) {
    currentArea = d0.area + lerp.t * (d1.area - d0.area);
  } else if (d0) {
    currentArea = d0.area;
  }
  
  const currentY = getY(currentArea);

  activeIndicatorSVG = `
    <line x1="${currentX}" y1="${currentY}" x2="${currentX}" y2="${padTop + drawHeight}" class="chart-active-line" />
    <text x="${currentX}" y="${currentY - 12}" class="chart-active-text" text-anchor="middle">${currentArea.toFixed(2)}</text>
    <circle cx="${currentX}" cy="${currentY}" r="4.5" class="chart-active-point" />
  `;

  // Build final SVG
  container.innerHTML = `
    <svg viewBox="0 0 ${svgWidth} ${svgHeight}" width="100%" height="100%" class="chart-svg">
      <defs>
        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--glacier-light, #85c1e9)" stop-opacity="0.4" />
          <stop offset="100%" stop-color="var(--glacier-light, #85c1e9)" stop-opacity="0.0" />
        </linearGradient>
      </defs>
      
      ${yAxisSVG}
      
      <polygon points="${polyPoints}" fill="url(#areaGradient)" />
      <polyline points="${linePoints}" class="chart-main-line" />
      
      ${xAxisSVG}
      ${pointsSVG}
      ${activeIndicatorSVG}
    </svg>
  `;
}

function openPopup(glacier) {
  popupName.textContent = glacier.name;

  // Get location of the glacier
  const locationEl = document.getElementById('popupLocation');
  const data = glacierMetadata[activeGlacierSGI];
  if (data) {
    locationEl.innerHTML = `${data.range}, ${data.canton}`;
  } else {
    locationEl.innerHTML = `Swiss Alps`;
  }

  // Open new Google Maps search in a new tab when clicking the location
  const searchQuery = encodeURIComponent(glacier.name);
  locationEl.href = `https://www.google.com/maps/place/${searchQuery}`;

  popup.classList.add('open');
  drawGlacierChart(activeGlacierSGI, parseInt(yearDisplay.textContent));
}

function closePopup() {
  popup.classList.remove('open');
  clearVectorField();

  // Unselect glacier
  activeGlacierSGI = null;
  updateGlacierPolygons(parseInt(yearDisplay.textContent));

  // Zoom out to full map
  map.flyTo(
    [46.55, 8.2], 
    9, 
    { duration: 0.8 }
  );
}

popupClose.addEventListener('click', closePopup);

// ── KEYBOARD SHORTCUTS ──
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closePopup();
  // Spacebar toggles timeline play/pause
  if (e.key === ' ' || e.code === 'Space') {
    e.preventDefault(); 
    togglePlay();       
  }
  if (e.key === 'ArrowLeft') {
    yearSlider.value = Math.max(1850, parseInt(yearSlider.value) - 1);
    onYearChange(parseInt(yearSlider.value));
  }
  if (e.key === 'ArrowRight') {
    yearSlider.value = Math.min(2016, parseInt(yearSlider.value) + 1);
    onYearChange(parseInt(yearSlider.value));
  }
});


// ── 7. INTERACTIVE CHART SCRUBBING ──
const chartContainer = document.getElementById('popupChartContainer');
let isScrubbing = false;

chartContainer.style.cursor = 'pointer';

function handleChartScrub(e) {
  const rect = chartContainer.getBoundingClientRect();
  if (rect.width === 0) return; // Safety check

  const scaleX = 400 / rect.width;
  const svgX = (e.clientX - rect.left) * scaleX;

  const padLeft = 55, padRight = 20;
  const drawWidth = 400 - padLeft - padRight;
  const minYear = 1850, maxYear = 2016;

  // From mouse position, find corresponding year on the chart
  const hoveredYear = minYear + ((svgX - padLeft) / drawWidth) * (maxYear - minYear);

  // Update if different year
  const slider = document.getElementById('yearSlider');
  const scrubYear = Math.round(hoveredYear);
  
  if (parseInt(slider.value) !== scrubYear && scrubYear >= minYear && scrubYear <= maxYear) {
    slider.value = scrubYear;
    onYearChange(scrubYear);
  }
}

// Attach the listeners to the permanent container
chartContainer.addEventListener('pointerdown', (e) => {
  isScrubbing = true;
  chartContainer.setPointerCapture(e.pointerId);
  handleChartScrub(e);
});

chartContainer.addEventListener('pointermove', (e) => {
  if (isScrubbing) handleChartScrub(e);
});

chartContainer.addEventListener('pointerup', () => isScrubbing = false);
chartContainer.addEventListener('pointercancel', () => isScrubbing = false);


// ── INIT: BOOT SEQUENCE ──
async function initApp() {
  try {
    const locRes = await fetch('../data/glaciers_location.json');
    if (locRes.ok) glacierMetadata = await locRes.json();
    
    // Pre-fetch all geometries into RAM so the slider never lags!
    await Promise.all(availableYears.map(async (y) => {
      if (!geojsonCache[y]) {
        const res = await fetch(`../data/glaciers_${y}.geojson`);
        if (res.ok) geojsonCache[y] = await res.json();
      }
    }));
  } catch (error) {
    console.error("[-] Failed during boot sequence:", error);
  }

  onYearChange(parseInt(yearSlider.value));
}

initApp();


// ── 8. PLAYBACK LOGIC ──
let isPlaying = false;
let playInterval = null;
const playBtn = document.getElementById('playBtn');

function togglePlay() {
  if (isPlaying) {
    pause();
  } else {
    play();
  }
}

function play() {
  isPlaying = true;
  document.getElementById('icon').setAttribute('d', 'M6 19h4V5H6v14zm8-14v14h4V5h-4z'); // Pause Icon

  // 1. If we are already at the end, restart immediately upon clicking play
  if (parseInt(yearSlider.value) >= 2016) {
    yearSlider.value = 1850;
    onYearChange(1850);
  }

  playInterval = setInterval(() => {
    let y = parseInt(yearSlider.value);
    
    // 2. Loop logic: If we hit 2016, reset to 1850 instead of pausing
    if (y >= 2016) {
      pause();
    } else {
      yearSlider.value = y + 1;
      onYearChange(y + 1);
    }
  }, 30); // 30ms per year for stable clicking
}

function pause() {
  isPlaying = false;
  document.getElementById('icon').setAttribute('d', 'M8 5v14l11-7z'); // Play Icon
  clearInterval(playInterval);
}

playBtn.addEventListener('click', togglePlay);

yearSlider.addEventListener('mousedown', pause);
yearSlider.addEventListener('touchstart', pause);