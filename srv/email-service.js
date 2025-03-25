const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail', // ✅ Use your email provider (Gmail, Outlook, etc.)
    auth: {
        user: '@gmail.com', // ✅ Replace with your email
        pass: 'password'       // ✅ Replace with your email password or app password
    }
});

async function sendEmail(to, subject, text) {
    const mailOptions = {
        from: 'tprudhviece@gmail.com',
        to,
        subject,
        text
    };

    try {
        const result = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent: ${result.response}`);
    } catch (error) {
        console.error(`❌ Error sending email:`, error);
    }
}

module.exports = sendEmail;
