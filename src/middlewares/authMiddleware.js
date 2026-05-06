const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

async function authMiddleware(req, res, next) {
  try {
    // ✅ get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Unauthorized - No token",
      });
    }

    const token = authHeader.split(" ")[1];

    // ✅ verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);


    // ✅ attach user
    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();

  } catch (error) {
    return res.status(401).json({
      message: "Unauthorized - Invalid or expired token",
    });
  }
}

module.exports = authMiddleware;