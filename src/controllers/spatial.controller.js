const { spawn } = require("child_process");
const path = require("path");

const PYTHON_DIR = path.resolve(__dirname, "../python");

// ── helper: runs a python script and resolves with parsed JSON ──────────────
function runPython(scriptName, args) {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(PYTHON_DIR, scriptName);
        const process = spawn("python", [scriptPath, ...args.map(String)]);

        let stdout = "";
        let stderr = "";

        process.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
        process.stderr.on("data", (chunk) => { stderr += chunk.toString(); });

        process.on("close", (code) => {
            if (code !== 0) {
                return reject(new Error(stderr || `Python exited with code ${code}`));
            }
            try {
                resolve(JSON.parse(stdout));
            } catch {
                reject(new Error(`JSON parse failed. Raw output: ${stdout.slice(0, 200)}`));
            }
        });

        process.on("error", (err) => reject(err));
    });
}

// ── validation helper ────────────────────────────────────────────────────────
function validateSpatialParams(lat, lon, radius) {
    const errors = [];

    const latN    = parseFloat(lat);
    const lonN    = parseFloat(lon);
    const radiusN = parseFloat(radius);

    if (isNaN(latN) || latN < -90  || latN > 90)   errors.push("lat must be a number between -90 and 90");
    if (isNaN(lonN) || lonN < -180 || lonN > 180)   errors.push("lon must be a number between -180 and 180");
    if (isNaN(radiusN) || radiusN <= 0)              errors.push("radius must be a positive number (metres)");
    if (radiusN > 50_000)                            errors.push("radius cannot exceed 50,000 m");

    return { latN, lonN, radiusN, errors };
}

// ── existing controller (buildings) ─────────────────────────────────────────
exports.getNearbyBuildings = async (req, res) => {
    try {
        const { lat, lon, radius } = req.body;
        const { latN, lonN, radiusN, errors } = validateSpatialParams(lat, lon, radius);

        if (errors.length) {
            return res.status(400).json({ success: false, errors });
        }

        const parsed = await runPython("query_service.py", [latN, lonN, radiusN]);

        res.json({
            success: true,
            count: parsed.length,
            data: parsed,
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// ── new controller (rooms) ───────────────────────────────────────────────────
exports.getNearbyRooms = async (req, res) => {
    try {
        const { lat, lon, radius } = req.body;
        const { latN, lonN, radiusN, errors } = validateSpatialParams(lat, lon, radius);

        if (errors.length) {
            return res.status(400).json({ success: false, errors });
        }

        const parsed = await runPython("query_rooms.py", [latN, lonN, radiusN]);

        // parsed is already the summary object from query_rooms.py:
        // { total_rooms, full_rooms, partial_rooms, rooms: [...] }
        res.json({
            success: true,
            query: { lat: latN, lon: lonN, radius_m: radiusN },
            summary: {
                total_rooms:   parsed.total_rooms,
                full_rooms:    parsed.full_rooms,
                partial_rooms: parsed.partial_rooms,
            },
            data: parsed.rooms,
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};