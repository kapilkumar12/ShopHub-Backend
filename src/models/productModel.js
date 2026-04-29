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
    basePrice: {
      type: Number,
      required: [true, "Product basePrice is required"],
      default: 0,
    },
    discountPercent: {
      type: Number,
      default: 0,
    },

    gst: {
      type: Number,
      required: true,
    },

    shippingCost: {
      type: Number,
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
    salesCount: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    wishlistCount: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

productSchema.virtual("finalPrice").get(function () {
  const discountAmount = (this.basePrice * this.discountPercent) / 100;
  const discountedPrice = this.basePrice - discountAmount;
  const gstAmount = (discountedPrice * this.gst) / 100;

  return discountedPrice + gstAmount + this.shippingCost;
});

const productModel = mongoose.model("Product", productSchema);
module.exports = productModel;
