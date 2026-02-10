// server/src/index.ts
import express, { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateEmailField(field?: string): boolean {
  if (!field) return true;
  const emails = field.split(',').map(e => e.trim()).filter(Boolean);
  return emails.every(isValidEmail);
}

app.post('/api/send-email', async (req: Request, res: Response) => {
  try {
    const { to, cc, bcc, subject, body } = req.body || {};

    if (!to || !body) {
      return res.status(400).json({ error: 'to and body are required' });
    }
    if (!validateEmailField(to)) return res.status(400).json({ error: 'Invalid to address' });
    if (!validateEmailField(cc)) return res.status(400).json({ error: 'Invalid cc address' });
    if (!validateEmailField(bcc)) return res.status(400).json({ error: 'Invalid bcc address' });

    // Nodemailer test account (Ethereal) - dev only
    const testAccount = await nodemailer.createTestAccount();

    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });

    const info = await transporter.sendMail({
      from: `"Angular Test" <${testAccount.user}>`,
      to,
      cc,
      bcc,
      subject: subject || '(no subject)',
      text: body
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || null;

    return res.json({ ok: true, messageId: info.messageId, previewUrl });
  } catch (err: any) {
    console.error('send-email error:', err);
    return res.status(500).json({ error: 'Failed to send email', details: err?.message });
  }
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(PORT, () => {
  console.log(`Mail backend (TS) listening on http://localhost:${PORT}`);
});
