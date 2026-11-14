const nodemailer = require('nodemailer');
const t = process.env.SMTP_HOST ? nodemailer.createTransport({
  host: process.env.SMTP_HOST, port: +process.env.SMTP_PORT || 587,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } }) : null;
exports.sendMail = async (to, subject, html) => {
  if (!t) return console.log(`\n[MAIL to ${to}] ${subject}\n${html.replace(/<[^>]+>/g, ' ')}\n`);
  await t.sendMail({ from: process.env.MAIL_FROM, to, subject, html });
};
