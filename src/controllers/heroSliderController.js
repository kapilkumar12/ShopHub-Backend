const heroSliderModel = require("../models/heroSliderModel");
const imagekit = require("../utils/imagekit");

async function addHeroSliderController(req, res) {
  try {
    const { title, description } = req.body;

    let imageUrl;

    if (!req.file) {
      return res.status(400).json({
        message: "Image is required",
      });
    }

    const uploaded = await imagekit.upload({
      file: req.file.buffer,
      fileName: req.file.originalname,
    });

    const image = {
      url: uploaded.url,
      fileId: uploaded.fileId,
    };

    const slider = await heroSliderModel.create({
      title,
      description,
      image,
    });

    res.status(201).json({
      message: "Hero Slider successfully created",
      slider,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Hero Slider created failed",
      error: error.message,
    });
  }
}

// list sliders

async function getSlidersController(req, res) {
  try {
    const sliders = await heroSliderModel.find().sort({ createdAt: -1 });
    res.status(200).json({
      message: "Sliders fetched successfully",
      count: sliders.length,
      sliders,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Sliders fetched failed",
      error: error.message,
    });
  }
}

// slider update

async function heroSliderUpdateController(req, res) {
  try {
    const { sliderId } = req.params;

    const slider = await heroSliderModel.findById(sliderId);

    if (!slider) {
      return res.status(404).json({
        message: "Slider not found",
      });
    }

    const { title, description, deleteImage } = req.body;

    if (title) slider.title = title;
    if (description) slider.description = description;

    ////////////////////////////////////////////////////////
    // 🔥 ONLY DELETE IMAGE
    ////////////////////////////////////////////////////////

    if (deleteImage === "true") {
      if (slider.image?.fileId) {
        try {
          await imagekit.deleteFile(slider.image.fileId);
        } catch (err) {
          console.log("Delete error:", err.message);
        }
      }

      slider.image = null; // remove from DB
    }

    ////////////////////////////////////////////////////////
    // 🔥 UPLOAD NEW IMAGE (REPLACE)
    ////////////////////////////////////////////////////////

    if (req.file) {
      // delete old if exists
      if (slider.image?.fileId) {
        try {
          await imagekit.deleteFile(slider.image.fileId);
        } catch (err) {
          console.log("Delete error:", err.message);
        }
      }

      const uploaded = await imagekit.upload({
        file: req.file.buffer,
        fileName: Date.now() + "-" + req.file.originalname,
      });

      slider.image = {
        url: uploaded.url,
        fileId: uploaded.fileId,
      };
    }

    ////////////////////////////////////////////////////////

    await slider.save();

    res.status(200).json({
      message: "Slider updated successfully",
      slider,
    });

  } catch (error) {
    res.status(500).json({
      message: "Slider update failed",
      error: error.message,
    });
  }
}

// delete

async function heroSliderDeleteController(req, res) {
  try {
    const { sliderId } = req.params;
    const slider = await heroSliderModel.findById(sliderId);
    if (!slider) {
      return res.status(404).json({
        message: "Slider not found",
      });
    }

    if (slider.image?.fileId) {
      try {
        await imageKit.deleteFile(slider.image.fileId);
      } catch (error) {
        console.log("Image delete error:", error.message);
      }
    }
    await slider.deleteOne();
    res.status(200).json({
      message: "slider deleted succesfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Slider deleted failed",
      error: error.message,
    });
  }
}

// get single slider

async function getSingleSliderController(req, res) {
  try {
    const sliderId = req.params.id;
    const slider = await heroSliderModel.findById(sliderId);

    if (!slider) {
      return res.status(404).json({
        message: "Slider not found",
      });
    }

    res.status(200).json({
      message: "Slider fetched successfully",
      slider,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Slider fetch failed",
      error: error.message,
    });
  }
}

module.exports = {
  addHeroSliderController,
  getSlidersController,
  heroSliderUpdateController,
  heroSliderDeleteController,
  getSingleSliderController,
};
