const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

async function authMiddleware(req, res, next) {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized - No token" });
    }

    const decoded = jwt
      .verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.id).select("_id role");
    if (!user) {
      return res.status(401).json({ message: "Unauthorized - User not found" });
    }
    req.user = {
      id: user._id,
      role: user.role,
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

module.exports = authMiddleware;
