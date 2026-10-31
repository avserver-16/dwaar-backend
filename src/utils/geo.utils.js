/**
 * Geolocation & Haversine Distance Utilities for Dwaar
 */

const LOCATION_TTL_SECONDS = parseInt(process.env.LOCATION_TTL_SECONDS, 10) || 300;
const MAX_TRAVEL_SPEED_KMH = parseFloat(process.env.MAX_TRAVEL_SPEED_KMH) || 300;

/**
 * Calculate great-circle distance between two points in meters using Haversine formula
 */
function getHaversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's mean radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaPhi = toRad(lat2 - lat1);
  const deltaLambda = toRad(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate travel speed in km/h given distance in meters and time in seconds
 */
function calculateSpeedKmh(distanceMeters, timeDeltaSeconds) {
  if (timeDeltaSeconds <= 0) return 0;
  const distanceKm = distanceMeters / 1000;
  const hours = timeDeltaSeconds / 3600;
  return distanceKm / hours;
}

/**
 * Check if a location timestamp is still fresh
 */
function isLocationFresh(lastLocationAt, ttlSeconds = LOCATION_TTL_SECONDS) {
  if (!lastLocationAt) return false;
  const elapsedSeconds = (Date.now() - new Date(lastLocationAt).getTime()) / 1000;
  return elapsedSeconds >= 0 && elapsedSeconds <= ttlSeconds;
}

/**
 * Validate latitude and longitude values
 */
function validateCoordinates(lat, lng) {
  if (typeof lat !== "number" || typeof lng !== "number") {
    return { valid: false, error: "Latitude and longitude must be numbers." };
  }
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return { valid: false, error: "Latitude and longitude cannot be NaN." };
  }
  if (lat < -90 || lat > 90) {
    return { valid: false, error: "Latitude must be between -90 and 90 degrees." };
  }
  if (lng < -180 || lng > 180) {
    return { valid: false, error: "Longitude must be between -180 and 180 degrees." };
  }
  return { valid: true };
}

/**
 * Find all groups that contain the given point [lng, lat] within their radius
 */
async function findGroupsContainingPoint(lng, lat, GroupModel) {
  // Query groups that have valid location coordinates
  const groups = await GroupModel.find({
    "location.coordinates": { $exists: true, $ne: [] },
  }).lean();

  return groups.filter((group) => {
    if (!group.location || !group.location.coordinates || group.location.coordinates.length < 2) {
      return false;
    }
    const [groupLng, groupLat] = group.location.coordinates;
    const radiusMeters = group.radiusMeters || 1000;
    const distance = getHaversineDistanceMeters(lat, lng, groupLat, groupLng);
    return distance <= radiusMeters;
  });
}

/**
 * Check if a user's location is inside a specific group's radius
 */
function isPointInGroup(lat, lng, group) {
  if (!group.location || !group.location.coordinates || group.location.coordinates.length < 2) {
    return false;
  }
  const [groupLng, groupLat] = group.location.coordinates;
  const radiusMeters = group.radiusMeters || 1000;
  const distance = getHaversineDistanceMeters(lat, lng, groupLat, groupLng);
  return distance <= radiusMeters;
}

module.exports = {
  LOCATION_TTL_SECONDS,
  MAX_TRAVEL_SPEED_KMH,
  getHaversineDistanceMeters,
  calculateSpeedKmh,
  isLocationFresh,
  validateCoordinates,
  findGroupsContainingPoint,
  isPointInGroup,
};
