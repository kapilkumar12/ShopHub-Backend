const { Worker } = require("bullmq");
const connection = require("../config/redis");
const orderModel = require("../models/orderModel");
const sendEmail = require("../utils/sendEmail");

const worker = new Worker(
  "refundQueue",
  async (job) => {
    const { orderId } = job.data;

    console.log("Processing refund for:", orderId);

    const order = await orderModel.findById(orderId).populate("user");

    if (!order) throw new Error("Order not found");

    // 💰 simulate refund
    await new Promise((resolve) => setTimeout(resolve, 3000));

    order.refundStatus = "completed";
    await order.save();

    // 📧 email
    await sendEmail({
      to: order.user.email,
      subject: "Refund Processed",
      text: `Your refund for order ${order._id} is completed`,
    });

    console.log("Refund completed:", orderId);
  },
  { connection }
);

worker.on("completed", (job) => {
  console.log("Job done:", job.id);
});

worker.on("failed", (job, err) => {
  console.log("Job failed:", err.message);
});

module.exports = worker