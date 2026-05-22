const flowData = {
  aletsch:       { dir: 210, len: 0.065 },
  gorner:        { dir: 290, len: 0.055 },
  fiesch:        { dir: 200, len: 0.050 },
  unteraar:      { dir: 250, len: 0.048 },
  rhone:         { dir: 270, len: 0.045 },
  findelen:      { dir: 310, len: 0.042 },
  morteratsch:   { dir: 350, len: 0.044 },
  palue:         { dir:  0, len: 0.035 },
  trift:         { dir: 340, len: 0.048 },
  otemma:        { dir: 280, len: 0.046 },
  oberaletsch:   { dir: 180, len: 0.050 },
  corbassiere:   { dir: 200, len: 0.045 },
  fee:           { dir: 240, len: 0.040 },
  gauli:         { dir: 320, len: 0.042 },
  zinal:         { dir: 340, len: 0.043 },
  tsanfleuron:   { dir: 260, len: 0.030 },
  basodino:      { dir: 180, len: 0.028 },
  plaine_morte:  { dir: 240, len: 0.032 },
  silvaplana:    { dir: 350, len: 0.040 },
  griesgletscher:{ dir: 220, len: 0.035 }
};

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
  zoom: 9,
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
  attribution: '&copy; <a href="https://www.swisstopo.admin.ch">swisstopo</a>'
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


async function updateGlacierPolygons(year) {
  year = parseInt(year);

  if (currentGeojsonLayer) {
    map.removeLayer(currentGeojsonLayer);
  }

  try {
    let geojsonData = geojsonCache[year]

    if (!geojsonData) {
      const response = await fetch(`../data/glaciers_${year}.geojson`); 
      if (!response.ok) throw new Error(`HTTP error. Status: ${response.status}`);
      geojsonData = await response.json();
      geojsonCache[year] = geojsonData;
    }

    // Draw new sheet
    currentGeojsonLayer = L.geoJSON(geojsonData, {
      style: function (feature) {
        const isActive = feature.properties.SGI === activeGlacierSGI;
        return {
          stroke: isActive,
          color: isActive ? '#042443' : undefined,
          weight: isActive ? 1 : 0,
          fillColor: getGlacierColor(feature, year),
          fillOpacity: isActive ? 1 : 0.85
        };
      },
      onEachFeature: function (feature, layer) {

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
        
        layer.on('mouseout', function () {
          if (feature.properties.SGI === activeGlacierSGI) return;
          currentGeojsonLayer.resetStyle(this); 
        });

      }
    }).addTo(map);

    if (!activeGlacierSGI) {
      map.fitBounds(currentGeojsonLayer.getBounds(), { padding: [20, 20] });
    }

    // Header Stats - area, count and change
    let totalArea = 0;
    let glacierCount = 0;
    let baselineToCompare = null;

    if (year === 1850 && globalBaselineArea === null) {
      geojsonData.features.forEach(f => globalBaselineArea += (f.properties.area_m2 || f.properties.Shape_Area || 0) / 1000000);
    }

    if (activeGlacierSGI) {
      // Glacier-focus statistics
      const focusedFeature = geojsonData.features.find(f => f.properties.SGI === activeGlacierSGI);
      if (focusedFeature) {
        glacierCount = 1;
        totalArea = (focusedFeature.properties.area_m2 || focusedFeature.properties.Shape_Area || 0) / 1000000;
        
        const baselineFeature = geojsonCache[1850]?.features.find(f => f.properties.SGI === activeGlacierSGI);
        baselineToCompare = baselineFeature ? (baselineFeature.properties.area_m2 || baselineFeature.properties.Shape_Area || 0) / 1000000 : null;
      }
    } else {
      // Whole-map statistics
      glacierCount = geojsonData.features.length;
      geojsonData.features.forEach(f => totalArea += (f.properties.area_m2 || f.properties.Shape_Area || 0) / 1000000);
      baselineToCompare = globalBaselineArea;
    }

    document.getElementById('totalGlaciers').textContent = glacierCount;
    document.getElementById('totalArea').textContent = totalArea.toFixed(1);

    if (activeGlacierSGI && popup.classList.contains('open')) {
      drawGlacierChart(activeGlacierSGI, year);
    }
    

    const changeEl = document.getElementById('totalChange');
    if (year === 1850) {
      if (!activeGlacierSGI) {
        globalBaselineArea = totalArea;
      }

      changeEl.textContent = '0.0%';
      changeEl.style.color = '#a0a0a0'; // Neutral gray
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

function drawVectorField(glacier, year) {
  clearVectorField();
  const fd = flowData[glacier.id];
  if (!fd) return;

  document.getElementById('vectorLegend').classList.add('visible');

  const area = interpolateArea(glacier, year);
  const initial = glacier.areaByYear[1973];
  const meltRatio = Math.max(0, (initial - area) / initial);

  const flowRad = (fd.dir - 90) * Math.PI / 180; 
  const areaScale = Math.sqrt(area / initial);
  const baseRadius = fd.len * 1.3 * areaScale;
  const aspectRatio = 1.8; 

  const numArrows = 32; 
  const arrows = [];

  for (let i = 0; i < numArrows; i++) {
    const theta = (i / numArrows) * Math.PI * 2; 

    const localX = Math.cos(theta) * baseRadius * aspectRatio; 
    const localY = Math.sin(theta) * baseRadius;              

    const cosF = Math.cos(flowRad);
    const sinF = Math.sin(flowRad);
    const dLat = localX * sinF + localY * cosF;
    const dLng = (localX * cosF - localY * sinF) * 1.4;

    const seed = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    const seed2 = Math.sin(i * 269.5 + 183.3) * 43758.5453;
    const jLat = ((seed - Math.floor(seed)) - 0.5) * baseRadius * 0.15;
    const jLng = ((seed2 - Math.floor(seed2)) - 0.5) * baseRadius * 0.15 * 1.4;

    const lat = glacier.lat + dLat + jLat;
    const lng = glacier.lng + dLng + jLng;

    const toCenterAngle = Math.atan2(glacier.lat - lat, (glacier.lng - lng) / 1.4);

    const ptAngle = Math.atan2(dLat, dLng / 1.4);
    const downstream = 0.5 + 0.5 * Math.cos(ptAngle - flowRad);
    const lateral = Math.abs(Math.sin(ptAngle - flowRad));

    let type, color;

    if (downstream > 0.7 && meltRatio > 0.03) {
      type = 'melt';
      color = '#e74c3c'; 
    } else if (lateral > 0.55) {
      type = 'lateral';
      color = '#e67e22'; 
    } else {
      type = 'flow';
      color = '#2980b9'; 
    }

    const intensity = 0.006;
    const endLat = lat + Math.sin(toCenterAngle) * intensity;
    const endLng = lng + Math.cos(toCenterAngle) * intensity * 1.4;

    arrows.push({ lat, lng, endLat, endLng, angle: toCenterAngle, color, type, intensity });
  }

  arrows.forEach((a) => {
    const pts = [[a.lat, a.lng], [a.endLat, a.endLng]];

    vectorLayerGroup.addLayer(L.polyline(pts, {
      color: '#ffffff', weight: 5, opacity: 0.35, lineCap: 'round'
    }));
    vectorLayerGroup.addLayer(L.polyline(pts, {
      color: a.color, weight: 3, opacity: 1, lineCap: 'round'
    }));

    const headLen = 0.004;
    const a1 = a.angle + Math.PI * 0.65;
    const a2 = a.angle - Math.PI * 0.65;
    const h1 = [a.endLat + Math.sin(a1)*headLen, a.endLng + Math.cos(a1)*headLen*1.4];
    const h2 = [a.endLat + Math.sin(a2)*headLen, a.endLng + Math.cos(a2)*headLen*1.4];
    const tip = [a.endLat, a.endLng];

    vectorLayerGroup.addLayer(L.polyline([h1, tip, h2], {
      color: '#ffffff', weight: 5, opacity: 0.35, lineCap: 'round', lineJoin: 'round'
    }));
    vectorLayerGroup.addLayer(L.polyline([h1, tip, h2], {
      color: a.color, weight: 3, opacity: 1, lineCap: 'round', lineJoin: 'round'
    }));
  });

  const outlinePoints = [];
  for (let i = 0; i <= 64; i++) {
    const theta = (i / 64) * Math.PI * 2;
    const localX = Math.cos(theta) * baseRadius * aspectRatio;
    const localY = Math.sin(theta) * baseRadius;
    const cosF = Math.cos(flowRad);
    const sinF = Math.sin(flowRad);
    const dLat = localX * sinF + localY * cosF;
    const dLng = (localX * cosF - localY * sinF) * 1.4;
    outlinePoints.push([glacier.lat + dLat, glacier.lng + dLng]);
  }
  const outline = L.polyline(outlinePoints, {
    color: '#2980b9',
    weight: 2.5,
    opacity: 0.6,
    dashArray: '8,5',
    fill: true,
    fillColor: 'rgba(133,193,233,0.1)',
    fillOpacity: 1
  });
  vectorLayerGroup.addLayer(outline);
}


// ── YEAR SLIDER ──
const availableYears = [1850, 1931, 1973, 2010, 2016];
const yearSlider = document.getElementById('yearSlider');
const yearDisplay = document.getElementById('yearDisplay');
const ticks = document.getElementById('sliderTicks');

ticks.innerHTML = ''; 
availableYears.forEach((year, index) => {
  const tick = document.createElement('span');
  tick.className = 'slider-tick';
  tick.textContent = year;
  tick.addEventListener('click', () => {
    yearSlider.value = index;
    onYearChange(index);
  });
  ticks.appendChild(tick);
});

function onYearChange(sliderIndex) {
  const actualYear = availableYears[sliderIndex];
  yearDisplay.textContent = actualYear;
  updateGlacierPolygons(actualYear);
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
    const isActive = d.year === currentYear;

    const yOffset = (index % 2 === 0) ? 28 : 15;
    xAxisSVG += `<text x="${cx}" y="${padTop + drawHeight + yOffset}" class="chart-axis-text" text-anchor="middle">${d.year}</text>`;
    // If year present, highlight it
    
    if (isActive) {
      activeIndicatorSVG = `
        <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${padTop + drawHeight}" class="chart-active-line" />
        <text x="${cx}" y="${cy - 12}" class="chart-active-text" text-anchor="middle">${d.area.toFixed(2)}</text>
        <circle cx="${cx}" cy="${cy}" r="4.5" class="chart-active-point" />
      `;
    } else {
      // Otherwise, just show regular points
      pointsSVG += `<circle cx="${cx}" cy="${cy}" r="3" class="chart-point" />`;
    }
  });

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
  locationEl.href = `https://www.google.com/maps/place/${searchQuery}`

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
  if (currentGeojsonLayer) {
    map.flyToBounds(currentGeojsonLayer.getBounds(), { 
      padding: [20, 20], 
      duration: 0.8 
    });
  }
}

popupClose.addEventListener('click', closePopup);

// ── KEYBOARD SHORTCUTS ──
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closePopup();
  if (e.key === 'ArrowLeft') {
    yearSlider.value = Math.max(0, parseInt(yearSlider.value) - 1);
    onYearChange(parseInt(yearSlider.value));
  }
  if (e.key === 'ArrowRight') {
    yearSlider.value = Math.min(4, parseInt(yearSlider.value) + 1);
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

  // Find closest available year
  let closestIndex = 0;
  let minDiff = Infinity;
  
  availableYears.forEach((y, index) => {
    const diff = Math.abs(y - hoveredYear);
    if (diff < minDiff) {
      minDiff = diff;
      closestIndex = index;
    }
  });

  // Update if different year
  const slider = document.getElementById('yearSlider');
  if (parseInt(slider.value) !== closestIndex) {
    slider.value = closestIndex;
    onYearChange(closestIndex);
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
    const response = await fetch('../data/glaciers_location.json');
    if (!response.ok) throw new Error("Location file not found");
    
    glacierMetadata = await response.json();
  } catch (error) {
    console.error("[-] Failed to load glacier location:", error);
  }

  onYearChange(parseInt(yearSlider.value) || 0);
}

initApp();