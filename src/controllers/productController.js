const productModel = require("../models/productModel");
const imagekit = require("../utils/imagekit");

// add product controller

async function addProductController(req, res) {
  try {
    const { name, description, price, category, stock } = req.body;
    if (!name || !description || !price || !category || !stock) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    let imageUrls = [];

    //  upload image to imagekit

    if (req.files && req.files.length > 0) {
      for (let file of req.files) {
        const uploaded = await imagekit.upload({
          file: file.buffer,
          fileName: file.originalname,
        });

        imageUrls.push(uploaded.url);
      }
    }

    const product = await productModel.create({
      name,
      description,
      price,
      category,
      stock,
      images: imageUrls,
      createdBy: req.user.id,
    });

    res.status(201).json({
      message: "Product added successfully",
      product,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

// list all products

async function getAllProductsController(req, res) {
  try {
    const products = await productModel
      .find({})
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email");
    res.status(200).json({
      message: "Products fetched successfully",
      count: products.length,
      products,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

// get single product

async function getSingleProductController(req, res) {
  try {
    const id = req.params.id;
    const product = await productModel.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      message: "Product fetched successfully",
      product,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

// update product
async function updateProductController(req, res) {
  try {
    const id = req.params.id;

    // 🔍 find product
    const existingProduct = await productModel.findById(id);

    if (!existingProduct) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // 🔐 authorization
    if (!existingProduct.createdBy.equals(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({
        message: "Unauthorized to update this product",
      });
    }

    // 🔒 allowed fields only
    const allowedFields = ["name", "description", "price", "category", "stock"];

    let updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // 🖼️ image upload
    if (req.files && req.files.length > 0) {
      let imageUrls = [];

      for (let file of req.files) {
        const uploaded = await imagekit.upload({
          file: file.buffer,
          fileName: file.originalname,
        });

        imageUrls.push(uploaded.url);
      }

      updates.images = imageUrls;
    }

    // ⚡ update
    const updatedProduct = await productModel.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Update Product Error:", error);

    return res.status(500).json({
      message: "Product update failed",
      error: error.message,
    });
  }
}

// delete product

async function deleteProductController(req, res) {
  try {
    const id = req.params.id;

    const product = await productModel.findById(id);
    if (!product) {
      return res.status(400).json({
        message: "Product not found",
      });
    }

    if (!product.createdBy.equals(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({
        message: "Unauthorized to delete this product",
      });
    }

    await product.deleteOne();
    res.status(200).json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Product deletion failed",
      error: error.message,
    });
  }
}

module.exports = {
  addProductController,
  getAllProductsController,
  getSingleProductController,
  updateProductController,
  deleteProductController,
};
