const refundEmailTemplate = ({
  name = "User",
  orderId,
  refundAmount,
  paymentMethod,
  date
}) => {
  return `
  <div style="font-family: Arial; padding: 20px; background:#f4f6f8;">
    <div style="max-width:600px;margin:auto;background:#fff;border-radius:10px;overflow:hidden">

      <!-- Header -->
      <div style="background:#2563eb;color:white;padding:20px;text-align:center">
        <h2>💰 Refund Processed</h2>
      </div>

      <!-- Body -->
      <div style="padding:20px;text-align:center">
        <h3>Hi ${name},</h3>
        <p>Your refund has been successfully processed.</p>

        <!-- Order Info -->
        <div style="margin:20px 0;padding:15px;background:#eff6ff;border-radius:8px">
          <b>Order ID:</b> ${orderId}
        </div>

        <!-- Refund Amount -->
        <div style="margin:20px 0;padding:15px;background:#ecfdf5;border-radius:8px">
          <b>Refund Amount:</b> ₹${refundAmount}
        </div>

        <!-- Payment Method -->
        <div style="margin:10px 0;color:#555">
          <b>Payment Method:</b> ${paymentMethod}
        </div>

        <!-- Date -->
        <div style="margin:10px 0;color:#555">
          <b>Date:</b> ${date || new Date().toLocaleString()}
        </div>

        <p style="margin-top:20px">
          The amount will reflect in your account within 3-5 business days.
        </p>

        <p>Thank you for shopping with us ❤️</p>
      </div>

      <!-- Footer -->
      <div style="background:#f9fafb;padding:10px;text-align:center;font-size:12px">
        © 2026 Your Store
      </div>

    </div>
  </div>
  `;
};

module.exports = refundEmailTemplate;