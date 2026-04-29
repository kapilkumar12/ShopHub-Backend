const puppeteer = require("puppeteer");

const generateInvoice = async (order, user) => {
  try {
    const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial; padding: 20px; }
          .header { text-align: center; font-size: 22px; font-weight: bold; }
          .box { margin-top: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          table, th, td { border: 1px solid #ddd; padding: 8px; }
          th { background: #2980b9; color: white; }
        </style>
      </head>

      <body>

        <div class="header">INVOICE</div>

        <div class="box">
          <p><b>Order ID:</b> ${order._id}</p>
          <p><b>Date:</b> ${new Date(order.createdAt).toLocaleString()}</p>
          <p><b>Customer:</b> ${user.name}</p>
          <p><b>Email:</b> ${user.email}</p>
          <p><b>Phone:</b> ${order.phone}</p>
          <p><b>Address:</b> ${order.address}</p>
        </div>

        <table>
          <tr>
            <th>Product</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
          </tr>

          ${order.items
            .map(
              (item) => `
              <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>₹${item.price}</td>
                <td>₹${item.price * item.quantity}</td>
              </tr>
            `
            )
            .join("")}
        </table>

        <h3>Total: ₹${order.totalPrice}</h3>

      </body>
    </html>
    `;

    const browser = await puppeteer.launch({
      headless: "new",
    });

    const page = await browser.newPage();
    await page.setContent(html);

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    return pdfBuffer;
  } catch (error) {
    console.error(error);
    throw new Error("PDF generation failed");
  }
};

module.exports = generateInvoice;