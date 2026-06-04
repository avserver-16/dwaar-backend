// controllers/map.controller.js

const fs = require("fs");
const path = require("path");

const MAP_FILES = {
    india: "india.geojson",

    // States
    "andhra-pradesh": "states/andhra-pradesh.geojson",
    "arunachal-pradesh": "states/arunachal-pradesh.geojson",
    assam: "states/assam.geojson",
    bihar: "states/bihar.geojson",
    chhattisgarh: "states/chhattisgarh.geojson",
    goa: "states/goa.geojson",
    gujarat: "states/gujarat.geojson",
    haryana: "states/haryana.geojson",
    "himachal-pradesh": "states/himachal-pradesh.geojson",
    jharkhand: "states/jharkhand.geojson",
    karnataka: "states/karnataka.geojson",
    kerala: "states/kerala.geojson",
    "madhya-pradesh": "states/madhya-pradesh.geojson",
    maharashtra: "states/maharashtra.geojson",
    manipur: "states/manipur.geojson",
    meghalaya: "states/meghalaya.geojson",
    mizoram: "states/mizoram.geojson",
    nagaland: "states/nagaland.geojson",
    odisha: "states/odisha.geojson",
    punjab: "states/punjab.geojson",
    rajasthan: "states/rajasthan.geojson",
    sikkim: "states/sikkim.geojson",
    "tamil-nadu": "states/tamil-nadu.geojson",
    telangana: "states/telangana.geojson",
    tripura: "states/tripura.geojson",
    "uttar-pradesh": "states/uttar-pradesh.geojson",
    uttarakhand: "states/uttarakhand.geojson",
    "west-bengal": "states/west-bengal.geojson",

    // Union Territories
    chandigarh: "states/chandigarh.geojson",
    delhi: "states/delhi.geojson",
    "dadra-and-nagar-haveli-and-daman-and-diu":
        "states/dnh-and-dd.geojson",
    "jammu-and-kashmir": "states/jammu-and-kashmir.geojson",
    ladakh: "states/ladakh.geojson",
    lakshadweep: "states/lakshadweep.geojson",
    puducherry: "states/puducherry.geojson",
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
            "../../geojson",
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