const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  payPaymentController,
  processRefund,
  verifyPaymentController,
} = require("../controllers/paymentController");

const router = express.Router();

router.post("/pay", authMiddleware, payPaymentController);
router.post("/verify", authMiddleware, verifyPaymentController);
router.post("/refund", authMiddleware, processRefund);

module.exports = router;
