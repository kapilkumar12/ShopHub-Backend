const cartModel = require("../models/cartModel");
const productModel = require("../models/productModel");

// add cart contoller

async function addToCartController(req, res) {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;
    const isProductExisting = await productModel.findById(productId);
    if (!isProductExisting) {
      return res.status(401).json({
        message: "Product not found",
      });
    }
    let cart = await cartModel.findOne({ user: userId });
    if (!cart) {
      cart = await cartModel.create({
        user: userId,
        items: [
          {
            product: productId,
            quantity: quantity || 1,
          },
        ],
      });
    } else {
      const existingItem = cart.items.find(
        (item) => item.product.toString() === productId,
      );
      if (existingItem) {
        existingItem.quantity += quantity || 1;
      } else {
        cart.items.push({
          product: productId,
          quantity: quantity || 1,
        });
      }
      await cart.save();
    }

    res.status(200).json({
      message: "Product added to cart",
      cart,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to add to cart",
      error: error.message,
    });
  }
}

// get cart contoller

async function getAllCartController(req, res) {
  try {
    const userId = req.user.id;
    const cart = await cartModel
      .findOne({ user: userId })
      .populate("items.product", "name price images");
    if (!cart || cart.items.length === 0) {
      return res.status(200).json({
        message: "Cart is empty",
        items: [],
        totalPrice: 0,
      });
    }

    // total price calculate

    let totalPrice = 0;

    const formattedItems = cart.items
      .map((item) => {
        const product = item.product;
        if (!product) return null;
        totalPrice += product.price * item.quantity;
        return {
          productId: product._id,
          name: product.name,
          price: product.price,
          image: product.images?.[0] || null,
          quantity: item.quantity,
        };
      })
      .filter(Boolean);

    res.status(200).json({
      message: "Cart fetched successfully",
      items: formattedItems,
      totalPrice,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch cart",
      error: error.message,
    });
  }
}

// update cart products

async function updateCartController(req, res) {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;
    if (!productId || quantity === undefined) {
      return res.status(400).json({
        message: "ProductId and quantity are required",
      });
    }
    if (quantity < 0) {
      return res.status(400).json({
        message: "Quantity cannot be negative",
      });
    }
    const cart = await cartModel.findOne({ user: userId });
    if (!cart) {
      return res.status(401).json({
        message: "Cart not found",
      });
    }
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId,
    );
    if (itemIndex === -1) {
      return res.status(404).json({
        message: "Product not found in cart",
      });
    }
    // 🔥 CASE: quantity = 0 → remove product
    if (quantity === 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      // 🔁 update quantity
      cart.items[itemIndex].quantity = quantity;
    }
    await cart.save();
    res.status(200).json({
      message: "Cart updated successfully",
      cart,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update cart",
      error: error.message,
    });
  }
}

// product remove from cart controller

async function productRemoveFromCartController(req, res) {
  try {
    const userId = req.user.id;
    const productId = req.params.productId;

    const cart = await cartModel.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        message: "Cart not found",
      });
    }
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId,
    );
    if (itemIndex === -1) {
      return res.status(404).json({
        message: "Product not found in cart",
      });
    }
    cart.items.splice(itemIndex, 1);
    await cart.save();
    res.status(200).json({
      message: "Product removed from cart",
      cart,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to remove product",
      error: error.message,
    });
  }
}

// delete cart controller

async function deleteCartController(req, res) {
  try {
    const userId = req.user.id;
    const deletedCart = await cartModel.findOneAndDelete({ user: userId });
    if (!deletedCart) {
      return res.status(404).json({
        message: "Cart Not Found",
      });
    }

    res.status(200).json({
      message: "Cart successfully deleted",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Cart delete failed",
      error: error.message,
    });
  }
}

module.exports = {
  addToCartController,
  getAllCartController,
  updateCartController,
  productRemoveFromCartController,
  deleteCartController
};
