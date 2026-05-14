const { spawn } = require("child_process");

exports.getNearbyBuildings = async (req, res) => {

    try {

        const { lat, lon, radius } = req.body;

        const pythonProcess = spawn("python", [
            "./src/python/query_service.py",
            lat,
            lon,
            radius
        ]);

        let result = "";

        pythonProcess.stdout.on("data", (data) => {
            result += data.toString();
        });

        pythonProcess.stderr.on("data", (data) => {
            console.error(data.toString());
        });

        pythonProcess.on("close", () => {

            try {

                const parsed = JSON.parse(result);

                res.json({
                    success: true,
                    count: parsed.length,
                    data: parsed
                });

            } catch (err) {

                res.status(500).json({
                    success: false,
                    error: "JSON parsing failed"
                });

            }

        });

    } catch (err) {

        res.status(500).json({
            success: false,
            error: err.message
        });

    }

};