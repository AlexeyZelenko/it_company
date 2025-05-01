const functions = require("firebase-functions");
const nodemailer = require("nodemailer");
const cors = require('cors')({ origin: true });

// Налаштування транспортера SMTP (використовуйте змінні середовища Firebase)
console.log('SMTP_HOST:', process.env);
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER || 'zelenkooleksii75@gmail.com',
        pass: process.env.SMTP_PASS || 'ursb cviw zmqe cymn',
    },
});
console.log('[INFO] sendSupportMessage: Transporter успешно инициализирован для подтверждения.');

exports.sendContactForm = functions.https.onRequest(async (req, res) => {
    cors(req, res, async () => {
        if (req.method === 'OPTIONS') {
            return res.status(204).send(); // Respond to preflight requests
        }

        if (req.method !== 'POST') {
            return res.status(405).send('Method Not Allowed');
        }

        try {
            const { name, email, subject, message } = req.body;

            if (!name || !email || !subject || !message) {
                return res.status(400).json({ error: 'Please provide all required fields.' });
            }

            // Параметри електронного листа
            const mailOptions = {
                from: `"IT Company Contact Form" <${process.env.SMTP_USER}>`,
                to: process.env.CONTACT_EMAIL,
                subject: `New Contact Form Submission: ${subject}`,
                html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
        `,
            };

            // Відправка електронного листа
            await transporter.sendMail(mailOptions);

            return res.status(200).json({ message: 'Email sent successfully' });
        } catch (error) {
            console.error('Error sending email:', error);
            return res.status(500).json({ error: 'Failed to send email' });
        }
    });
});