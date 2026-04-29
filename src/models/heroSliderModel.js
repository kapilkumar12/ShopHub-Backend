const mongoose = require('mongoose');

const heroSliderSchema = new mongoose.Schema({
    title: String,
    description: String,
    image: [
      {
        url: String,
        fileId: String,
      },
    ],
})

const heroSliderModel = mongoose.model('HeroSlider', heroSliderSchema);
module.exports = heroSliderModel;