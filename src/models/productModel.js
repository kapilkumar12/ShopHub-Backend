const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product Name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Product Description is required"],
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      default: 0,
    },
    category: {
      type: String,
      required: [true, "Product category is required"],
    },
    stock: {
      type: Number,
      required: [true, "Stock is required"],
      default: 0,
    },
    images: [
      {
        url: String,
        fileId: String,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

const productModel = mongoose.model("Product", productSchema);
module.exports = productModel;
