const express = require("express")
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware")
const adminMiddleware = require("../middlewares/adminMiddleware")
const {getAllAnalyticsController} = require("../controllers/analyticsController");



router.get("/", authMiddleware, adminMiddleware, getAllAnalyticsController)



module.exports = router