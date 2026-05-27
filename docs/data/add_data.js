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
    description: "The largest plateau glacier in the European Alps. Its flat surface causes melt water to collect in dangerous glacial lakes. In 2018 a glacial lake drained catastrophically, causing flooding downstream.",
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
