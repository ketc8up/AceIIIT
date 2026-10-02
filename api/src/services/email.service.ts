import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'ACE IIIT <support@aceiiit.in>';

const wrapHtml = (content: string) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f9fc; margin: 0; padding: 40px 0; }
  .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
  .header { background-color: #0f172a; padding: 30px 40px; text-align: center; }
  .logo { font-size: 32px; font-weight: 800; letter-spacing: -0.5px; margin: 0; }
  .logo-ace { color: #ffffff; }
  .logo-iiit { color: #cda852; }
  .content { padding: 40px; color: #334155; line-height: 1.6; font-size: 16px; }
  h2 { color: #0f172a; font-size: 24px; font-weight: 700; margin-top: 0; margin-bottom: 24px; }
  .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin: 24px 0; }
  .row { display: flex; justify-content: space-between; margin-bottom: 12px; }
  .row:last-child { margin-bottom: 0; }
  .label { color: #64748b; font-size: 14px; font-weight: 500; }
  .value { color: #0f172a; font-size: 15px; font-weight: 600; }
  .btn { display: inline-block; background-color: #cda852; color: #000000; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 700; font-size: 16px; margin-top: 10px; text-align: center; box-sizing: border-box; }
  .footer { padding: 30px 40px; background: #f8fafc; text-align: center; color: #94a3b8; font-size: 13px; border-top: 1px solid #e2e8f0; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo"><span class="logo-ace">Ace</span><span class="logo-iiit">IIIT</span></div>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} AceIIIT UGEE Prep. All rights reserved.<br>
      This is an automated system message.
    </div>
  </div>
</body>
</html>
`;

export class EmailService {
  static async sendOrderPendingEmail(email: string, name: string, orderNumber: string, amount: number, receiptPdfBase64?: string) {
    try {
      const content = `
        <h2>Payment Pending Verification</h2>
        <p>Hi ${name},</p>
        <p>We've successfully received your order and are currently verifying your UTR details. This process usually takes a few hours.</p>
        
        <div class="box">
          <div class="row"><span class="label">Order Reference</span> <span class="value">#${orderNumber}</span></div>
          <div class="row"><span class="label">Amount Paid</span> <span class="value">₹${amount}</span></div>
          <div class="row"><span class="label">Status</span> <span class="value" style="color: #eab308;">Pending Verification ⏳</span></div>
        </div>

        <p>Once verified, you will receive another email unlocking your access. Hang tight!</p>
      `;

      const attachments = [];
      if (receiptPdfBase64) {
        // Strip the data URI prefix if present
        const base64Data = receiptPdfBase64.replace(/^data:application\/pdf;filename=generated\.pdf;base64,/, '').replace(/^data:application\/pdf;base64,/, '');
        attachments.push({
          filename: `AceIIIT_Receipt_${orderNumber}.pdf`,
          content: Buffer.from(base64Data, 'base64')
        });
      }

      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: `Order Received - Pending Verification (#${orderNumber})`,
        html: wrapHtml(content),
        attachments: attachments.length > 0 ? attachments : undefined
      });
    } catch (e) {
      console.error('Failed to send pending email', e);
    }
  }

  static async sendPaymentVerifiedEmail(email: string, name: string, orderNumber: string, hasMock: boolean) {
    try {
      let mockContent = hasMock ? `
        <div class="box" style="border-left: 4px solid #cda852; background: #fffbeb;">
          <h3 style="margin-top:0; color:#b45309;">Mock Portal Provisioned</h3>
          <p style="margin-bottom:0;">Your Mock Portal account is ready! Log in at the mock portal using this email (<strong>${email}</strong>) to access the premium test series.</p>
        </div>
      ` : '';

      let actionButton = hasMock ? `
        <div style="text-align: center; margin-top: 32px;">
          <a href="https://mock.aceiiit.in" class="btn">Go to Mock Portal &rarr;</a>
        </div>
      ` : '';

      const content = `
        <h2>Access Granted! 🎉</h2>
        <p>Hi ${name},</p>
        <p>Great news! We have successfully verified your payment for Order <strong>#${orderNumber}</strong>.</p>
        
        ${mockContent}

        <p>You can now jump right into your preparation!</p>
        
        ${actionButton}
      `;

      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: `Payment Verified! Your Access is Granted 🚀`,
        html: wrapHtml(content)
      });
    } catch (e) {
      console.error('Failed to send verified email', e);
    }
  }

  static async sendPaymentRejectedEmail(email: string, name: string, orderNumber: string, reason: string) {
    try {
      const content = `
        <h2>Payment Action Required ⚠️</h2>
        <p>Hi ${name},</p>
        <p>There was an issue verifying your payment for Order <strong>#${orderNumber}</strong>.</p>
        
        <div class="box" style="border-left: 4px solid #ef4444; background: #fef2f2;">
          <h3 style="margin-top:0; color:#b91c1c;">Rejection Reason</h3>
          <p style="margin-bottom:0; color:#991b1b;">${reason}</p>
        </div>

        <p>If you believe this is a mistake or need help resolving this issue, please reply directly to this email and our support team will assist you.</p>
        
        <div style="text-align: center; margin-top: 32px;">
          <a href="https://aceiiit.in" class="btn" style="background-color: #ef4444; color: white;">Contact Support &rarr;</a>
        </div>
      `;

      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: `Action Required: Payment Rejected (#${orderNumber})`,
        html: wrapHtml(content)
      });
    } catch (e) {
      console.error('Failed to send rejected email', e);
    }
  }

  static async sendOtpEmail(email: string, code: string) {
    try {
      const content = `
        <h2>Checkout Verification</h2>
        <p>Your one-time verification code is:</p>
        
        <div style="text-align: center; margin: 32px 0;">
          <span style="display: inline-block; background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 16px 32px; font-size: 32px; font-weight: 800; letter-spacing: 4px; color: #0f172a;">${code}</span>
        </div>

        <p style="color: #64748b; font-size: 14px; text-align: center;">This code will expire in 10 minutes. If you did not request this, you can safely ignore this email.</p>
      `;

      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: `Your AceIIIT Verification Code: ${code}`,
        html: wrapHtml(content)
      });
    } catch (e) {
      console.error('Failed to send OTP email', e);
    }
  }
}
