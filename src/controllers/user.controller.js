const User = require("../models/User");

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
    const { phone, email, password } = req.body;

    if (!phone || !email || !password) {
      return res.status(400).json({ msg: "Phone, email and password are required" });
    }

    const user = await User.findOne({ phone, email });

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ msg: "Invalid password" });
    }

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
      token: user.generateAuthToken(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
const jwt = require("jsonwebtoken");

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

