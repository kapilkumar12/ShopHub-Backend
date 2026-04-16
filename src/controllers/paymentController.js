const orderModel = require("../models/orderModel")
const Razorpay = require("razorpay");
const crypto = require("crypto")

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// payment controller

async function payPaymentController(req, res) {
  try {
    const { orderId } = req.body;

    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // COD case
    if (order.paymentMethod === "cod") {
      return res.status(200).json({
        message: "COD payment will be done at delivery",
      });
    }

    // 💳 Create Razorpay Order
    const options = {
      amount: order.totalPrice * 100, // paise
      currency: "INR",
      receipt: order._id.toString(),
    };

    const razorpayOrder = await razorpay.orders.create(options);

    res.status(200).json({
      message: "Razorpay order created",
      razorpayOrder,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Payment failed",
      error: error.message,
    });
  }
}

// verify payment

async function verifyPaymentController(req, res) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        message: "Payment verification failed",
      });
    }

    // ✅ update DB
    const order = await orderModel.findById(orderId);

    order.paymentStatus = "paid";
    order.paidAt = new Date();

    await order.save();

    res.status(200).json({
      message: "Payment verified successfully",
    });

  } catch (error) {
    res.status(500).json({
      message: "Verification failed",
      error: error.message,
    });
  }
}


// process Refund

async function processRefund(order) {
    
try {
    if (order.paymentMethod === "cod") {
      return { success: false, message: "No refund for COD" };
    }
    if(order.refundStatus  === "processed"){
      return { success: false, message: "Already refunded" };
    }
    const refundSuccess = true;
     if (refundSuccess) {
      order.refundStatus = "processed";
      order.refundAmount = order.totalPrice;
    } else {
      order.refundStatus = "failed";
    }
await order.save();

    return { success: true };
} catch (error) {
     return { success: false, message: error.message };
}

}


module.exports = {
  payPaymentController,
  verifyPaymentController,
  processRefund
};