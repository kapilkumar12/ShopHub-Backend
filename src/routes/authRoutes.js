const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController')

router.post('/sign-up', authController.signUpController);
router.post('/verify-otp', authController.otpVerifyController)
router.post('/login', authController.loginController)
router.get('/logout', authController.logoutController)

module.exports = router;