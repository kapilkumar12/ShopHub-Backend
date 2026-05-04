const rateLimit = require("express-rate-limit");

const reviewLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,

  keyGenerator: (req) => {
    return req.user?._id?.toString() || req.ip;
  },

  message: {
    message: "Too many review attempts",
  },
});

module.exports = reviewLimiter;
