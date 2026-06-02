import pandas as pd
import numpy as np
import joblib
from sklearn.neighbors import BallTree

# Earth radius & cell size
EARTH_RADIUS = 6371000
CELL_SIZE_METERS = 500

# Degrees per meter (approximate, used for grid snapping)
# At the equator: ~111,320 m/deg latitude, longitude varies by cos(lat)
LAT_DEG_PER_METER = 1 / 111_320

def assign_room_id(lat, lon):
    """
    Snap a coordinate to a 500m grid cell.
    Returns a stable string key: "row:col"
    Longitude step adjusts for latitude so cells are ~square.
    """
    lat_step = CELL_SIZE_METERS * LAT_DEG_PER_METER          # ~0.004493 deg
    lon_step = lat_step / np.cos(np.radians(lat))             # narrows near poles
    row = int(np.floor(lat / lat_step))
    col = int(np.floor(lon / lon_step))
    return f"{row}:{col}"

def build_room_index(df):
    """
    df must have 'lat' and 'lon' columns.
    Returns:
      - df with a 'room_id' column added
      - rooms dict: room_id -> {center_lat, center_lon, building_count, building_ids}
    """
    # Assign each building to a room
    df = df.copy()
    df["room_id"] = df.apply(lambda r: assign_room_id(r["latitude"], r["longitude"]), axis=1)

    # Build room metadata
    rooms = {}
    for room_id, group in df.groupby("room_id"):
        center_lat = group["latitude"].mean()
        center_lon = group["longitude"].mean()
        rooms[room_id] = {
            "room_id": room_id,
            "center_lat": center_lat,
            "center_lon": center_lon,
            "building_count": len(group),
            "building_ids": group.index.tolist(),
        }

    return df, rooms

# --- Main: load your data, build, save ---
df = joblib.load("coordinates_data.pkl")           # your existing file
df, rooms = build_room_index(df)

# Build BallTree on room centres (one point per room, not per building)
room_list = list(rooms.values())
room_coords = np.radians([[r["center_lat"], r["center_lon"]] for r in room_list])
room_ids    = [r["room_id"] for r in room_list]

tree = BallTree(room_coords, metric="haversine")

joblib.dump(tree,      "room_tree.pkl")
joblib.dump(room_ids,  "room_ids.pkl")
joblib.dump(rooms,     "rooms.pkl")
print(f"Indexed {len(df)} buildings → {len(rooms)} rooms")