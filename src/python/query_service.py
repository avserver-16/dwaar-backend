import sys
import json
import joblib
import numpy as np
import os

# Current file directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Absolute paths
TREE_PATH = os.path.join(BASE_DIR, "spatial_tree.pkl")
DATA_PATH = os.path.join(BASE_DIR, "coordinates_data.pkl")

# Load files
tree = joblib.load(TREE_PATH)
df = joblib.load(DATA_PATH)

EARTH_RADIUS = 6371000

def get_nearby_buildings(lat, lon, radius_meters):

    point = np.radians([[lat, lon]])

    radius_radians = radius_meters / EARTH_RADIUS

    indices = tree.query_radius(
        point,
        r=radius_radians
    )[0]

    results = df.iloc[indices]

    return results.to_dict(orient="records")


if __name__ == "__main__":

    lat = float(sys.argv[1])
    lon = float(sys.argv[2])
    radius = float(sys.argv[3])

    results = get_nearby_buildings(lat, lon, radius)

    print(json.dumps(results))