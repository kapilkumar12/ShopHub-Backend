const orderShippedTemplate = ({ name="User", orderId, date }) => {
  return `
  <div style="font-family: Arial, sans-serif; background:#f5f5f5; padding:20px;">
    
    <div style="max-width:600px; margin:auto; background:#fff; border-radius:8px; overflow:hidden;">
      
      <!-- HEADER -->
      <div style="background:#0f172a; color:#fff; padding:20px; text-align:center;">
        <h2>🚚 Your Order is on the way!</h2>
      </div>

      <!-- BODY -->
      <div style="padding:20px;">
        <p>Hi <strong>${name}</strong>,</p>

        <p>Great news! Your order has been <strong>shipped</strong> 🎉</p>

        <div style="background:#f1f5f9; padding:15px; border-radius:6px; margin:15px 0;">
          <p><strong>Order ID:</strong> ${orderId}</p>
          <p><strong>Shipped On:</strong> ${new Date(date).toLocaleDateString()}</p>
        </div>

        <p>You can expect delivery soon. Stay tuned! 📦</p>

        <!-- BUTTON -->
        <div style="text-align:center; margin:20px 0;">
          <a href="#" style="background:#3b82f6; color:#fff; padding:10px 20px; text-decoration:none; border-radius:5px;">
            Track Order
          </a>
        </div>

        <p style="margin-top:20px;">Thanks for shopping with us ❤️</p>
      </div>

      <!-- FOOTER -->
      <div style="background:#f1f5f9; padding:15px; text-align:center; font-size:12px;">
        <p>© 2026 Your Store. All rights reserved.</p>
      </div>

    </div>
  </div>
  `;
};

module.exports = orderShippedTemplate;