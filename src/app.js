require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173",
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

module.exports = app;