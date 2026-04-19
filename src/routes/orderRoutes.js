const express = require("express");
const {
  createOrderController,
  getAllOrdersController,
  orderCancelController,
  updateOrderStatusController,
  getOrderTrackingController,
  invoiceController,
  getSingleOrderController
} = require("../controllers/orderController");
const authMiddleware = require("../middlewares/authMiddleware");


const router = express.Router();

router.post("/create", authMiddleware, createOrderController);
router.get("/my-orders", authMiddleware, getAllOrdersController);
router.get("/single/:id", authMiddleware, getSingleOrderController);
router.post("/cancel", authMiddleware, orderCancelController);
router.put("/update-status", authMiddleware, updateOrderStatusController);
router.get("/tracking/:orderId", authMiddleware, getOrderTrackingController);
router.get('/invoice/:orderId', authMiddleware, invoiceController)

module.exports = router;
