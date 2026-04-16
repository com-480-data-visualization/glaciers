import os
import geopandas as gpd
import pandas as pd

def normalize_sgi_id(series):
    """Helps comparing SGI IDs when referencing to a parent"""

    def clean_val(val):
        val = str(val)
        if '-' not in val: return val
        left, right = val.split('-', 1)
        right_cleaned = right.lstrip('0')
        if right_cleaned == '': right_cleaned = '0'
        return f"{left}-{right_cleaned}"
    return series.apply(clean_val)

def print_eda_stats(gdf, year):
    """Calculates and prints Mean, Median, Min, and Max for relevant (physical) columns."""
    print(f"\n--- Descriptive Statistics (SGI {year}) ---")
    
    physical_cols = ['area_km2', 'length_km', 'masl_min', 'masl_mean', 'masl_med', 'masl_max', 'slope_deg', 'aspect_deg']
    available_cols = [col for col in physical_cols if col in gdf.columns]
    
    if not available_cols:
        print("No continuous physical measurements available for this year to run stats.")
        return
        
    stats = gdf[available_cols].describe().T
    
    for col in available_cols:
        count = stats.loc[col, 'count']
        mean = stats.loc[col, 'mean']
        median = stats.loc[col, '50%']
        vmin = stats.loc[col, 'min']
        vmax = stats.loc[col, 'max']
        print(f"  [{col.ljust(10)}] -> Mean: {mean:8.2f} | Median: {median:8.2f} | Min: {vmin:8.2f} | Max: {vmax:8.2f}")


def check_historical_glacier_quality(gdf, year, all_gdfs=None):
    """Data quality checks for historical glacier datasets (1850, 1931, 1973, 2010)"""

    print(f"\n=========================================")
    print(f"       QUALITY & EDA REPORT: SGI {year}")
    print(f"=========================================")
    
    total_records = len(gdf)
    print(f"Total Records (Glaciers): {total_records}")
    
    print(f"\n--- Data Quality Checks ---")
    
    # NaNs count
    nan_counts = gdf.isna().sum()
    total_cells = total_records * len(gdf.columns)
    total_nans = nan_counts.sum()
    
    if total_nans > 0:
        overall_pct = (total_nans / total_cells) * 100
        print(f"Total NaN Values: {total_nans} ({overall_pct:.2f}% of all data cells)")
        print("NaN Breakdown by Column:")
        for col, count in nan_counts[nan_counts > 0].items():
            pct = (count / total_records) * 100
            print(f"  -> '{col}': {count} missing ({pct:.2f}%)")
    else:
        print("Total NaN Values: 0 (0.00%)")
    

    # SGI Format Check
    if 'SGI' in gdf.columns:
        invalid_sgi = gdf[~gdf['SGI'].astype(str).str.contains("-", na=False)]
        pct = (len(invalid_sgi) / total_records) * 100
        if len(invalid_sgi) > 0:
            print(f"Malformed SGI IDs: {len(invalid_sgi)} ({pct:.2f}%) -> {invalid_sgi['SGI'].tolist()[:5]}")
    

    # 1931-Specific: Area Check
    if year == 1931 and 'area_km2' in gdf.columns:
        invalid_area = gdf[gdf['area_km2'] <= 0]
        pct = (len(invalid_area) / total_records) * 100
        print(f"[1931] Zero/Negative Area: {len(invalid_area)} ({pct:.2f}%)")

    # 1973 & 2010 Specific: Parent Link Check
    elif year in [1973, 2010]:
        parent_col = f'Parent{1850 if year == 1973 else 1973}'
        target_year = 1850 if year == 1973 else 1973
        
        if parent_col in gdf.columns:
            missing_parent = gdf[parent_col].isna().sum()
            miss_pct = (missing_parent / total_records) * 100
            print(f"[{year}] Missing {parent_col} links: {missing_parent} ({miss_pct:.2f}%)")
            
            if all_gdfs and target_year in all_gdfs:
                raw_pointers = gdf[parent_col].dropna()
                raw_targets = all_gdfs[target_year]['SGI'].dropna()
                
                norm_pointers = normalize_sgi_id(raw_pointers)
                norm_targets = normalize_sgi_id(raw_targets).values
                
                broken_links = raw_pointers[~norm_pointers.isin(norm_targets)]
                if len(raw_pointers) > 0:
                    broken_pct = (len(broken_links) / len(raw_pointers)) * 100
                    print(f"[{year}] Broken pointers to {target_year}: {len(broken_links)} ({broken_pct:.2f}% of valid links)")


def check_glaciers_data_quality(directory_path):
    """Data quality checks for the 2016 glacier dataset and its sub-files"""

    target_file = None
    for filename in os.listdir(directory_path):
        if filename == "SGI_2016_glaciers.shp":
            target_file = os.path.join(directory_path, filename)
            break

    gdf = gpd.read_file(target_file)
    total_records = len(gdf)
    
    print(f"\n=========================================")
    print(f"       QUALITY & EDA REPORT: SGI 2016")
    print(f"=========================================")
    print(f"Total Records (Glaciers): {total_records}")
    
    print_eda_stats(gdf, 2016)
    print(f"\n--- Data Quality Checks ---")
    
    # NaNs count
    nan_counts = gdf.isna().sum()
    for col, count in nan_counts[nan_counts > 0].items():
        pct = (count / total_records) * 100
        print(f"  -> '{col}': {count} missing ({pct:.2f}%)")
            
    # Physics Anomaly Checks
    anomalies = {
        "Impossible Min Elev (<193 or >4634)": gdf[(gdf['masl_min'] < 193) | (gdf['masl_min'] > 4634)],
        "Impossible Max Elev (<193 or >4634)": gdf[(gdf['masl_max'] > 4634) | (gdf['masl_max'] < 193)],
        "Impossible Slope (<0 or >90)": gdf[(gdf['slope_deg'] < 0) | (gdf['slope_deg'] > 90)],
        "Corrupted Aspect (<0 or >360)": gdf[(gdf['aspect_deg'] < 0) | (gdf['aspect_deg'] > 360)],
        "Zero or Negative Area": gdf[gdf['area_km2'] <= 0]
    }
    
    for name, df_anom in anomalies.items():
        count = len(df_anom)
        pct = (count / total_records) * 100
        if count > 0:
            print(f"{name}: {count} ({pct:.2f}%)")
    
    check_2016_subfiles(directory_path, gdf)


def check_2016_subfiles(directory_path, master_gdf):
    """Data quality checks for the 2016 glacier sub-datasets (locations, debris cover, center lines, ice divides)"""

    print("\n=========================================")
    print("       QA REPORT: 2016 SUB-DATASETS")
    print("=========================================")
    
    # Extract the valid master IDs to check for orphans
    valid_master_ids = master_gdf['sgi-id'].dropna().values
    
    subfiles = {
        "Locations": "SGI_2016_glacier_locations.shp",
        "Debris Cover": "SGI_2016_debriscover.shp",
        "Center Lines": "SGI_2016_centerlines.shp",
        "Ice Divides": "SGI_2016_icedivides.shp"
    }
    
    for name, filename in subfiles.items():
        filepath = os.path.join(directory_path, filename)
        if not os.path.exists(filepath):
            print(f"Skipping {name}: File not found.")
            continue
            
        print(f"\n--- Checking {name} ({filename}) ---")
        gdf = gpd.read_file(filepath)
        total_records = len(gdf)
        print(f"Total Records: {total_records}")
        
        # NaN count
        nan_counts = gdf.isna().sum()
        total_nans = nan_counts.sum()
        if total_nans > 0:
            print(f"Total NaNs: {total_nans}")
            for col, count in nan_counts[nan_counts > 0].items():
                print(f"  -> '{col}': {count} missing")
        else:
            print("Total NaNs: 0")
            
        # Physical Anomaly Checks
        if 'area_km2' in gdf.columns:
            invalid_area = gdf[gdf['area_km2'] <= 0]
            if len(invalid_area) > 0:
                print(f"Zero/Negative Area found: {len(invalid_area)}")
                
        if 'length_km' in gdf.columns:
            invalid_length = gdf[gdf['length_km'] <= 0]
            if len(invalid_length) > 0:
                print(f"Zero/Negative Length found: {len(invalid_length)}")
                
        # Orphan Check
        if 'sgi-id' in gdf.columns:
            orphans = gdf[~gdf['sgi-id'].isin(valid_master_ids)]
            if len(orphans) > 0:
                print(f"ORPHANS DETECTED: {len(orphans)} records reference an sgi-id not in the main outlines!")
                
        # Ice Divides-Specific: Must have 2 parents
        if name == "Ice Divides":
            orphans_a = gdf[~gdf['sgi-id_a'].isin(valid_master_ids)]
            orphans_b = gdf[~gdf['sgi-id_b'].isin(valid_master_ids)]
            if len(orphans_a) > 0:
                print(f"ORPHANS DETECTED in 'sgi-id_a': {len(orphans_a)} invalid references.")
            if len(orphans_b) > 0:
                print(f"ORPHANS DETECTED in 'sgi-id_b': {len(orphans_b)} invalid references.")



if __name__ == "__main__":
    current_folder = os.getcwd()
    
    gdfs = {}
    try:
        gdfs[1850] = gpd.read_file(current_folder + "/inventory_sgi1850_r1992/SGI_1850.shp")
        gdfs[1931] = gpd.read_file(current_folder + "/inventory_sgi1931_r2022/SGI_1931.shp")
        gdfs[1973] = gpd.read_file(current_folder + "/inventory_sgi1973_r1976/SGI_1973.shp")
        gdfs[2010] = gpd.read_file(current_folder + "/inventory_sgi2010_r2010/SGI_2010.shp")
    except Exception as e:
        pass # Handle silently or print
    
    if gdfs:
        check_historical_glacier_quality(gdfs[1850], 1850, gdfs)
        check_historical_glacier_quality(gdfs[1931], 1931, gdfs)
        check_historical_glacier_quality(gdfs[1973], 1973, gdfs)
        check_historical_glacier_quality(gdfs[2010], 2010, gdfs)
        
    check_glaciers_data_quality(current_folder + "/inventory_sgi2016_r2020")