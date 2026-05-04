const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    // ---------------- BASIC INFO ----------------
    name: {
      type: String,
      required: [true, "Product Name is required"],
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Product Description is required"],
    },

    category: {
      type: String,
      required: [true, "Product category is required"],
    },

    stock: {
      type: Number,
      required: true,
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

    // ---------------- PRICING (AMAZON STYLE) ----------------

    basePrice: {
      type: Number,
      required: true, // MRP
      default: 0,
    },

    discountPercent: {
      type: Number,
      default: 0,
    },

    discountAmount: {
      type: Number,
      default: 0,
    },

    sellingPrice: {
      type: Number,
      default: 0, // basePrice - discount
    },

    gstPercent: {
      type: Number,
      default: 0,
    },

    gstAmount: {
      type: Number,
      default: 0,
    },

    shippingCost: {
      type: Number,
      default: 0,
    },

    finalPrice: {
      type: Number,
      default: 0, // what user pays
    },

    // ---------------- ANALYTICS ----------------

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
  }
);

productSchema.pre("save", function () {
  try {
    // safety check
    if (!this.basePrice || this.basePrice <= 0) {
      this.sellingPrice = 0;
      this.finalPrice = 0;
      this.discountAmount = 0;
      this.gstAmount = 0;
      return;
    }

    // 1. Discount
    const discountAmount =
      (this.basePrice * (this.discountPercent || 0)) / 100;

    const sellingPrice = this.basePrice - discountAmount;

    // 2. GST
    const gstAmount =
      (sellingPrice * (this.gstPercent || 0)) / 100;

    // 3. Shipping
    const shippingCost = this.shippingCost || 0;

    // 4. Final Price (what user pays)
    const finalPrice = sellingPrice + gstAmount + shippingCost;

    // assign values
    this.discountAmount = Math.round(discountAmount);
    this.sellingPrice = Math.round(sellingPrice);
    this.gstAmount = Math.round(gstAmount);
    this.finalPrice = Math.round(finalPrice);

  } catch (error) {
    console.error("Product pricing error:", error.message);
    throw error;
  }
});

const productModel = mongoose.model("Product", productSchema);
module.exports = productModel;
