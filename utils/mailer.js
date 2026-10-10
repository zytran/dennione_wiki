const nodemailer = require('nodemailer');

console.log('SMTP user:', JSON.stringify(process.env.smtp_user));
console.log('SMTP pass length:', process.env.smtp_pass ? process.env.smtp_pass.length : 'MISSING');

const port = Number(process.env.smtp_port) || 465;

const transporter = nodemailer.createTransport({
  host: process.env.smtp_host,
  port,
  secure: port === 465,
  requireTLS: port !== 465,
  auth: {
    user: process.env.smtp_user,
    pass: process.env.smtp_pass,
  },
});

function sendMail({ to, subject, text }) {
  return transporter.sendMail({
    from: process.env.smtp_from,
    to,
    subject,
    text,
  });
}

module.exports = { sendMail };