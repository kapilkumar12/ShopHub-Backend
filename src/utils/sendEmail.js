const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);
console.log(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, text, html, attachments }) => {
  try {
    const response = await resend.emails.send({
      from: `Ecommerce App <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html: html || `<p>${text}</p>`,
    });

    console.log("✅ Email sent:", response);
    return response;

  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw error;
  }
};

module.exports = sendEmail;