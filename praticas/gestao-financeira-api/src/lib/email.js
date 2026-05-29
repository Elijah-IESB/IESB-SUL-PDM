import nodemailer from "nodemailer";

function smtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.MAIL_FROM
  );
}

export async function sendPasswordResetEmail({ to, token }) {
  if (!smtpConfigured()) {
    const error = new Error(
      "Envio de e-mail nao configurado. Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS e MAIL_FROM no .env da API."
    );
    error.status = 503;
    throw error;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: "Código para redefinir sua senha",
    text: `Seu código para redefinir a senha é ${token}. Ele expira em 15 minutos.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Redefinição de senha</h2>
        <p>Use o código abaixo para criar uma nova senha no Gestao Financeira:</p>
        <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${token}</p>
        <p>Este código expira em 15 minutos.</p>
      </div>
    `,
  });

  return { sent: true };
}
