import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOTPEmail(to: string, otp: string, type: 'verify' | 'reset' = 'verify'): Promise<boolean> {
  const subject = type === 'verify'
    ? '🎓 EduTech - Verify Your Email'
    : '🔐 EduTech - Reset Your Password';

  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: linear-gradient(135deg, #0a0e1a 0%, #1e1b4b 100%); border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #6366f1, #22d3ee); padding: 32px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🎓 EduTech</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">AI-Powered Learning Platform</p>
      </div>
      <div style="padding: 32px; color: #f0f4ff;">
        <h2 style="color: #818cf8; margin-top: 0;">${type === 'verify' ? 'Email Verification' : 'Password Reset'}</h2>
        <p style="color: #94a3b8; line-height: 1.6;">
          ${type === 'verify'
            ? 'Welcome! Use the code below to verify your email and get started:'
            : 'Use the code below to reset your password:'}
        </p>
        <div style="background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3); border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #22d3ee;">${otp}</span>
        </div>
        <p style="color: #94a3b8; font-size: 14px;">This code expires in <strong style="color: #f59e0b;">10 minutes</strong>.</p>
        <p style="color: #64748b; font-size: 12px; margin-top: 24px;">If you didn't request this, please ignore this email.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"EduTech Platform" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    return false;
  }
}
