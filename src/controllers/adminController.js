const orderModel = require("../models/orderModel");

async function getDashboardStats(req, res) {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Admin only access",
      });
    }
    const totalOrders = await orderModel.countDocuments();
    const revenueResult = await orderModel.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } } },
    ]);
    const totalRevenue = revenueResult[0]?.totalRevenue || 0;
    const pendingOrders = await orderModel.countDocuments({
      status: "pending",
    });
    const cancelledOrders = await orderModel.countDocuments({
      status: "cancelled",
    });

    // 🔥 STEP 1: DB se monthly data lao
    const monthlySales = await orderModel.aggregate([
      {
        $match: { paymentStatus: "paid" },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          total: { $sum: "$totalPrice" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // 🔥 STEP 2: Month format karo
    const months = [
      "",
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const formattedSales = monthlySales.map((item) => ({
      month: months[item._id],
      total: item.total,
    }));

    const recentOrders = await orderModel
      .find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "name email");
    res.status(200).json({
      totalOrders,
      totalRevenue,
      pendingOrders,
      cancelledOrders,
      monthlySales: formattedSales,
      recentOrders,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Dashboard fetch failed",
      error: error.message,
    });
  }
}

// Orders Filter API

async function getFilteredOrders(req, res) {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin only access" });
    }

    const { status, startDate, endDate, page = 1, limit = 5 } = req.query;

    let filter = {};

    // 📦 Status filter
    if (status) {
      filter.status = status;
    }

    // 📅 Date filter
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // 📄 Pagination
    const skip = (page - 1) * limit;

    const orders = await orderModel
      .find(filter)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await orderModel.countDocuments(filter);

    res.status(200).json({
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      orders,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Fetch orders failed",
      error: error.message,
    });
  }
}

// daily sales api

async function getDailySales(req, res) {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin only access" });
    }

    const sales = await orderModel.aggregate([
      {
        $match: { paymentStatus: "paid" },
      },
      {
        $group: {
          _id: {
            $dayOfMonth: "$createdAt",
          },
          total: { $sum: "$totalPrice" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.status(200).json({ sales });
  } catch (error) {
    return res.status(500).json({
      message: "Daily sales fetch failed",
      error: error.message,
    });
  }
}

// monthly sales api

async function getMonthlySales(req, res) {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin only access" });
    }

    const sales = await orderModel.aggregate([
      {
        $match: { paymentStatus: "paid" },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          total: { $sum: "$totalPrice" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const months = [
      "",
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const formatted = sales.map((item) => ({
      month: months[item._id],
      total: item.total,
    }));

    res.status(200).json({ sales: formatted });
  } catch (error) {
    return res.status(500).json({
      message: "Monthly sales fetch failed",
      error: error.message,
    });
  }
}

// weekly sales

async function getWeeklySales(req, res) {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin only access" });
    }

    const sales = await orderModel.aggregate([
      {
        $match: { paymentStatus: "paid" },
      },
      {
        $group: {
          _id: { $week: "$createdAt" },
          total: { $sum: "$totalPrice" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.status(200).json({ sales });
  } catch (error) {
    res.status(500).json({
      message: "Weekly sales fetch failed",
      error: error.message,
    });
  }
}

module.exports = {
  getDashboardStats,
  getFilteredOrders,
  getDailySales,
  getMonthlySales,
  getWeeklySales,
};
