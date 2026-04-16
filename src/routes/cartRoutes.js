const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  addToCartController,
  getAllCartController,
  updateCartController,
  productRemoveFromCartController,
  deleteCartController
} = require("../controllers/cartController");

const router = express.Router();

router.post("/add", authMiddleware, addToCartController);
router.get("/", authMiddleware, getAllCartController);
router.put("/update", authMiddleware, updateCartController);
router.delete("/remove/:productId", authMiddleware, productRemoveFromCartController);
router.delete("/delete/:id", authMiddleware, deleteCartController);

module.exports = router;
