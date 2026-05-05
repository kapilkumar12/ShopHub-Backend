function adminMiddleware(req, res, next) {
  try {
    // 🔐 check user exists
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized - No user"
      });
    }

    // 🔐 check role
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Admin access only"
      });
    }

    next();

  } catch (error) {
    return res.status(500).json({
      message: "Admin middleware error",
      error: error.message
    });
  }
}

module.exports = adminMiddleware;