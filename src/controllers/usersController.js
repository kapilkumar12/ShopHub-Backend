const userModel = require("../models/userModel");

async function getUsersController(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await userModel
      .find()
      .select("-password -__v")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalUsers = await userModel.countDocuments();

    res.status(200).json({
      message: "Users fetch successfully",
      users,
      totalUsers,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
    });
  } catch (error) {
    res.status(500).json({
      message: "Users fetch failed",
    });
  }
}

// update user role

async function userRoleController(req, res) {
  try {
    const userId = req.params.id;

    if (String(req.user._id || req.user.id) === String(userId)) {
      return res.status(400).json({
        message: "You cannot change your own role",
      });
    }

    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const newRole = user.role === "admin" ? "user" : "admin";

    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      { role: newRole },
      { new: true },
    );

    res.status(200).json({
      message: "User role updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Role update failed",
      error: error.message,
    });
  }
}

// delete user

async function userDeleteController(req, res) {
  try {
    const userId = req.params.id;
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

   if (String(req.user._id || req.user.id) === String(userId)) {
      return res.status(400).json({
        message: "You cannot delete your own account",
      });
    }

    await userModel.findByIdAndDelete(userId);

    res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "User delete failed",
      errro: error.message,
    });
  }
}

module.exports = {
  getUsersController,
  userRoleController,
  userDeleteController,
};
