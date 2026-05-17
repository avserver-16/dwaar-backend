const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    /*
      GET TOKEN
    */
    const authHeader =
      req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        msg: "No token provided",
      });
    }

    /*
      FORMAT:
      Bearer TOKEN
    */
    const token =
      authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        msg: "Invalid token format",
      });
    }

    /*
      VERIFY TOKEN
    */
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    /*
      ATTACH USER
    */
    req.user = decoded;

    next();
  } catch (err) {
    return res.status(401).json({
      msg: "Unauthorized",
      error: err.message,
    });
  }
};

module.exports = authMiddleware;