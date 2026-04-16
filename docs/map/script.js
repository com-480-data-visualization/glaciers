// ── GLACIER DATA ──
const glaciers = [
  {
    id: "aletsch",
    name: "Grosser Aletschgletscher",
    region: "Bernese Alps, Valais",
    lat: 46.4428, lng: 8.0769,
    elevation: "1560–4160 m",
    type: "Valley glacier",
    description: "The largest glacier in the Alps and a UNESCO World Heritage site. It stretches over 22 km from the Jungfrau region down towards the Rhone Valley. It has been retreating significantly since the Little Ice Age.",
    tags: ["UNESCO Heritage", "Largest in Alps", "Valley glacier", "Valais"],
    areaByYear: { 1973: 82.5, 1980: 80.2, 1985: 78.5, 1990: 76.8, 1995: 75.0, 2000: 73.0, 2005: 70.5, 2010: 67.8, 2015: 64.5, 2020: 60.0, 2025: 56.0 }
  },
  {
    id: "gorner",
    name: "Gornergletscher",
    region: "Pennine Alps, Valais",
    lat: 45.9685, lng: 7.8010,
    elevation: "2200–4600 m",
    type: "Valley glacier",
    description: "The second-largest glacier system in the Alps, located near Zermatt at the foot of Monte Rosa. It forms a complex system with several tributary glaciers converging in a spectacular ice landscape.",
    tags: ["Monte Rosa", "Second largest", "Valley glacier", "Zermatt"],
    areaByYear: { 1973: 57.5, 1980: 56.0, 1985: 54.5, 1990: 53.0, 1995: 51.5, 2000: 49.5, 2005: 47.0, 2010: 44.5, 2015: 42.0, 2020: 39.0, 2025: 36.5 }
  },
  {
    id: "fiesch",
    name: "Fieschergletscher",
    region: "Bernese Alps, Valais",
    lat: 46.4900, lng: 8.1400,
    elevation: "1680–4049 m",
    type: "Valley glacier",
    description: "Stretching from the Finsteraarhorn towards the Rhone Valley, it is one of the major glaciers in the Bernese Alps. Its retreat has exposed new rocky terrain and created proglacial lakes.",
    tags: ["Bernese Alps", "Valley glacier", "Finsteraarhorn"],
    areaByYear: { 1973: 32.0, 1980: 31.0, 1985: 30.2, 1990: 29.2, 1995: 28.0, 2000: 26.8, 2005: 25.2, 2010: 23.5, 2015: 21.5, 2020: 19.5, 2025: 17.8 }
  },
  {
    id: "unteraar",
    name: "Unteraargletscher",
    region: "Bernese Alps, Bern",
    lat: 46.5700, lng: 8.2300,
    elevation: "1930–3900 m",
    type: "Valley glacier",
    description: "Formed by the confluence of the Lauteraar and Finsteraar glaciers. It has been studied since the 1840s by Louis Agassiz and holds some of the oldest continuous glacier records in the world.",
    tags: ["Scientific history", "Bernese Alps", "Agassiz studies"],
    areaByYear: { 1973: 25.0, 1980: 24.2, 1985: 23.5, 1990: 22.7, 1995: 22.0, 2000: 21.0, 2005: 20.0, 2010: 18.8, 2015: 17.5, 2020: 16.0, 2025: 14.8 }
  },
  {
    id: "rhone",
    name: "Rhonegletscher",
    region: "Urner Alps, Valais",
    lat: 46.5833, lng: 8.3833,
    elevation: "2140–3630 m",
    type: "Valley glacier",
    description: "The source of the Rhone River and a famous tourist destination. Its ice grotto has attracted visitors for over a century. The glacier has dramatically retreated, and blankets are now placed on it to slow the melt.",
    tags: ["Rhone source", "Tourism", "Ice grotto", "Blanket protection"],
    areaByYear: { 1973: 17.0, 1980: 16.5, 1985: 16.0, 1990: 15.4, 1995: 14.7, 2000: 13.9, 2005: 13.0, 2010: 12.0, 2015: 10.8, 2020: 9.6, 2025: 8.5 }
  },
  {
    id: "findelen",
    name: "Findelengletscher",
    region: "Pennine Alps, Valais",
    lat: 46.0053, lng: 7.7992,
    elevation: "2560–3900 m",
    type: "Valley glacier",
    description: "A large glacier above Zermatt that feeds into the Findelbach stream. It is well known for its mass balance monitoring, which has provided key data for climate research.",
    tags: ["Mass balance monitoring", "Zermatt", "Climate research"],
    areaByYear: { 1973: 19.5, 1980: 19.0, 1985: 18.4, 1990: 17.8, 1995: 17.0, 2000: 16.0, 2005: 15.0, 2010: 13.8, 2015: 12.5, 2020: 11.2, 2025: 10.0 }
  },
  {
    id: "morteratsch",
    name: "Morteratschgletscher",
    region: "Bernina Range, Graubünden",
    lat: 46.4300, lng: 9.9340,
    elevation: "2050–3900 m",
    type: "Valley glacier",
    description: "One of the most accessible glaciers in the Alps, located near Pontresina. The glacier trail with markers showing its historical positions is a powerful reminder of climate change in action.",
    tags: ["Glacier trail", "Pontresina", "Tourism", "Bernina"],
    areaByYear: { 1973: 16.5, 1980: 16.0, 1985: 15.5, 1990: 15.0, 1995: 14.3, 2000: 13.5, 2005: 12.5, 2010: 11.5, 2015: 10.3, 2020: 9.2, 2025: 8.2 }
  },
  {
    id: "palue",
    name: "Palügletscher",
    region: "Bernina Range, Graubünden",
    lat: 46.3730, lng: 10.0220,
    elevation: "2450–3905 m",
    type: "Mountain glacier",
    description: "A dramatic icefall glacier that cascades down the north face of Piz Palü. Its three pillars of ice are one of the most photographed alpine scenes in Switzerland.",
    tags: ["Icefall", "Piz Palü", "Photography", "Bernina"],
    areaByYear: { 1973: 8.5, 1980: 8.2, 1985: 7.9, 1990: 7.5, 1995: 7.2, 2000: 6.8, 2005: 6.3, 2010: 5.7, 2015: 5.1, 2020: 4.5, 2025: 3.9 }
  },
  {
    id: "trift",
    name: "Triftgletscher",
    region: "Bernese Alps, Bern",
    lat: 46.7000, lng: 8.3600,
    elevation: "1660–3400 m",
    type: "Valley glacier",
    description: "Formerly one of the most dramatic valley glaciers, it has retreated to create a stunning proglacial lake. A spectacular suspension bridge now spans the gorge where the glacier once flowed.",
    tags: ["Proglacial lake", "Suspension bridge", "Dramatic retreat"],
    areaByYear: { 1973: 18.0, 1980: 17.2, 1985: 16.5, 1990: 15.6, 1995: 14.6, 2000: 13.4, 2005: 12.0, 2010: 10.5, 2015: 9.0, 2020: 7.5, 2025: 6.3 }
  },
  {
    id: "otemma",
    name: "Glacier d'Otemma",
    region: "Pennine Alps, Valais",
    lat: 45.9500, lng: 7.4000,
    elevation: "2600–3700 m",
    type: "Valley glacier",
    description: "A long, relatively flat valley glacier in the Val de Bagnes. Once one of the longest glaciers in the region, it has been splitting and fragmenting as it retreats upvalley.",
    tags: ["Val de Bagnes", "Fragmenting", "Pennine Alps"],
    areaByYear: { 1973: 17.5, 1980: 16.8, 1985: 16.0, 1990: 15.2, 1995: 14.3, 2000: 13.3, 2005: 12.2, 2010: 11.0, 2015: 9.8, 2020: 8.5, 2025: 7.4 }
  },
  {
    id: "oberaletsch",
    name: "Oberaletschgletscher",
    region: "Bernese Alps, Valais",
    lat: 46.4200, lng: 7.9900,
    elevation: "2260–3700 m",
    type: "Valley glacier",
    description: "A significant tributary of the Aletsch glacier system. It flows southward from the Bernese Alps and has been retreating steadily, contributing to the overall loss of the Aletsch system.",
    tags: ["Aletsch system", "Tributary", "Bernese Alps"],
    areaByYear: { 1973: 22.5, 1980: 21.8, 1985: 21.0, 1990: 20.2, 1995: 19.2, 2000: 18.0, 2005: 16.8, 2010: 15.3, 2015: 13.8, 2020: 12.3, 2025: 11.0 }
  },
  {
    id: "corbassiere",
    name: "Glacier de Corbassière",
    region: "Pennine Alps, Valais",
    lat: 46.0000, lng: 7.2833,
    elevation: "2250–4300 m",
    type: "Valley glacier",
    description: "Located below the Grand Combin, this is one of the largest glaciers in the western Pennine Alps. Its high-altitude accumulation area has slowed its retreat compared to lower-lying glaciers.",
    tags: ["Grand Combin", "Western Pennine", "High altitude"],
    areaByYear: { 1973: 18.0, 1980: 17.5, 1985: 17.0, 1990: 16.5, 1995: 16.0, 2000: 15.4, 2005: 14.7, 2010: 13.8, 2015: 12.8, 2020: 11.8, 2025: 10.8 }
  },
  {
    id: "fee",
    name: "Feegletscher",
    region: "Pennine Alps, Valais",
    lat: 46.1000, lng: 7.9167,
    elevation: "1900–4200 m",
    type: "Mountain glacier",
    description: "Towering above the village of Saas-Fee, this glacier forms a dramatic amphitheatre of ice. The ski area operates year-round on its upper reaches, but the lower tongue has retreated significantly.",
    tags: ["Saas-Fee", "Ski area", "Amphitheatre", "Tourism"],
    areaByYear: { 1973: 17.0, 1980: 16.5, 1985: 16.0, 1990: 15.3, 1995: 14.5, 2000: 13.5, 2005: 12.5, 2010: 11.3, 2015: 10.0, 2020: 8.8, 2025: 7.8 }
  },
  {
    id: "gauli",
    name: "Gauligletscher",
    region: "Bernese Alps, Bern",
    lat: 46.6200, lng: 8.2200,
    elevation: "2200–3600 m",
    type: "Valley glacier",
    description: "Famous for a dramatic 1946 emergency landing of a US military aircraft on its surface. A proglacial lake has formed as the glacier has retreated, now a popular destination for adventurous hikers.",
    tags: ["1946 plane landing", "Proglacial lake", "Bernese Alps"],
    areaByYear: { 1973: 13.0, 1980: 12.5, 1985: 12.0, 1990: 11.4, 1995: 10.7, 2000: 10.0, 2005: 9.2, 2010: 8.2, 2015: 7.2, 2020: 6.2, 2025: 5.4 }
  },
  {
    id: "zinal",
    name: "Glacier de Zinal",
    region: "Pennine Alps, Valais",
    lat: 46.0667, lng: 7.6333,
    elevation: "2400–4200 m",
    type: "Valley glacier",
    description: "Nestled in the Val de Zinal, this glacier is surrounded by some of the most dramatic peaks in the Alps including the Weisshorn and Dent Blanche. Part of the iconic Haute Route skiing traverse.",
    tags: ["Val de Zinal", "Haute Route", "Weisshorn"],
    areaByYear: { 1973: 14.5, 1980: 14.0, 1985: 13.5, 1990: 12.9, 1995: 12.2, 2000: 11.3, 2005: 10.4, 2010: 9.4, 2015: 8.3, 2020: 7.2, 2025: 6.3 }
  },
  {
    id: "tsanfleuron",
    name: "Glacier de Tsanfleuron",
    region: "Bernese Alps, Valais/Vaud",
    lat: 46.3250, lng: 7.2750,
    elevation: "2580–3000 m",
    type: "Plateau glacier",
    description: "A unique plateau glacier located in the Glacier 3000 ski area. Its retreat has revealed a mountain pass last exposed 2000 years ago, providing evidence of past warm periods.",
    tags: ["Glacier 3000", "Plateau glacier", "Archaeological finds"],
    areaByYear: { 1973: 5.5, 1980: 5.2, 1985: 4.9, 1990: 4.6, 1995: 4.3, 2000: 3.9, 2005: 3.5, 2010: 3.0, 2015: 2.5, 2020: 2.0, 2025: 1.5 }
  },
  {
    id: "basodino",
    name: "Ghiacciaio del Basòdino",
    region: "Lepontine Alps, Ticino",
    lat: 46.4100, lng: 8.4800,
    elevation: "2650–3230 m",
    type: "Cirque glacier",
    description: "The southernmost glacier of significance in Switzerland, located in Ticino. It is one of the reference glaciers for studying climate change impacts on small alpine glaciers south of the main Alpine divide.",
    tags: ["Ticino", "Southernmost", "Climate reference"],
    areaByYear: { 1973: 3.2, 1980: 3.0, 1985: 2.8, 1990: 2.6, 1995: 2.3, 2000: 2.1, 2005: 1.8, 2010: 1.5, 2015: 1.2, 2020: 0.9, 2025: 0.7 }
  },
  {
    id: "plaine_morte",
    name: "Plaine Morte",
    region: "Bernese Alps, Valais/Bern",
    lat: 46.3850, lng: 7.5100,
    elevation: "2650–2900 m",
    type: "Plateau glacier",
    description: "The largest plateau glacier in the European Alps. Its flat surface causes meltwater to collect in dangerous glacial lakes. In 2018 a glacial lake drained catastrophically, causing flooding downstream.",
    tags: ["Plateau glacier", "Glacial lakes", "Flood risk", "Crans-Montana"],
    areaByYear: { 1973: 10.0, 1980: 9.7, 1985: 9.4, 1990: 9.0, 1995: 8.6, 2000: 8.1, 2005: 7.5, 2010: 6.8, 2015: 6.0, 2020: 5.2, 2025: 4.5 }
  },
  {
    id: "silvaplana",
    name: "Vadret da Roseg",
    region: "Bernina Range, Graubünden",
    lat: 46.3850, lng: 9.8650,
    elevation: "2250–3900 m",
    type: "Valley glacier",
    description: "A stunning glacier in the Roseg Valley near Pontresina. Its retreat has created a large proglacial lake with milky turquoise waters, one of the most beautiful in the Swiss Alps.",
    tags: ["Roseg Valley", "Proglacial lake", "Pontresina", "Bernina"],
    areaByYear: { 1973: 12.0, 1980: 11.6, 1985: 11.2, 1990: 10.7, 1995: 10.2, 2000: 9.5, 2005: 8.8, 2010: 8.0, 2015: 7.1, 2020: 6.2, 2025: 5.5 }
  },
  {
    id: "griesgletscher",
    name: "Griesgletscher",
    region: "Lepontine Alps, Valais",
    lat: 46.4400, lng: 8.3300,
    elevation: "2400–3300 m",
    type: "Valley glacier",
    description: "Located at the Nufenen Pass area, this glacier feeds into the Griessee reservoir. Mass balance measurements have been conducted here since 1962, making it one of the longest-monitored glaciers in Switzerland.",
    tags: ["Mass balance since 1962", "Nufenen Pass", "Reservoir"],
    areaByYear: { 1973: 6.5, 1980: 6.2, 1985: 6.0, 1990: 5.7, 1995: 5.3, 2000: 5.0, 2005: 4.5, 2010: 4.0, 2015: 3.4, 2020: 2.8, 2025: 2.3 }
  }
];

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
const map = L.map('map', {
  center: [46.55, 8.2],
  zoom: 9,
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
  attribution: '&copy; <a href="https://www.swisstopo.admin.ch">swisstopo</a>'
}).addTo(map);

// ── MARKERS ──
const markers = {};
const tooltip = document.getElementById('mapTooltip');

glaciers.forEach(g => {
  const area = interpolateArea(g, 1973);
  const size = getMarkerSize(area);
  const color = getColor(g, 1973);

  const icon = L.divIcon({
    className: 'glacier-marker',
    html: `<div class="marker-dot" style="width:${size}px;height:${size}px;background:${color};color:${color}" data-id="${g.id}"></div>
           <div class="marker-label">${g.name.split('gletscher')[0].split('Glacier')[0].trim()}</div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
  });

  const marker = L.marker([g.lat, g.lng], { icon }).addTo(map);

  marker.on('click', () => {
    // Fly to the glacier
    map.flyTo([g.lat, g.lng], 12, { duration: 0.8 });
    
    // Draw the cool vector arrows directly on the map
    const year = parseInt(document.getElementById('yearSlider').value);
    drawVectorField(g, year);
    
    // Slide in the new minimalist panel!
    openPopup(g);
  });

  markers[g.id] = marker;
});

// ── UPDATE MARKERS ──
function updateMarkers(year) {
  let totalArea = 0;
  const initialTotal = glaciers.reduce((s,g) => s + g.areaByYear[1973], 0);

  glaciers.forEach(g => {
    const area = interpolateArea(g, year);
    totalArea += area;
    const size = getMarkerSize(area);
    const color = getColor(g, year);

    const marker = markers[g.id];
    const el = marker.getElement();
    if (el) {
      const dot = el.querySelector('.marker-dot');
      if (dot) {
        dot.style.width = size + 'px';
        dot.style.height = size + 'px';
        dot.style.background = color;
        dot.style.color = color;
      }
    }
  });

  document.getElementById('totalArea').textContent = totalArea.toFixed(0);
  const change = ((totalArea - initialTotal) / initialTotal * 100).toFixed(1);
  const changeEl = document.getElementById('totalChange');
  changeEl.textContent = change + '%';
  changeEl.style.color = change < 0 ? '#ff4d4d' : '#85c1e9'; // Adjusted colors
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
const yearSlider = document.getElementById('yearSlider');
const yearDisplay = document.getElementById('yearDisplay');

const ticks = document.getElementById('sliderTicks');
for (let y = 1973; y <= 2025; y += 4) {
  const tick = document.createElement('span');
  tick.className = 'slider-tick';
  tick.textContent = y;
  tick.addEventListener('click', () => {
    yearSlider.value = y;
    onYearChange(y);
  });
  ticks.appendChild(tick);
}

function onYearChange(year) {
  yearDisplay.textContent = year;
  updateMarkers(year);
}

yearSlider.addEventListener('input', (e) => onYearChange(parseInt(e.target.value)));

// ── MINIMAL POPUP LOGIC ──
const popup = document.getElementById('glacierPopup');
const popupClose = document.getElementById('popupClose');
const popupName = document.getElementById('popupName');

function openPopup(glacier) {
  popupName.textContent = glacier.name;
  popup.classList.add('open');
}

function closePopup() {
  popup.classList.remove('open');
  clearVectorField(); // Clean up the map when closing!
}

popupClose.addEventListener('click', closePopup);

// ── KEYBOARD SHORTCUTS ──
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closePopup();
  if (e.key === 'ArrowLeft') {
    yearSlider.value = Math.max(1973, parseInt(yearSlider.value) - 1);
    onYearChange(parseInt(yearSlider.value));
  }
  if (e.key === 'ArrowRight') {
    yearSlider.value = Math.min(2025, parseInt(yearSlider.value) + 1);
    onYearChange(parseInt(yearSlider.value));
  }
});

// ── INIT ──
updateMarkers(1973);