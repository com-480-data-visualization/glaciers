import geopandas as gpd
import pandas as pd
import argparse
from pathlib import Path

# This script aims to convert shapefiles (from the Database) into GeoJSON format, 
# which is more suitable for web applications and can be handled by Leaflet. 
# It works by providing it a path to a .shp file, as included in the original dataset.
# The output GeoJSON files are saved in the "data" directory.

# This script is run with the following command: 
# `python convert.py path/to/your/shapefile.shp -c path/to/glamos/glacier_list.csv`

parser = argparse.ArgumentParser(description="Convert Database Shapefiles to GeoJSON (Leaflet-friendly)")
parser.add_argument("shp_file", help="The path to your input .shp file")
parser.add_argument("-c", "--csv", default="glacier_list.csv", help="Path to the GLAMOS CSV file")
args = parser.parse_args()

file_path = Path(args.shp_file)
out_dir = Path("docs", "data")
out_dir.mkdir(parents=True, exist_ok=True)

ordered_years = ["1850", "1931", "1973", "2010", "2016"]
    
base_name = file_path.stem
year = base_name
for y in ordered_years:
    if y in base_name: year = y

output_file = out_dir / f"glaciers_{year}.geojson"


try:
    df_csv = pd.read_csv(args.csv, skiprows=6)
    df_csv = df_csv.drop([0, 1]) 
    
    glaciers_list = df_csv[['glacier id', 'glacier name']].dropna(subset=['glacier id'])

    glaciers = gpd.read_file(file_path)


    # Standardize SGI name
    if 'sgi-id' in glaciers.columns:
        glaciers = glaciers.rename(columns={'sgi-id': 'SGI'})

    # Standardize area column name (and convert units)
    if 'Shape_Area' in glaciers.columns:
        glaciers['area_m2'] = glaciers['Shape_Area']
    elif 'area_km2' in glaciers.columns:
        # Convert from km² to m²
        glaciers['area_m2'] = glaciers['area_km2'] * 1_000_000
    elif 'AREA' in glaciers.columns:
        glaciers['area_m2'] = glaciers['AREA']
    else:
        print("[!] WARNING: Area column missing. Derive it from geometry.")
        glaciers['area_m2'] = glaciers.geometry.area

    # Group by 'SGI' (for splitted glaciers) and sum areas
    glaciers = glaciers.dissolve(by='SGI', aggfunc={'area_m2': 'sum'}).reset_index()

    # Add only glaciers that were present in the previous year (to ensure physical continuity)
    if year in ordered_years and year != "1850":
        current_index = ordered_years.index(year)
        previous_year = ordered_years[current_index - 1]
        
        baseline_path = out_dir / f"glaciers_{previous_year}.geojson"
        
        if baseline_path.exists():
            import json
            with open(baseline_path, 'r', encoding='utf-8') as f:
                baseline_data = json.load(f)
            
            baseline_sgis = {feat['properties']['SGI'] for feat in baseline_data['features']}
            
            # Drop glaciers that weren't in the previous year
            initial_count = len(glaciers)
            glaciers = glaciers[glaciers['SGI'].isin(baseline_sgis)]
            
            dropped = initial_count - len(glaciers)


    # This keeps only the glaciers present in GLAMOS list (with name)
    glaciers = glaciers.merge(glaciers_list, left_on='SGI', right_on='glacier id', how='inner')
    glaciers = glaciers[['SGI', 'glacier name', 'area_m2', 'geometry']]
    glaciers = glaciers.to_crs(epsg=4326)

    # glaciers.geometry = glaciers.geometry.simplify(tolerance=0.001)

    print(f"[*] Saving to GeoJSON: {output_file}...")
    glaciers.to_file(output_file, driver="GeoJSON")
    
except Exception as e:
    print(f"[-] Error: {e}")