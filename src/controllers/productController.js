const productModel = require("../models/productModel");
const imagekit = require("../utils/imagekit");

function extractFileId(url) {
  try {
    const parts = url.split("/");
    const fileName = parts.pop().split("?")[0]; // query remove
    return fileName;
  } catch (error) {
    console.log("extractFileId error:", error.message);
    return null;
  }
}

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

        imageUrls.push({
          url: uploaded.url,
          fileId: uploaded.fileId,
        });
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
    const product = await productModel.findById(id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // 🔐 authorization
    if (!product.createdBy.equals(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({
        message: "Unauthorized to update this product",
      });
    }

    // 🔒 allowed fields only
    const fields = ["name", "description", "price", "category", "stock"];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    let deletedImages = [];

    try {
      deletedImages = JSON.parse(req.body.deletedImages || "[]");
    } catch (error) {
      deletedImages = [];
    }

    if (deletedImages.length > 0) {
      for (const img of deletedImages) {
         if (!img.fileId) continue;
        try {
          await imagekit.deleteFile(img.fileId);
        } catch (error) {
          console.log("Delete error:", error.message);
        }
      }
      product.images = product.images.filter(
        (img) => !deletedImages.some((d) =>  d.fileId === img.fileId),
      );
    }

    // 🖼️ image upload
    if (req.files && req.files.length > 0) {
      for (let file of req.files) {
        const uploaded = await imagekit.upload({
          file: file.buffer,
          fileName: file.originalname,
        });
        product.images.push({
          url: uploaded.url,
          fileId: uploaded.fileId,
        });
      }
    }

    // ⚡ update
    await product.save();

    return res.status(200).json({
      message: "Product updated successfully",
      product: product,
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
