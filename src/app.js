require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
app.use(express.json());
app.use(cors());
app.use(cookieParser());


// require routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require("./routes/cartRoutes")
const orderRoutes = require('./routes/orderRoutes')
const adminOrderRoutes = require('./routes/adminOrderRoutes')
const paymentRoutes = require("./routes/paymentRoutes")
const adminRoutes = require('./routes/adminRoutes')

// use routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/order/admin', adminOrderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);


module.exports = app;