const PDFDocument = require("pdfkit");
const axios = require("axios");

const generateInvoice = async (order) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40 });
      let buffers = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      /////////////////////////////////////////////////////////////
      // 🖼️ LOGO
      /////////////////////////////////////////////////////////////
      try {
        const response = await axios.get(
          "https://via.placeholder.com/120x50?text=LOGO",
          { responseType: "arraybuffer" }
        );
        doc.image(response.data, 40, 30, { width: 120 });
      } catch (e) {
        console.log("Logo load failed");
      }

      /////////////////////////////////////////////////////////////
      // 🏢 COMPANY INFO
      /////////////////////////////////////////////////////////////
      doc
        .fontSize(12)
        .text("My Company Pvt Ltd", 350, 30)
        .text("GST: 22AAAAA0000A1Z5", 350)
        .text("Jaipur, Rajasthan", 350);

      doc.moveDown(2);

      /////////////////////////////////////////////////////////////
      // 🧾 INVOICE TITLE
      /////////////////////////////////////////////////////////////
      doc
        .fontSize(20)
        .text("INVOICE", { align: "center" });

      doc.moveDown();

      /////////////////////////////////////////////////////////////
      // 👤 CUSTOMER
      /////////////////////////////////////////////////////////////
      doc.fontSize(12).text(`Customer: ${order.user?.name || "N/A"}`);
      doc.text(`Email: ${order.user?.email || "N/A"}`);
      doc.text(`Phone: ${order.phone}`);
      doc.text(`Address: ${order.address}`);
      doc.text(`Order ID: ${order._id}`);
      doc.text(
        `Date: ${new Date(order.createdAt).toLocaleDateString()}`
      );

      doc.moveDown();

      /////////////////////////////////////////////////////////////
      // 📦 TABLE HEADER
      /////////////////////////////////////////////////////////////
      const tableTop = doc.y;

      const col1 = 40;
      const col2 = 80;
      const col3 = 260;
      const col4 = 350;
      const col5 = 420;
      const col6 = 480;

      doc.font("Helvetica-Bold");

      doc.text("#", col1, tableTop);
      doc.text("Item", col2, tableTop);
      doc.text("Price", col4, tableTop);
      doc.text("Qty", col5, tableTop);
      doc.text("Total", col6, tableTop);

      doc.moveTo(40, tableTop + 15)
         .lineTo(550, tableTop + 15)
         .stroke();

      /////////////////////////////////////////////////////////////
      // 📦 TABLE ROWS
      /////////////////////////////////////////////////////////////
      let y = tableTop + 25;
      doc.font("Helvetica");

      order.items.forEach((item, index) => {
        doc.text(index + 1, col1, y);
        doc.text(item.product?.name || "Product", col2, y, {
          width: 160,
        });
        doc.text(`₹${item.price}`, col4, y);
        doc.text(item.quantity, col5, y);
        doc.text(`₹${item.price * item.quantity}`, col6, y);

        y += 25;

        // line
        doc.moveTo(40, y)
           .lineTo(550, y)
           .stroke();
      });

      /////////////////////////////////////////////////////////////
      // 💰 CALCULATIONS
      /////////////////////////////////////////////////////////////
      const subtotal = order.totalPrice;
      const gst = subtotal * 0.18;
      const shipping = 50;
      const discount = 100;
      const finalTotal = subtotal + gst + shipping - discount;

      doc.moveDown();

      doc.text(`Subtotal: ₹${subtotal}`, { align: "right" });
      doc.text(`GST (18%): ₹${gst.toFixed(2)}`, { align: "right" });
      doc.text(`Shipping: ₹${shipping}`, { align: "right" });
      doc.text(`Discount: -₹${discount}`, { align: "right" });

      doc.font("Helvetica-Bold");
      doc.text(`Total: ₹${finalTotal.toFixed(2)}`, {
        align: "right",
      });

      /////////////////////////////////////////////////////////////
      // 💳 PAYMENT
      /////////////////////////////////////////////////////////////
      doc.moveDown();
      doc.font("Helvetica");

      doc.text(`Payment Method: ${order.paymentMethod}`);
      doc.text(`Payment Status: ${order.paymentStatus}`);
      doc.text(`Order Status: ${order.status}`);

      /////////////////////////////////////////////////////////////
      // FOOTER
      /////////////////////////////////////////////////////////////
      doc.moveDown();
      doc.text("Thank you for shopping with us ❤️", {
        align: "center",
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = generateInvoice;