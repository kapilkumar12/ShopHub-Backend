const express = require('express')
const authMiddleware = require('../middlewares/authMiddleware')
const { approveOrderController, rejectOrderController} = require("../controllers/adminOrderController")

const router = express.Router();


router.put('/order/approve', authMiddleware, approveOrderController);
router.put('/order/reject', authMiddleware, rejectOrderController);


module.exports = router