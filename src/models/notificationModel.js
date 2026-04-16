const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    title: String,
    message: String,
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const notificationModel = mongoose.model("notification", notificationSchema);
module.exports = notificationModel;
