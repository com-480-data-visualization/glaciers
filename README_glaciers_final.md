# Swiss Glaciers — COM-480 Data Visualization

Interactive visualization of Swiss glacier retreat across space, time, and measurement type. The project combines historical glacier outlines, glacier-specific length-change records, and flow-velocity measurements to make Swiss glacier change readable for a broad audience.

| Student | SCIPER |
| --- | --- |
| Stefan Peters | 329305 |
| Timaël Andrié | 362529 |
| Lilian Noé | 325520 |
| Corentin Suply | 330578 |

## Live website

The website is designed to be served from the `docs/` directory, for example through GitHub Pages:

```text
https://com-480-data-visualization.github.io/glaciers/
```

## Project idea

Scientific glacier datasets are detailed but often difficult to read for non-experts. Existing monitoring platforms expose many layers, metrics, and controls at once. Our goal is different: provide a public-facing visualization where the main retreat pattern is visible immediately, while still allowing users to drill down into measured data.

The visualization is built around three complementary questions:

1. **Where is glacier retreat happening?**  
   Historical glacier outlines are shown on a national map of Switzerland.

2. **How has each glacier changed over time?**  
   A timeline slider, popup charts, and glacier-specific detail pages show area and length-change evolution.

3. **How does glacier ice move where velocity data is available?**  
   A flow-velocity layer shows measured ice movement using arrows for direction and speed.

## How to run locally

This is a static website. No backend is required.

From the repository root:

```bash
python3 -m http.server 8000 --directory docs
```

Then open:

```text
http://localhost:8000
```

Do not open `docs/index.html` directly as a local file if you want all data loading to work reliably. The browser may block `fetch()` requests from `file://` URLs.

## Main interactions

- Use the **timeline slider** to switch between historical glacier inventory years.
- Click glacier polygons to inspect a glacier and see its area evolution.
- Open the selected glacier pages for detailed D3 length-change charts.
- Enable **Flow Velocity** mode to show measured glacier movement where GLAMOS velocity data is available.
- In velocity mode, use the velocity year slider to inspect different measurement years.
- Zoom in to see individual velocity stakes; zoomed-out views aggregate arrows by glacier.

## Repository structure

```text
.
├── README.md
├── Milestone1_Report.pdf
├── Milestone2_Report.pdf
├── docs/
│   ├── index.html                 # Landing page
│   ├── style.css                  # Shared site styling
│   ├── map/
│   │   ├── index.html             # Main interactive glacier map
│   │   ├── script.js              # Leaflet map, timeline, popups, velocity layer
│   │   └── style.css              # Map-specific styling
│   ├── glaciers/
│   │   ├── aletsch.html           # Glacier detail page
│   │   ├── gorner.html            # Glacier detail page
│   │   ├── rhone.html             # Glacier detail page
│   │   └── glacier-charts.js      # D3 length-change charts
│   ├── velocity/
│   │   ├── sandbox.html           # Earlier velocity prototype / development view
│   │   └── velocity_map.html      # Standalone velocity prototype
│   └── data/
│       ├── glaciers_1850.geojson
│       ├── glaciers_1931.geojson
│       ├── glaciers_1973.geojson
│       ├── glaciers_2010.geojson
│       ├── glaciers_2016.geojson
│       ├── glaciers_location.json
│       └── csv/
│           ├── length_change_*.csv
│           ├── length_change_cumulative_*.csv
│           ├── flow_velocity_clean.csv
│           └── flowvelocity_2025_imputed_no_ablation.csv
├── scripts/
│   └── convert.py                 # Shapefile-to-GeoJSON preprocessing
└── data_exploration/
    ├── flowvelocity_cleaning.ipynb
    ├── glaciers_qa_check.py
    └── length_changes_data_exploration.ipynb
```

## Data sources

The project uses public glacier monitoring data and map tiles:

- **GLAMOS Swiss Glacier Inventories**: historical glacier outlines for selected inventory years.
- **GLAMOS glacier length-change measurements**: used for glacier-specific cumulative and periodic retreat charts.
- **GLAMOS Swiss Glacier Flow Velocity, release 2025**: used for the velocity-arrow layer. The raw CSV included in the repository cites: `doi:10.18750/flowvelocity.2025.r2025`.
- **Swisstopo / geo.admin.ch map tiles**: used as the geographic basemap for the main map.
- **Leaflet and D3.js CDN assets**: used for map rendering and charts.

## Processed datasets

### Historical glacier outlines

The main map loads one GeoJSON file per inventory year:

| Year | File | Notes |
| ---: | --- | --- |
| 1850 | `docs/data/glaciers_1850.geojson` | Historical outline inventory |
| 1931 | `docs/data/glaciers_1931.geojson` | Historical outline inventory |
| 1973 | `docs/data/glaciers_1973.geojson` | Historical outline inventory |
| 2010 | `docs/data/glaciers_2010.geojson` | Modern outline inventory |
| 2016 | `docs/data/glaciers_2016.geojson` | Modern outline inventory |

The current map uses a named, matched subset of glacier polygons. It should not be interpreted as every raw polygon from the original GLAMOS inventories. This makes temporal comparison clearer, but it excludes glaciers that are unnamed, unmatched, newly split/merged, or otherwise difficult to compare across inventories.

### Length-change data

The glacier detail pages load CSV files for selected glaciers:

- `length_change_aletsch.csv`
- `length_change_cumulative_aletsch.csv`
- `length_change_gorner.csv`
- `length_change_cumulative_gorner.csv`
- `length_change_rhone.csv`
- `length_change_cumulative_rhone.csv`

These files are rendered with D3.js in `docs/glaciers/glacier-charts.js`.

### Flow-velocity data

The integrated flow-velocity layer loads:

```text
docs/data/csv/flowvelocity_2025_imputed_no_ablation.csv
```

It contains measured stake positions, measurement periods, horizontal displacement, and velocity. The map converts Swiss projected coordinates to WGS84 in the browser, then renders arrows whose direction and length/color encode measured flow.

Velocity coverage is sparse. It exists only for selected glaciers and selected years, so the velocity layer is intentionally optional.

## Data preprocessing

The main preprocessing script is:

```text
scripts/convert.py
```

It converts GLAMOS shapefiles to browser-readable GeoJSON:

```bash
python3 scripts/convert.py path/to/inventory_shapefile.shp -c path/to/glacier_list.csv
```

The script:

1. reads a GLAMOS glacier inventory shapefile,
2. standardizes the glacier identifier column,
3. standardizes or computes area in square meters,
4. dissolves split polygons by glacier identifier,
5. optionally keeps only glaciers present in the previous processed inventory year,
6. joins glacier names from the GLAMOS glacier list,
7. converts the geometry to WGS84 (`EPSG:4326`),
8. writes a `glaciers_<year>.geojson` file to `docs/data/`.

This preprocessing choice creates a stable comparison set but is also the reason the final map is a matched subset rather than the full raw inventory.

## Technical implementation

The website is implemented as a lightweight static frontend:

- **Leaflet** renders the national glacier map and velocity arrows.
- **GeoJSON** stores glacier outlines for each inventory year.
- **D3.js** renders cumulative and periodic glacier length-change charts.
- **Vanilla JavaScript** handles interaction, filtering, popups, sliders, keyboard shortcuts, and velocity aggregation.
- **Static CSV files** provide length-change and velocity measurements.

No build step is required.

## Known limitations

- The outline map uses a matched subset of named glaciers, not the full raw inventory.
- Area outlines are available only for selected inventory years: 1850, 1931, 1973, 2010, and 2016.
- Length-change and area are different metrics and should not be treated as interchangeable.
- Velocity data is available only for selected glaciers and years.
- The velocity layer uses an in-browser coordinate conversion from Swiss projected coordinates to WGS84.
- Some development/prototype files remain in `docs/velocity/`; the main final flow-velocity interaction is now integrated into `docs/map/`.

## Milestone reports

- [Milestone 1 report](Milestone1_Report.pdf)
- [Milestone 2 report](Milestone2_Report.pdf)
- [Milestone 3 process book](Milestone3_ProcessBook.pdf)
- Screencast: TODO