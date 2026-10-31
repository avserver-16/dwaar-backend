const User = require("../models/User");
const Room = require("../models/Room");
const jwt = require("jsonwebtoken");

// CREATE user
exports.createUser = async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// READ all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// READ single user
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE user
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE user
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CHECK if user exists by phone
exports.checkUserByPhone = async (req, res) => {
  try {
    let { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ msg: "Phone number is required" });
    }

    // Normalize phone (important for consistency)
    phone = phone.replace(/\D/g, ""); // removes spaces, +, -

    const user = await User.findOne({ phone }).select("_id name email");

    return res.status(200).json({
      exists: !!user,
      user: user || null, // optional: remove this if you don’t want to expose data
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// LOGIN user
exports.loginUser = async (req, res) => {
  try {
    let { phone, password } = req.body;

    if ((!phone) || !password) {
      return res.status(400).json({
        msg: "Phone and password are required",
      });
    }

    if (phone) {
      phone = phone.replace(/\D/g, "");
    }

    const query = {};
    if (phone) query.phone = phone;

    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({
        msg: "User not found",
      });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        msg: "Invalid password",
      });
    }

    const token = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    return res.status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
      },
      token,
      refreshToken,
    });

  } catch (err) {
    return res.status(500).json({
      error: err.message,
    });
  }
};

// LOGOUT user
exports.logoutUser = async (req, res) => {
  try {
    res.json({ msg: "Logout successful" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        msg: "Refresh token required",
      });
    }

    jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET,
      async (err, decoded) => {
        if (err) {
          return res.status(403).json({
            msg: "Invalid refresh token",
          });
        }

        /*
          CREATE NEW ACCESS TOKEN
        */
        const accessToken = jwt.sign(
          {
            id: decoded.id,
          },
          process.env.JWT_SECRET,
          {
            expiresIn: "1h",
          }
        );

        return res.json({
          token: accessToken,
        });
      }
    );
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};


exports.addLocation = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      latitude,
      longitude,
      city,
      region,
      country,
    } = req.body;

    /*
      VALIDATION
    */
    if (
      latitude === undefined ||
      longitude === undefined
    ) {
      return res.status(400).json({
        msg: "Latitude and longitude required",
      });
    }

    /*
      UPDATE USER LOCATION
    */
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        location: {
          latitude,
          longitude,
          city,
          region,
          country,
          updatedAt: new Date(),
        },
      },
      {
        new: true,
      }
    ).select("-password");

    return res.status(200).json({
      msg: "Location updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

exports.getLocation = async (req, res) => {
  try {
    /*
      USER ID FROM AUTH MIDDLEWARE
    */
    const userId = req.user.id;

    /*
      FIND USER
    */
    const user = await User.findById(userId)
      .select("location");

    if (!user) {
      return res.status(404).json({
        msg: "User not found",
      });
    }

    /*
      CHECK LOCATION EXISTS
    */
    if (!user.location) {
      return res.status(404).json({
        msg: "Location not found",
      });
    }

    return res.status(200).json({
      location: user.location,
    });
  } catch (err) {
    return res.status(500).json({
      error: err.message,
    });
  }
};

exports.joinRoom = async (req, res) => {
  try {
    const userId = req.user.id;
    const { roomId } = req.body;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: "roomId is required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const alreadyJoined = user.joinedRooms.some(
      (room) => room.roomId.toString() === roomId
    );

    if (alreadyJoined) {
      return res.status(400).json({
        success: false,
        message: "Already joined this room",
      });
    }

    if (room.members.length >= room.maxMembers) {
      return res.status(400).json({
        success: false,
        message: "Room is full",
      });
    }

    user.joinedRooms.push({
      roomId,
      joinedAt: new Date(),
    });

    room.members.push(userId);

    await user.save();
    await room.save();

    res.status(200).json({
      success: true,
      message: "Room joined successfully",
      joinedRooms: user.joinedRooms,
    });
  } catch (error) {
    console.error("joinRoom error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        msg: "User not found",
      });
    }

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

exports.getJoinedRooms = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId)
      .populate("joinedRooms.roomId");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      joinedRooms: user.joinedRooms || [],
    });

  } catch (error) {
    console.error("getJoinedRooms error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const Group = require("../sockets/group.model");
const { updateLocationSchema } = require("../utils/validators");
const {
  getHaversineDistanceMeters,
  calculateSpeedKmh,
  findGroupsContainingPoint,
  MAX_TRAVEL_SPEED_KMH,
} = require("../utils/geo.utils");

/**
 * REST Fallback: Update user real-time location
 * POST /api/users/location
 */
exports.updateUserLocation = async (req, res) => {
  try {
    const userId = req.user.id;
    const parseResult = updateLocationSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        error: "INVALID_LOCATION_PAYLOAD",
        details: parseResult.error.format(),
      });
    }

    const { lat, lng, accuracy } = parseResult.data;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "USER_NOT_FOUND", message: "User not found." });
    }

    const now = new Date();

    // Spoofing & rate limit protection
    if (user.lastLocation?.coordinates && user.lastLocation.coordinates.length === 2 && user.lastLocationAt) {
      const [oldLng, oldLat] = user.lastLocation.coordinates;
      const timeDeltaSeconds = (now.getTime() - new Date(user.lastLocationAt).getTime()) / 1000;

      // Rate limit: 5 seconds between updates
      if (timeDeltaSeconds < 5) {
        return res.status(429).json({
          error: "RATE_LIMITED",
          message: "Location updates are rate-limited to once every 5 seconds.",
        });
      }

      const distanceMeters = getHaversineDistanceMeters(oldLat, oldLng, lat, lng);
      const speedKmh = calculateSpeedKmh(distanceMeters, timeDeltaSeconds);

      // Teleport check (> 300 km/h and distance > 500m)
      if (speedKmh > MAX_TRAVEL_SPEED_KMH && distanceMeters > 500) {
        console.warn(`[Spoofing Alert REST] User ${userId} teleported ${distanceMeters.toFixed(0)}m in ${timeDeltaSeconds.toFixed(1)}s (${speedKmh.toFixed(1)} km/h)`);
        return res.status(400).json({
          error: "TELEPORT_DETECTED",
          code: "TELEPORT_DETECTED",
          message: "Location update rejected: abnormal travel speed detected.",
        });
      }
    }

    user.lastLocation = {
      type: "Point",
      coordinates: [lng, lat],
    };
    user.lastLocationAt = now;
    await user.save();

    // Recompute eligible groups
    const eligibleGroups = await findGroupsContainingPoint(lng, lat, Group);

    // If socket io instance is available, sync rooms for active sockets
    const io = req.app.get("io");
    if (io) {
      const socketIds = io.sockets.adapter.rooms.get(`user:${userId}`);
      if (socketIds) {
        const eligibleGroupIds = new Set(eligibleGroups.map((g) => g._id.toString()));
        for (const sId of socketIds) {
          const clientSocket = io.sockets.sockets.get(sId);
          if (clientSocket) {
            // Join new eligible rooms
            eligibleGroups.forEach((g) => clientSocket.join(`group:${g._id}`));
            // Leave rooms outside radius
            for (const room of clientSocket.rooms) {
              if (room.startsWith("group:")) {
                const gId = room.replace("group:", "");
                if (!eligibleGroupIds.has(gId)) {
                  clientSocket.leave(room);
                }
              }
            }
          }
        }
      }
      io.to(`user:${userId}`).emit("groups_updated", {
        eligibleGroups: eligibleGroups.map((g) => ({ id: g._id, name: g.name })),
      });
    }

    res.json({
      message: "Location updated successfully.",
      lastLocation: user.lastLocation,
      lastLocationAt: user.lastLocationAt,
      eligibleGroups: eligibleGroups.map((g) => ({ id: g._id, name: g.name, radiusMeters: g.radiusMeters })),
    });
  } catch (err) {
    console.error("updateUserLocation error:", err);
    res.status(500).json({ error: "SERVER_ERROR", message: "Failed to update location." });
  }
};


