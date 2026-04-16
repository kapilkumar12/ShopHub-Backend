const nodemailer = require("nodemailer");
const { google } = require("googleapis");


const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);

oAuth2Client.setCredentials({
  refresh_token: process.env.REFRESH_TOKEN,
});


async function createTransporter() {

    const accessToken = await oAuth2Client.getAccessToken();
    return nodemailer.createTransport({
    service: "gmail",
    auth: {
        type: "OAuth2",
        user: process.env.EMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
         accessToken: accessToken,
    }
});
}

const sendEmail = async ({to,subject,text,html}) => {
    try {

        const transporter = await createTransporter();
        const info = await transporter.sendMail({
            from: `"E-commerce App" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html
        });

       console.log("✅ Email sent:", info.messageId);


    } catch (error) {
        console.error("Error sending email:",error)
        throw error; 

    }
}


module.exports = sendEmail;