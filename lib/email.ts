import nodemailer from 'nodemailer'

export async function sendEmail(options: { to: string; subject: string; html: string; from?: string }) {
  const { to, subject, html, from } = options

  // If SMTP env is configured, use it
  if (process.env.SMTP_HOST) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined
    })

    const info = await transporter.sendMail({
      from: from || process.env.SMTP_FROM || 'noreply@kekeligroup.com',
      to,
      subject,
      html
    })

    return { provider: 'smtp', info }
  }

  // Otherwise use Ethereal for dev/testing and return preview URL
  const testAccount = await nodemailer.createTestAccount()
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass }
  })

  const info = await transporter.sendMail({
    from: from || 'noreply@kekeligroup.com',
    to,
    subject,
    html
  })

  const previewUrl = nodemailer.getTestMessageUrl(info)
  return { provider: 'ethereal', info, previewUrl }
}
