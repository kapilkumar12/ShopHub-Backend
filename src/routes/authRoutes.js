const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController')
const authMiddleware = require("../middlewares/authMiddleware")

router.post('/sign-up', authController.signUpController);
router.post('/verify-otp', authController.otpVerifyController)
router.post('/resend-otp', authController.resendOtpController)
router.post('/login', authController.loginController)
router.get('/me', authMiddleware, authController.getUserController)
router.get('/logout', authController.logoutController)

module.exports = router;