// controllers/map.controller.js

const fs = require("fs");
const path = require("path");

const MAP_FILES = {
  india: "india.geojson",

  maharashtra: "states/maharashtra.geojson",
  gujarat: "states/gujarat.geojson",
  karnataka: "states/karnataka.geojson",
  goa: "states/goa.geojson",

  usa: "countries/usa.geojson",
  canada: "countries/canada.geojson",
};

exports.getMap = async (req, res) => {
  try {
    const mapName = req.query.map?.toLowerCase();

    if (!mapName) {
      return res.status(400).json({
        success: false,
        message: "Map parameter required"
      });
    }

    const filePath = MAP_FILES[mapName];

    if (!filePath) {
      return res.status(404).json({
        success: false,
        message: "Map not found"
      });
    }

    const absolutePath = path.join(
      __dirname,
      "..",
      "geojson",
      filePath
    );

    const geojson = JSON.parse(
      fs.readFileSync(absolutePath, "utf8")
    );

    return res.json({
      success: true,
      map: mapName,
      data: geojson
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};