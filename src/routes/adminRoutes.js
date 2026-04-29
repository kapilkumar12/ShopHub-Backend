const express = require("express");
const {
  getDashboardStats,
  getFilteredOrders,
  getFilteredProducts,
  getDailySales,
  getWeeklySales,
  getMonthlySales,
} = require("../controllers/adminController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

const {loginController} = require("../controllers/authController");

const router = express.Router();


router.post('/login', adminMiddleware, loginController)
router.get("/dashboard", authMiddleware, adminMiddleware, getDashboardStats);
router.get(
  "/orders/filter",
  authMiddleware,
  adminMiddleware,
  getFilteredOrders,
);
router.get(
  "/products/filter",
  authMiddleware,
  adminMiddleware,
  getFilteredProducts,
);
router.get("/sales/daily", authMiddleware, adminMiddleware, getDailySales);
router.get("/sales/weekly", authMiddleware, adminMiddleware, getWeeklySales);
router.get("/sales/monthly", authMiddleware, adminMiddleware, getMonthlySales);

module.exports = router;
