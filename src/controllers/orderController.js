const orderModel = require("../models/orderModel");
const cartModel = require("../models/cartModel");
const orderCancelModel = require("../models/orderCancelModel");
const sendEmail = require("../utils/sendEmail");
const productModel = require("../models/productModel");
const orderCancelTemplate = require("../utils/emailTemplates/orderCancelTemplate");
const { processRefund } = require("./paymentController");
const refundEmailTemplate = require("../utils/emailTemplates/refundEmailTemplate");
const refundQueue = require("../queues/refundQueue");
const notificationModel = require("../models/notificationModel");

// create order and empty cart
async function createOrderController(req, res) {
  try {
    const userId = req.user.id;
    const { address, phone, paymentMethod } = req.body;
    const cart = await cartModel
      .findOne({ user: userId })
      .populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(404).json({
        message: "Cart is empty",
      });
    }

    let totalPrice = 0;
    const orderItems = cart.items
      .map((item) => {
        if (!item.product) return null;
        totalPrice += item.product.price * item.quantity;
        return {
          productId: item.product._id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
        };
      })
      .filter(Boolean);

    const order = await orderModel.create({
      user: userId,
      items: orderItems,
      totalPrice,
      address,
      phone,
      status: "pending",
      paymentStatus: paymentMethod === "cod" ? "pending" : "pending",
      paymentMethod,
      trackingHistory: [
        {
          status: "pending",
          message: "Order placed successfully",
        },
      ],
    });

    cart.items = [];
    await cart.save();

    res.status(200).json({
      message: "Order create successfully",
      order,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Order failed",
      error: error.message,
    });
  }
}

// fetch all orders

async function getAllOrdersController(req, res) {
  try {
    const userId = req.user.id;
    const orders = await orderModel
      .find({ user: userId })
      .sort({ createdAt: -1 });
    res.status(200).json({
      message: "Order fetch successfully",
      orders,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
}

// cancel order

async function orderCancelController(req, res) {
  try {
    const userId = req.user.id;
    const { reason, orderId } = req.body;

    const order = await orderModel
      .findById(orderId)
      .populate("user", "email name");
    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (order.user._id.toString() !== userId.toString()) {
      console.log("order user id:", order.user._id.toString());
      console.log("userId:", userId);
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    if (["shipped", "delivered", "cancelled"].includes(order.status)) {
      return res.status(400).json({
        message: "Cannot cancel this order",
      });
    }

    await orderCancelModel.create({
      user: userId,
      order: orderId,
      reason,
      status: "Requested",
    });

    order.status = "cancelled";
    order.cancelReason = reason;
    order.cancelledAt = new Date();

    let refundResult = null;
    if (order.paymentStatus === "paid") {
      order.refundStatus = "pending";
      await refundQueue.add("refundJob", {
        orderId: order._id,
      });
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

    for (let item of order.items) {
      await productModel.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity },
      });
    }

    const html = orderCancelTemplate({
      name: order.user.name,
      orderId: order._id,
      reason: reason,
    });

    const userEmail = order.user.email;

    await sendEmail({
      to: userEmail,
      subject: "Order Cancelled",
      text: `Hello ${order.user.name}, your order ${order._id} has been cancelled. Reason: ${reason}`,
      html,
    });

    res.status(200).json({
      message: "Order cancel successfully",
      refund: refundResult ? "Refund processed" : "No refund required",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Order cancel failed",
      error: error.message,
    });
  }
}

// update order status

async function updateOrderStatusController(req, res) {
  try {
    const { orderId, status } = req.body;

    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Admin only access",
      });
    }

    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    order.status = status;

    // 📦 tracking update
    order.trackingHistory.push({
      status,
      message: `Order ${status}`,
    });

    await order.save();

    // 🔥 create notification
    const notification = await notificationModel.create({
      user: order.user,
      title: "Order Update",
      message: `Your order is now ${status}`,
    });

    // 🔥 real-time emit
    global.io.to(order.user.toString()).emit("newNotification", {
      title: notification.title,
      message: notification.message,
    });

    global.io.to(orderId).emit("orderStatusUpdated", {
      orderId,
      status,
    });

    res.status(200).json({
      message: "Order status updated",
      order,
    });
  } catch (error) {
    res.status(500).json({
      message: "Order status update failed",
      error: error.message,
    });
  }
}

// get tracking api

async function getOrderTrackingController(req, res) {
  try {
    const { orderId } = req.params;

    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    res.status(200).json({
      orderId: order._id,
      status: order.status,
      tracking: order.trackingHistory,
    });
  } catch (error) {
    res.status(500).json({
      message: "Tracking fetch failed",
      error: error.message,
    });
  }
}

module.exports = {
  createOrderController,
  getAllOrdersController,
  orderCancelController,
  updateOrderStatusController,
  getOrderTrackingController,
};
