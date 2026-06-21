import nodemailer from 'nodemailer'

function createTransporter() {
  if (!process.env.SMTP_HOST) {
    return null
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
  })
}

export async function sendMail(to: string, subject: string, html: string) {
  const transporter = createTransporter()
  if (!transporter) {
    return
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? 'erp@company.com',
    to,
    subject,
    html,
  })
}
