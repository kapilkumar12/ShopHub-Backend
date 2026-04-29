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
    const {
      name,
      description,
      basePrice,
      category,
      stock,
      gst,
      discountPercent,
      shippingCost,
    } = req.body;

    if (
      !name ||
      !description ||
      basePrice === undefined ||
      !category ||
      stock === undefined ||
      gst === undefined
    ) {
      return res.status(400).json({
        message: "Required fields missing",
      });
    }

    const parsedBasePrice = Number(basePrice);
    const parsedStock = Number(stock);
    const parsedGst = Number(gst);
    const parsedDiscountPercent = Number(discountPercent) || 0;
    const parsedShippingCost = Number(shippingCost) || 0;

    if (parsedBasePrice < 0 || parsedStock < 0) {
      return res.status(400).json({
        message: "Invalid price or stock",
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
      basePrice: parsedBasePrice,
      category,
      stock: parsedStock,
      images: imageUrls,
      createdBy: req.user.id,
      gst: parsedGst,
      discountPercent: parsedDiscountPercent,
      shippingCost: parsedShippingCost,
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

    const product = await productModel.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    );

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
    const fields = [
      "name",
      "description",
      "basePrice",
      "category",
      "stock",
      "gst",
      "discountPercent",
      "shippingCost",
    ];

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
        (img) => !deletedImages.some((d) => d.fileId === img.fileId),
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
      product,
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

// related products

async function getRelatedProductsController(req, res) {
  try {
    const { productId } = req.params;
    const product = await productModel.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const minPrice = product.basePrice - 20000;
    const maxPrice = product.basePrice + 20000;

    const relatedProducts = await productModel
      .find({
        category: product.category,
        _id: { $ne: product._id },
        stock: { $gt: 0 },
        basePrice: { $gte: minPrice, $lte: maxPrice },
      })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      message: "Related products fetched",
      count: relatedProducts.length,
      products: relatedProducts,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch related products",
      error: error.message,
    });
  }
}


// most viewed controller

async function getMostViewedProductsController(req, res) {
  try {

    const products = await productModel.find({stock: {$gt : 0}}).sort({views: -1, createdAt: -1}).limit(10);

    res.status(200).json({
      message:"Most viewed products fetched",
      products
    })
    
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch most viewed products",
    });
  }
}


// trending products

async function getTrendingProductsController(req, res) {
  try {
    const products = await productModel.aggregate([
       {
        $match: {stock: {$gt: 0}}
       },
       {
        $addFields: {
          daysOld: {
            $divide: [
              { $subtract: [new Date(), "$createdAt"] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      },

      // ✅ recency boost (new product = higher score)

       {
        $addFields:{
          recencyScore:{
            $cond:[
                  {$lte: ["$daysOld", 7]}, 100,
                  { $cond:[
                    {$lte:["$daysOld", 30]}, 50
                  ]}
            ]
          }
        }
       },

             // ✅ FINAL TREND SCORE
      {
        $addFields: {
          trendScore: {
            $add: [
              { $multiply: ["$salesCount", 0.5] },
              { $multiply: ["$wishlistCount", 0.3] },
              { $multiply: ["$views", 0.15] },
              { $multiply: ["$recencyScore", 0.05] }
            ]
          }
        }
      },

       {
        $sort:{trendScore: -1}
       },

       {
        $limit:10
       },
       
       {
        $project: {
          name: 1,
          images: 1,
          basePrice: 1,
          salesCount: 1,
          views: 1,
          wishlistCount: 1,
          trendScore: 1
        }
      }
    ])

    res.status(200).json({
      message: "Trending products fetched",
      products,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch trending products",
    });
  }
}


module.exports = {
  addProductController,
  getAllProductsController,
  getSingleProductController,
  updateProductController,
  deleteProductController,
  getRelatedProductsController,
  getTrendingProductsController,
  getMostViewedProductsController
};
