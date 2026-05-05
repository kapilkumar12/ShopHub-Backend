const otpTemplate = (otpValue, name = "User") => {
  return `
  <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
    <div style="max-width: 500px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
      
      <!-- Header -->
      <div style="background: linear-gradient(90deg, #4f46e5, #6366f1); padding: 20px; text-align: center; color: white;">
        <h2 style="margin: 0;">ShopHub App</h2>
        <p style="margin: 5px 0 0; font-size: 14px;">Secure OTP Verification</p>
      </div>

      <!-- Body -->
      <div style="padding: 30px; text-align: center;">
        <h3 style="margin-bottom: 10px; color: #333;">Hello, ${name} 👋</h3>
        <p style="color: #666; font-size: 14px;">
          Use the OTP below to complete your signup process.  
          This OTP is valid for 5 minutes.
        </p>

        <!-- OTP BOX -->
        <div style="margin: 25px 0;">
          <span style="display: inline-block; padding: 15px 30px; font-size: 28px; letter-spacing: 5px; background: #f3f4f6; border-radius: 8px; font-weight: bold; color: #111;">
            ${otpValue}
          </span>
        </div>

        <p style="color: #999; font-size: 12px;">
          If you did not request this, you can safely ignore this email.
        </p>
      </div>

      <!-- Footer -->
      <div style="background: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #888;">
        © 2026 ShopHub App. All rights reserved.
      </div>

    </div>
  </div>
  `;
};

module.exports = otpTemplate;