const { spawn } = require("child_process");
const User = require("../models/User");

exports.getNearbyBuildings = async (req, res) => {

  try {

    const { radius } = req.body;

    if (!radius) {
      return res.status(400).json({
        success: false,
        error: "Radius is required",
      });
    }

    /*
      AUTH USER
    */
    const userId = req.user.id;

    /*
      FETCH USER
    */
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    /*
      GET LOCATION
    */
    const lat = user.location?.latitude;
    const lon = user.location?.longitude;

    if (lat == null || lon == null) {
      return res.status(400).json({
        success: false,
        error: "User location not available",
      });
    }

    /*
      RUN PYTHON SERVICE
    */
    const pythonProcess = spawn("python", [
      "./src/python/query_service.py",
      lat.toString(),
      lon.toString(),
      radius.toString(),
    ]);

    let result = "";
    let errorOutput = "";

    pythonProcess.stdout.on("data", (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on("close", (code) => {

      if (code !== 0) {
        return res.status(500).json({
          success: false,
          error: errorOutput || "Python process failed",
        });
      }

      try {

        const parsed = JSON.parse(result);

        return res.json({
          success: true,
          radius,
          buildingCount: parsed.length,
          userLocation: {
            latitude: lat,
            longitude: lon,
            city: user.location.city,
            region: user.location.region,
            country: user.location.country,
          },
          buildings: parsed,
        });

      } catch (err) {

        return res.status(500).json({
          success: false,
          error: "Failed to parse Python response",
        });

      }

    });

  } catch (err) {

    return res.status(500).json({
      success: false,
      error: err.message,
    });

  }
};