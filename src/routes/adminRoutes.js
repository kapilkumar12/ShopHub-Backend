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

const router = express.Router();

router.get("/dashboard", authMiddleware, getDashboardStats);
router.get("/orders/filter", authMiddleware, getFilteredOrders);
router.get("/products/filter", authMiddleware, getFilteredProducts);
router.get("/sales/daily", authMiddleware, getDailySales);
router.get("/sales/weekly", authMiddleware, getWeeklySales);
router.get("/sales/monthly", authMiddleware, getMonthlySales);

module.exports = router;
