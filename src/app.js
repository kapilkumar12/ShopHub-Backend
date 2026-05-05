require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const allowedOrigins = require("./allowedOrigins")


const app = express();
app.use(express.json());


app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(cookieParser());


// require routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require("./routes/cartRoutes")
const orderRoutes = require('./routes/orderRoutes')
const adminOrderRoutes = require('./routes/adminOrderRoutes')
const paymentRoutes = require("./routes/paymentRoutes")
const adminRoutes = require('./routes/adminRoutes')
const heroSliderRoutes = require("./routes/heroSliderRoutes")
const wishlistRoutes = require("./routes/wishlistRoutes")
const reviewRoutes = require("./routes/reviewRoutes")
const userRoutes = require("./routes/userRoutes")
const analyticsRoutes = require("./routes/analyticsRoutes")

// use routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/order/admin', adminOrderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/hero-slider', heroSliderRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/product-analytics', analyticsRoutes);

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({
    success: false,
    message: err.message || "Server Error"
  });
});

module.exports = app;