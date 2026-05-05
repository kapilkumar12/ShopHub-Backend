const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController')
const authMiddleware = require("../middlewares/authMiddleware")
const loginLimiter = require("../middlewares/loginLimiter")

router.post('/sign-up', authController.signUpController);
router.post('/verify-otp', authController.otpVerifyController)
router.post('/resend-otp', authController.resendOtpController)
router.post('/login', loginLimiter, authController.loginController)
router.get('/me', authMiddleware, authController.getUserController)
router.get('/logout', authController.logoutController)
router.get("/refresh", authController.refreshTokenController);

module.exports = router;