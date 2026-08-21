const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    console.log("Authorization header:", authHeader);

    if (!authHeader) {
      return res.status(401).json({
        msg: "No token provided from here",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        msg: "Invalid token format",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    console.log("Decoded JWT:", decoded);

    req.user = decoded;

    next();
  } catch (err) {
    console.error("Auth error:", err);

    return res.status(401).json({
      msg: "Unauthorized",
      error: err.message,
    });
  }
};

module.exports = authMiddleware;