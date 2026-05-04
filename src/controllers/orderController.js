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
const orderShippedTemplate = require("../utils/emailTemplates/orderShippedTemplate");
const orderDeliveredTemplate = require("../utils/emailTemplates/orderDeliveredTemplate");
const generateInvoice = require("../utils/generateInvoice");
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);
const orderTemplate = require("../utils/emailTemplates/orderTemplate");
const userModel = require("../models/userModel");
const orderConfirmedTemplate = require("../utils/emailTemplates/orderConfirmedTemplate");

// create order and empty cart
async function createOrderController(req, res) {
  try {
    const userId = req.user.id;
    const { address, phone, paymentMethod } = req.body;

    const user = await userModel.findById(userId);

    const cart = await cartModel
      .findOne({ user: userId })
      .populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(404).json({ message: "Cart is empty" });
    }

    /////////////////////////////////////////////////////////
    // 🔒 STOCK CHECK
    /////////////////////////////////////////////////////////
    for (let item of cart.items) {
      const product = item.product;
      if (!product) continue;

      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `${product.name} is out of stock`,
        });
      }
    }

    /////////////////////////////////////////////////////////
    // ✅ CALCULATION (USE SCHEMA VALUES)
    /////////////////////////////////////////////////////////
    let subtotal = 0;
    let gstTotal = 0;
    let shippingCost = 0;
    let totalPrice = 0;

    const orderItems = cart.items.map((item) => {
      const p = item.product;
      const quantity = Number(item.quantity) || 0;

      const sellingPrice = Number(p.sellingPrice) || 0;
      const gstAmount = Number(p.gstAmount) || 0;
      const productShipping = Number(p.shippingCost) || 0;
      const finalPrice = Number(p.finalPrice) || 0;

      subtotal += sellingPrice * quantity;
      gstTotal += gstAmount * quantity;
      shippingCost += productShipping * quantity;
      totalPrice += finalPrice * quantity;

      return {
        productId: p._id,
        name: p.name,
        price: finalPrice,
        quantity,
        category: p.category,
      };
    });

    /////////////////////////////////////////////////////////
    // 🔒 UPDATE STOCK
    /////////////////////////////////////////////////////////
    for (let item of orderItems) {
      const updated = await productModel.findOneAndUpdate(
        {
          _id: item.productId,
          stock: { $gte: item.quantity },
        },
        {
          $inc: {
            stock: -item.quantity,
            salesCount: item.quantity,
          },
        },
        { new: true }
      );

      if (!updated) {
        return res.status(400).json({
          message: "Some products are out of stock. Please try again.",
        });
      }
    }

    /////////////////////////////////////////////////////////
    // ✅ CREATE ORDER (FULL DATA SAVE)
    /////////////////////////////////////////////////////////
    const order = await orderModel.create({
      user: userId,
      items: orderItems,

      // 🔥 IMPORTANT (INVOICE FIX)
      subtotal,
      gstAmount: gstTotal,
      shippingCost,
      totalPrice,

      address,
      phone,

      status: "pending",
      paymentStatus: paymentMethod === "cod" ? "pending" : "paid",
      paymentMethod,

      trackingHistory: [
        {
          status: "pending",
          message: "Order placed successfully",
        },
      ],
    });

    /////////////////////////////////////////////////////////
    // 🧹 CLEAR CART
    /////////////////////////////////////////////////////////
    cart.items = [];
    await cart.save();

    /////////////////////////////////////////////////////////
    // 📧 EMAIL
    /////////////////////////////////////////////////////////
    const html = orderTemplate({
      name: user.name,
      orderId: order._id,
      date: order.createdAt,
    });

    await sendEmail({
      to: user.email,
      subject: "Order Created",
      html,
    });

    res.status(200).json({
      message: "Order created successfully",
      order,
    });

  } catch (error) {
    res.status(500).json({
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
      .sort({ createdAt: -1 })
      .populate("items.productId", "name images");
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

// fetch single order by id

async function getSingleOrderController(req, res) {
  try {
    const orderId = req.params.id;
    const userId = req.user.id;
    const order = await orderModel
      .findById(orderId)
      .populate("user", "name email")
      .populate("items.productId", "name images");
    if (req.user.role !== "admin" && order.user._id.toString() !== userId) {
      return res.status(403).json({
        message: "Unauthorized access",
      });
    }
    res.status(200).json({
      message: "Order fetch successfully",
      order,
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

   const orderId = req.params.orderId;
   const { reason } = req.body;

    const order = await orderModel
      .findById(orderId)
      .populate("user", "email name");
    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    for (let item of order.items) {
      await productModel.findByIdAndUpdate(item.productId, {
        $inc: {
          stock: item.quantity,
          salesCount: -item.quantity,
        },
      });
    }

    if (order.status === "cancelled") {
      return res.status(400).json({ message: "Already cancelled" });
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
        message: "Order cannot be cancelled now",
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
    order.refundAmount = order.totalPrice;

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

        const pdfBuffer = await generateInvoice(order);

        await sendEmail({
          to: order.user.email,
          subject: "Refund Processed 💰",
          text: `Hello ${order.user.name}, your refund of ₹${order.refundAmount} has been processed.`,
          html: refundHtml,
          attachments: [
            {
              filename: `invoice-${order._id}.pdf`,
              content: pdfBuffer,
            },
          ],
        });
      }
    } else {
      await order.save();
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

    const order = await orderModel
      .findById(orderId)
      .populate("user", "name email");

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    const currentStatus = order.status;

    if (
      status === "cancelled" &&
      ["shipped", "delivered"].includes(currentStatus)
    ) {
      return res.status(400).json({
        message: "Cannot cancel after shipped or delivered",
      });
    }

    if (currentStatus === "delivered") {
      return res.status(400).json({
        message: "Order already delivered. No further updates allowed",
      });
    }

    const allowedTransitions = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["shipped", "cancelled"],
      shipped: ["delivered"],
      delivered: [],
      cancelled: [],
    };

    if (!allowedTransitions[currentStatus].includes(status)) {
      return res.status(400).json({
        message: `Cannot change status from ${currentStatus} to ${status}`,
      });
    }

    order.status = status;

    if (!order.trackingHistory) {
      order.trackingHistory = [];
    }

    // 📦 tracking update
    order.trackingHistory.push({
      status,
      message: `Order ${status}`,
    });

    await order.save();

    let html;
    if (status === "confirmed") {
      html = orderConfirmedTemplate({
        name: order.user.name,
        orderId: order._id,
        date: order.updatedAt,
        status: status,
      });
    } else if (status === "shipped") {
      html = orderShippedTemplate({
        name: order.user.name,
        orderId: order._id,
        date: order.updatedAt,
        status: status,
      });
    } else if (status === "delivered") {
      html = orderDeliveredTemplate({
        name: order.user.name,
        orderId: order._id,
        date: order.updatedAt,
        status: status,
      });
    } else if (status === "cancelled") {
      html = orderCancelTemplate({
        name: order.user.name,
        orderId: order._id,
        date: order.updatedAt,
        status: status,
      });
    }

    const userEmail = order.user.email;

    try {
      await sendEmail({
        to: userEmail,
        subject: `Order ${status}`,
        html,
      });
    } catch (emailErr) {
      console.error("Email failed:", emailErr.message);
    }

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

// invoice generate

async function invoiceController(req, res) {
  try {
    const order = await orderModel
      .findById(req.params.orderId)
      .populate("user")
      .populate("items.productId");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const pdfBuffer = await generateInvoice(order, order.user);

    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: order.user.email,
      subject: "Your Invoice",
      html: "<p>Your invoice is attached</p>",
      attachments: [
        {
          filename: `invoice-${order._id}.pdf`,
          content: pdfBuffer.toString("base64"),
        },
      ],
    });

    res.setHeader("Content-Type", "application/pdf");

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${order._id}.pdf`,
    );

    res.end(pdfBuffer);
  } catch (error) {
    console.log("INVOICE ERROR:", error);
    res.status(500).json({
      message: "Invoice failed",
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
  invoiceController,
  getSingleOrderController,
};
