const express = require("express");
const {
  createOrderController,
  getAllOrdersController,
  orderCancelController,
  updateOrderStatusController,
  getOrderTrackingController
} = require("../controllers/orderController");
const authMiddleware = require("../middlewares/authMiddleware");


const router = express.Router();

router.post("/create", authMiddleware, createOrderController);
router.get("/my-orders", authMiddleware, getAllOrdersController);
router.post("/cancel", authMiddleware, orderCancelController);
router.put("/status", authMiddleware, updateOrderStatusController);
router.get("/tracking/:orderId", authMiddleware, getOrderTrackingController);

module.exports = router;
