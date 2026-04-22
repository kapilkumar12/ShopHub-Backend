const userModel = require("../models/userModel");
const OTP = require("../models/otpModel");
const generateOTP = require("../utils/generateOtp");
const sendEmail = require("../utils/sendEmail");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const otpTemplate = require("../utils/emailTemplates/otpTemplate");
const { tryCatch } = require("bullmq");

// sign-up controller

async function signUpController(req, res) {
  try {
    const { name, email, password, role } = req.body;
    const existingUser = await userModel.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const otpValue = generateOTP();

    const hashedOtp = await bcrypt.hash(otpValue, 10);
    await OTP.deleteMany({ email });
    await OTP.create({
      email,
      otp: hashedOtp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    const html = otpTemplate(otpValue, name);

    try {
      await sendEmail({
        to: email,
        subject: "OTP Verification",
        text: `Your OTP is ${otpValue}`,
        html,
      });
    } catch (error) {
      console.log("Email failed, deleting OTP");

      await OTP.deleteMany({ email }); // 🔥 cleanup

      return res.status(500).json({
        message: "Email sending failed",
      });
    }

    const user = await userModel.create({
      name,
      email,
      password,
      role,
    });

    res.status(201).json({
      message: "Signup successful, OTP sent",
    });
  } catch (error) {
    return res.status(400).json({
      message: "Signup failed",
      error: error.message,
    });
  }
}

// otp verify controller

async function otpVerifyController(req, res) {
  try {
    const { email, otp } = req.body;

    const otpRecord = await OTP.findOne({ email }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const isMatch = await bcrypt.compare(otp, otpRecord.otp);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    await userModel.updateOne({ email }, { isVerified: true });

    await OTP.deleteMany({ email });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "3d",
      },
    );
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // production me true
      sameSite: "strict",
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "OTP verified successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "OTP verification failed",
      error: error.message,
    });
  }
}

// resend otp

async function resendOtpController(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(400).josn({
        message: "User not found",
      });
    }
    if (user.isVerified) {
      return res.status(400).josn({
        message: "User already verified",
      });
    }
    await OTP.deleteMany({ email });
    const otpValue = generateOTP();
    const hashedOto = await bcrypt.hash(otpValue, 10);
    await OTP.create({
      email,
      otp: hashedOtp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min
    });
    const html = otpTemplate(otpValue, name);
    await sendEmail({
      to: email,
      subject: "Resend OTP Verification",
      text: `Your OTP is ${otpValue}`,
      html,
    });
    res.status(200).json({
      message: "OTP resent successfully 📩",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to resend OTP",
      error: error.message,
    });
  }
}

// login controller

async function loginController(req, res) {
  try {
    const { email, password } = req.body;

    // check user
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // check verified
    if (!user.isVerified) {
      return res.status(400).json({
        message: "Please verify your email first",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    // generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "3d" },
    );

    // 🍪 set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // production → true
      sameSite: "lax",
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Login successful",
      token: token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
}

// get user

async function getUserController(req, res) {
  try {
      const userId = req.user.id || req.user._id;
      const user = await userModel.findById(userId).select("-password");
      if (!user) {
        return res.status(404).json({
          message:"User not found"
        })
      }
      res.status(200).json({
        user
      })
  } catch (error) {
    return res.status(500).json({
      message:"User fetch failed",
      error: error.message
    })
  }
}

// logout controller

async function logoutController(req, res) {
  const cookieOptions = {
    httpOnly: true,
    secure: false, // production → true
    sameSite: "strict",
    maxAge: 0,
  };
  res.clearCookie("token", cookieOptions);
  res.status(200).json({
    message: "Logout successful",
  });
}

module.exports = {
  signUpController,
  otpVerifyController,
  loginController,
  getUserController,
  logoutController,
  resendOtpController
};
