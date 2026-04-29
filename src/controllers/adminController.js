const orderModel = require("../models/orderModel");
const productModel = require("../models/productModel");

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

    let {
      status,
      startDate,
      endDate,
      search,
      category,
      page = 1,
      limit = 20,
    } = req.query;

    page = Math.max(1, Number(page));
    limit = Math.min(50, Number(limit)); // max 50 limit

    const skip = (page - 1) * limit;

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


        const matchStage = {
      ...filter,
      ...(search
        ? {
            $or: [
              { "user.name": { $regex: search, $options: "i" } },
              { "user.email": { $regex: search, $options: "i" } },
            ],
          }
        : {}),
      ...(category
        ? {
            "products.category": category,
          }
        : {}),
    };

    const pipeline = [
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },

      // 🔥 join products
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "products",
        },
      },

      { $match: matchStage },

      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ];

    const orders = await orderModel.aggregate(pipeline);

    const totalData = await orderModel.aggregate([
      ...pipeline.slice(0, -3), // remove skip/limit
      { $count: "total" },
    ]);

    const total = totalData[0]?.total || 0;

    res.status(200).json({
      total,
      page,
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

// Products Filter API

async function getFilteredProducts(req, res) {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin only access" });
    }

    let {
      search,
      category,
      sort,
      minPrice,
      maxPrice,
      page = 1,
      limit = 5,
    } = req.query;

    page = Math.max(1, Number(page));
    limit = Math.min(50, Number(limit));

    const skip = (page - 1) * limit;

    let filter = {};

    // 🔍 SEARCH
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    // 📦 CATEGORY
    if (category) {
      filter.category = category;
    }

    // 💰 PRICE
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // 🔄 SORT
    let sortOption = { createdAt: -1 };

    if (sort === "price_asc") sortOption = { price: 1 };
    if (sort === "price_desc") sortOption = { price: -1 };
    if (sort === "latest") sortOption = { createdAt: -1 };

    const products = await productModel
      .find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const total = await productModel.countDocuments(filter);
    const categories = await productModel.distinct("category");

    res.status(200).json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      products,
      categories
    });
  } catch (error) {
    res.status(500).json({
      message: "Fetch products failed",
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
  getFilteredProducts,
  getDailySales,
  getMonthlySales,
  getWeeklySales,
};
