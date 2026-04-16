const orderModel = require("../models/orderModel");
const sendEmail = require("../utils/sendEmail");
const orderConfirmedTemplate = require("../utils/emailTemplates/orderConfirmedTemplate");
const orderCancelTemplate = require("../utils/emailTemplates/orderCancelTemplate");
const { processRefund } = require("./paymentController");
const refundEmailTemplate = require("../utils/emailTemplates/refundEmailTemplate");

async function approveOrderController(req, res) {
  try {
    const { orderId } = req.body;
    const order = await orderModel
      .findById(orderId)
      .populate("user", "name email");
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin only access" });
    }
    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }
    if (order.status !== "pending") {
      return res.status(400).json({
        message: "Order already processed",
      });
    }

    order.status = "confirmed";
    order.trackingHistory.push({
       status: "confirmed",
      message: `Order confirmed by admin`,
    });
    await order.save();

    const html = orderConfirmedTemplate({
      name: order.user.name,
      orderId: order._id,
      date: order.updatedAt,
    });

    const userEmail = order.user.email;

    await sendEmail({
      to: userEmail,
      subject: "Order Confirmed",
      text: `Hello ${order.user.name}, your order ${order._id} has been confirmed.`,
      html,
    });

    res.status(200).json({
      message: "Order approved successfully",
      order,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Approval failed",
      error: error.message,
    });
  }
}

// order cancel controller

async function rejectOrderController(req, res) {
  try {
    const { orderId, reason } = req.body;
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin only access" });
    }
    const order = await orderModel
      .findById(orderId)
      .populate("user", "name email");
    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }
    if (order.status !== "pending") {
      return res.status(400).json({
        message: "Order already processed",
      });
    }

    order.status = "cancelled";
    order.cancelReason = reason;

    let refundResult = null;
    if (order.paymentStatus === "paid") {
      order.refundStatus = "pending";
      await order.save();
      refundResult = await processRefund(order);
      if (order.refundStatus === "processed") {
        const refundHtml = refundEmailTemplate({
          userName: order.user.name,
          orderId: order._id,
          refundAmount: order.refundAmount,
          paymentMethod: order.paymentMethod,
        });

        await sendEmail({
          to: order.user.email,
          subject: "Refund Processed 💰",
          text: `Hello ${order.user.name}, your refund of ₹${order.refundAmount} has been processed.`,
          html: refundHtml,
        });
      }
    } else {
      await order.save();
    }

    const html = orderCancelTemplate({
      name: order.user.name,
      orderId: order._id,
      reason,
      date: order.updatedAt,
    });

    const userEmail = order.user.email;

    await sendEmail({
      to: userEmail,
      subject: "Order Rejected",
      text: `Hello ${order.user.name}, your order ${order._id} has been rejected.`,
      html,
    });

    res.status(200).json({
      message: "Order rejected successfully",
      order,
      refund: refundResult ? "Refund processed" : "No refund required",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Rejection failed",
      error: error.message,
    });
  }
}

module.exports = { approveOrderController, rejectOrderController };
