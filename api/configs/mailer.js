const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const { logInfo, logError } = require("../services/logService");

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_MAIL,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendMail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: `"ClockIn" <${process.env.EMAIL_MAIL}>`,
      to,
      subject,
      html,
    });
    await logInfo(`E-mail enviado com sucesso para ${to}`, 'mailer', null, { to, subject }, null);
    return true;
  } catch (error) {
    await logError("Falha ao enviar e-mail", 'mailer', null, { to, subject, erro: error.message }, null);
    return false;
  }
}
