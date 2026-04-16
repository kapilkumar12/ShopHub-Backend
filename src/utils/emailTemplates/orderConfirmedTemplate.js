const orderConfirmedTemplate = ({ name = "User", orderId, date }) => {
  return `
  <div style="font-family: Arial; padding: 20px; background:#f4f6f8;">
    <div style="max-width:600px;margin:auto;background:#fff;border-radius:10px;overflow:hidden">

      <div style="background:#16a34a;color:white;padding:20px;text-align:center">
        <h2>🎉 Order Confirmed</h2>
      </div>

      <div style="padding:20px;text-align:center">
        <h3>Hi ${name},</h3>
        <p>Your order has been successfully confirmed.</p>

        <div style="margin:20px 0;padding:15px;background:#f0fdf4;border-radius:8px">
          <b>Order ID:</b> ${orderId}
        </div>

        <div style="margin:10px 0;color:#555">
          <b>Date:</b> ${date || new Date().toLocaleString()}
        </div>

        <p>We are preparing your order for shipment 🚀</p>
      </div>

      <div style="background:#f9fafb;padding:10px;text-align:center;font-size:12px">
        © 2026 Your Store
      </div>

    </div>
  </div>
  `;
};

module.exports = orderConfirmedTemplate;