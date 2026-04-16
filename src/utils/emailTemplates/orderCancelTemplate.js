const orderCancelTemplate = ({ name = "User", orderId, reason }) => {
  return `
  <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
    <div style="max-width: 500px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
      
      <!-- Header -->
      <div style="background: linear-gradient(90deg, #ef4444, #dc2626); padding: 20px; text-align: center; color: white;">
        <h2 style="margin: 0;">Ecommerce App</h2>
        <p style="margin: 5px 0 0; font-size: 14px;">Order Cancellation Notice</p>
      </div>

      <!-- Body -->
      <div style="padding: 30px;">
        <h3 style="color: #333;">Hello, ${name} 👋</h3>

        <p style="color: #555; font-size: 14px;">
          Your order has been <strong style="color: #dc2626;">cancelled</strong>.
        </p>

        <!-- Order Details -->
        <div style="margin: 20px 0; padding: 15px; background: #f9fafb; border-radius: 8px;">
          <p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderId}</p>
          <p style="margin: 5px 0;"><strong>Cancel Reason:</strong> ${reason || "Not specified"}</p>
        </div>

        <p style="color: #666; font-size: 14px;">
          If you have already made a payment, the refund (if applicable) will be processed shortly.
        </p>

        <p style="color: #999; font-size: 12px;">
          If you did not request this cancellation, please contact our support team immediately.
        </p>
      </div>

      <!-- Footer -->
      <div style="background: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #888;">
        © 2026 Ecommerce App. All rights reserved.
      </div>

    </div>
  </div>
  `;
};

module.exports = orderCancelTemplate;