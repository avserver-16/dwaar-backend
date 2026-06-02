import sys
import json
import joblib
import numpy as np
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

tree     = joblib.load(os.path.join(BASE_DIR, "room_tree.pkl"))
room_ids = joblib.load(os.path.join(BASE_DIR, "room_ids.pkl"))
rooms    = joblib.load(os.path.join(BASE_DIR, "rooms.pkl"))

EARTH_RADIUS = 6371000
CELL_SIZE_METERS = 500

def get_nearby_rooms(lat, lon, radius_meters):
    """
    Returns rooms whose *centre* falls within radius_meters.
    Edge rooms (centre outside radius but partially overlapping) are
    tagged as partial — their geometry can be a rectangle/trapezoid
    depending on how much of the cell is clipped by the radius boundary.
    """
    point          = np.radians([[lat, lon]])
    radius_radians = radius_meters / EARTH_RADIUS

    # Inner radius: fully inside
    inner_indices = tree.query_radius(point, r=radius_radians)[0]

    # Outer radius: cell diagonal extends ~354m from centre for a 500m cell
    # so a room whose centre is up to (radius + 354m) away may still overlap
    cell_half_diag_m   = (CELL_SIZE_METERS * np.sqrt(2)) / 2   # ~354 m
    outer_radius_rad   = (radius_meters + cell_half_diag_m) / EARTH_RADIUS
    outer_indices = tree.query_radius(point, r=outer_radius_rad)[0]

    inner_set = set(inner_indices)
    result = []

    for idx in outer_indices:
        rid  = room_ids[idx]
        room = rooms[rid].copy()

        if idx in inner_set:
            room["status"] = "full"        # entire cell likely inside radius
        else:
            room["status"] = "partial"     # edge cell — rectangle/trapezoid slice

        # Attach distance from user to room centre
        room["distance_m"] = round(
            haversine(lat, lon, room["center_lat"], room["center_lon"]), 1
        )
        result.append(room)

    # Sort: full rooms first, then partial, then by distance
    result.sort(key=lambda r: (r["status"] != "full", r["distance_m"]))
    return result

def haversine(lat1, lon1, lat2, lon2):
    R = EARTH_RADIUS
    phi1, phi2 = np.radians(lat1), np.radians(lat2)
    dphi = np.radians(lat2 - lat1)
    dlam = np.radians(lon2 - lon1)
    a = np.sin(dphi/2)**2 + np.cos(phi1)*np.cos(phi2)*np.sin(dlam/2)**2
    return R * 2 * np.arcsin(np.sqrt(a))

if __name__ == "__main__":
    lat    = float(sys.argv[1])
    lon    = float(sys.argv[2])
    radius = float(sys.argv[3])

    result = get_nearby_rooms(lat, lon, radius)

    summary = {
        "total_rooms":    len(result),
        "full_rooms":     sum(1 for r in result if r["status"] == "full"),
        "partial_rooms":  sum(1 for r in result if r["status"] == "partial"),
        "rooms":          result,
    }
    print(json.dumps(summary))