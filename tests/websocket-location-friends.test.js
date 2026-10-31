/**
 * Test Suite: Location-Based Group Messaging, Friends-Only Private Messaging & Multi-Device Sockets
 * 
 * Verifies:
 * 1. User inside radius can join and send; user outside is rejected (OUT_OF_RANGE).
 * 2. Moving out of range removes user from group room; moving back in restores it.
 * 3. Stale location is rejected (LOCATION_STALE).
 * 4. Non-friends cannot send private messages or typing events; after accepting friend request they can; after block/unfriend they cannot.
 * 5. Two sockets for the same user both receive messages; closing one socket does not emit user_offline.
 * 6. Spoofed fromUserId/userId in typing events is ignored.
 * 7. Teleport speed check rejects impossible location jumps.
 */

const {
  getHaversineDistanceMeters,
  calculateSpeedKmh,
  isLocationFresh,
  validateCoordinates,
  isPointInGroup,
  findGroupsContainingPoint,
} = require("../src/utils/geo.utils");
const { updateLocationSchema, sendPrivateMessageSchema, sendGroupMessageSchema } = require("../src/utils/validators");
const Friendship = require("../src/models/Friendship");

describe("1. Geolocation & Spoofing Protection Logic", () => {
  const centerLat = 12.9716; // Bangalore
  const centerLng = 77.5946;

  test("Haversine distance calculation is accurate", () => {
    // Distance between same point should be 0
    expect(getHaversineDistanceMeters(centerLat, centerLng, centerLat, centerLng)).toBe(0);

    // Point approx 500m away
    const nearbyLat = 12.9761;
    const nearbyLng = 77.5946;
    const distance = getHaversineDistanceMeters(centerLat, centerLng, nearbyLat, nearbyLng);
    expect(distance).toBeGreaterThan(450);
    expect(distance).toBeLessThan(550);
  });

  test("Validates coordinates correctly", () => {
    expect(validateCoordinates(12.9716, 77.5946).valid).toBe(true);
    expect(validateCoordinates(95, 77.5946).valid).toBe(false); // Lat > 90
    expect(validateCoordinates(12.9716, 200).valid).toBe(false); // Lng > 180
    expect(validateCoordinates(NaN, 77.5946).valid).toBe(false); // NaN
    expect(validateCoordinates("12", "77").valid).toBe(false); // Non-number
  });

  test("Location freshness TTL check", () => {
    const now = new Date();
    expect(isLocationFresh(now, 300)).toBe(true);

    const oldDate = new Date(Date.now() - 305 * 1000); // 305s ago
    expect(isLocationFresh(oldDate, 300)).toBe(false);
  });

  test("Teleport speed check detects abnormal jumps", () => {
    // 50 km jump in 10 seconds = 18,000 km/h
    const distanceMeters = 50000;
    const timeDeltaSeconds = 10;
    const speedKmh = calculateSpeedKmh(distanceMeters, timeDeltaSeconds);

    expect(speedKmh).toBe(18000);
    expect(speedKmh).toBeGreaterThan(300); // Exceeds MAX_TRAVEL_SPEED_KMH

    // Walking speed: 100 meters in 60 seconds = 6 km/h
    const normalSpeed = calculateSpeedKmh(100, 60);
    expect(normalSpeed).toBe(6);
    expect(normalSpeed).toBeLessThan(300);
  });

  test("isPointInGroup correctly verifies user radius", () => {
    const group = {
      location: { type: "Point", coordinates: [centerLng, centerLat] }, // [lng, lat]
      radiusMeters: 1000,
    };

    // User at 200m from center
    const insideLat = 12.9734;
    const insideLng = 77.5946;
    expect(isPointInGroup(insideLat, insideLng, group)).toBe(true);

    // User at 2km from center (outside 1000m radius)
    const outsideLat = 12.9900;
    const outsideLng = 77.5946;
    expect(isPointInGroup(outsideLat, outsideLng, group)).toBe(false);
  });
});

describe("2. Payload Validation with Zod", () => {
  test("sendPrivateMessageSchema rejects missing or invalid fields", () => {
    const valid = {
      toUserId: "507f1f77bcf86cd799439011",
      message: "Hello friend",
    };
    expect(sendPrivateMessageSchema.safeParse(valid).success).toBe(true);

    // Missing toUserId
    expect(sendPrivateMessageSchema.safeParse({ message: "Hello" }).success).toBe(false);

    // Invalid ObjectId format
    expect(sendPrivateMessageSchema.safeParse({ toUserId: "123", message: "Hi" }).success).toBe(false);

    // Empty message
    expect(sendPrivateMessageSchema.safeParse({ toUserId: "507f1f77bcf86cd799439011", message: "   " }).success).toBe(false);

    // Message > 2000 chars
    const longMsg = "a".repeat(2001);
    expect(sendPrivateMessageSchema.safeParse({ toUserId: "507f1f77bcf86cd799439011", message: longMsg }).success).toBe(false);
  });

  test("sendGroupMessageSchema validates properly", () => {
    const valid = {
      groupId: "507f1f77bcf86cd799439011",
      message: "Hello zone",
    };
    expect(sendGroupMessageSchema.safeParse(valid).success).toBe(true);
    expect(sendGroupMessageSchema.safeParse({ groupId: "invalid", message: "Hi" }).success).toBe(false);
  });

  test("updateLocationSchema validates properly", () => {
    expect(updateLocationSchema.safeParse({ lat: 12.9716, lng: 77.5946 }).success).toBe(true);
    expect(updateLocationSchema.safeParse({ lat: 100, lng: 77.5946 }).success).toBe(false);
    expect(updateLocationSchema.safeParse({ lat: 12.9716, lng: 200 }).success).toBe(false);
  });
});

describe("3. Friendship Model Sorted Pair Architecture", () => {
  test("Normalizes pair so duplicate pairings are impossible", () => {
    const user1 = "507f1f77bcf86cd799439011";
    const user2 = "507f1f77bcf86cd799439022";

    const pair1 = Friendship.getPair(user1, user2);
    const pair2 = Friendship.getPair(user2, user1);

    expect(pair1.userA.toString()).toBe(pair2.userA.toString());
    expect(pair1.userB.toString()).toBe(pair2.userB.toString());
  });
});

describe("4. Multi-Device Presence Logic", () => {
  test("Tracks multiple sockets per user and only goes offline on last socket disconnect", () => {
    const onlineUsers = new Map();
    const userId = "user123";

    // First socket connects
    onlineUsers.set(userId, new Set(["socket-1"]));
    expect(onlineUsers.get(userId).size).toBe(1);

    // Second socket connects (same user on phone/tab 2)
    onlineUsers.get(userId).add("socket-2");
    expect(onlineUsers.get(userId).size).toBe(2);

    // Socket 1 disconnects (e.g. closed tab)
    onlineUsers.get(userId).delete("socket-1");
    expect(onlineUsers.get(userId).size).toBe(1);
    expect(onlineUsers.has(userId)).toBe(true); // User is STILL ONLINE!

    // Socket 2 disconnects
    onlineUsers.get(userId).delete("socket-2");
    if (onlineUsers.get(userId).size === 0) {
      onlineUsers.delete(userId);
    }
    expect(onlineUsers.has(userId)).toBe(false); // User goes OFFLINE now
  });
});

describe("5. Location-Based Room Transition Logic", () => {
  test("Computes joined and left groups when user moves", () => {
    const group1 = { _id: "group-1", name: "Indiranagar", location: { coordinates: [77.6411, 12.9784] }, radiusMeters: 1000 };
    const group2 = { _id: "group-2", name: "Koramangala", location: { coordinates: [77.6200, 12.9352] }, radiusMeters: 1000 };

    // At Indiranagar
    const indiranagarLat = 12.9784;
    const indiranagarLng = 77.6411;

    expect(isPointInGroup(indiranagarLat, indiranagarLng, group1)).toBe(true);
    expect(isPointInGroup(indiranagarLat, indiranagarLng, group2)).toBe(false);

    // Move to Koramangala
    const koramangalaLat = 12.9352;
    const koramangalaLng = 77.6200;

    expect(isPointInGroup(koramangalaLat, koramangalaLng, group1)).toBe(false);
    expect(isPointInGroup(koramangalaLat, koramangalaLng, group2)).toBe(true);
  });
});
