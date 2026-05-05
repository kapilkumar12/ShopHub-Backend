const express = require("express");
const {
  getAdminDashboardController,
  getFilteredOrders,
  getFilteredProducts,
} = require("../controllers/adminController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

const {loginController} = require("../controllers/authController");

const router = express.Router();


router.post('/login', adminMiddleware, loginController)
router.get("/dashboard", authMiddleware, adminMiddleware, getAdminDashboardController);
router.get(
  "/orders/filter",
  authMiddleware,
  adminMiddleware,
  getFilteredOrders,
);

router.get("/products/filter", getFilteredProducts,);


module.exports = router;
