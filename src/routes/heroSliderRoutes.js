const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const {
  addHeroSliderController,
  getSlidersController,
  heroSliderUpdateController,
  heroSliderDeleteController,
  getSingleSliderController
} = require("../controllers/heroSliderController");
const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
});

router.post(
  "/create",
  authMiddleware,
  upload.single("image"),
  addHeroSliderController,
);
router.get("/", getSlidersController);
router.get("/single/:id", authMiddleware, getSingleSliderController);
router.put(
  "/update/:sliderId",
  authMiddleware,
  upload.single("image"),
  heroSliderUpdateController,
);
router.delete("/delete/:sliderId", authMiddleware, heroSliderDeleteController);

module.exports = router;
