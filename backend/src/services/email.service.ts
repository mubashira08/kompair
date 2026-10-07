import { Resend } from 'resend';
import { env } from '../config/env';

const resend = new Resend(env.RESEND_API_KEY);

export async function sendOtpEmail(email: string, otp: string) {
  // If API key is not set, log and skip (for local dev)
  if (!env.RESEND_API_KEY) {
    console.log(`[Email Mock] Sending OTP ${otp} to ${email}`);
    return;
  }

  const { error } = await resend.emails.send({
    from: 'StudyMate <onboarding@resend.dev>', // Needs valid verified domain in production
    to: email,
    subject: 'Your StudyMate Login Code',
    html: `<p>Your StudyMate verification code is <strong>${otp}</strong>. It will expire in 10 minutes.</p>`,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
}
