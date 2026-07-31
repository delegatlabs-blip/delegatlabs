import nodemailer from "nodemailer";

const DEV_OTP = process.env.AUTH_DEV_OTP || "123456";

export function useDevOtp(): boolean {
  return process.env.AUTH_USE_DEV_OTP !== "false";
}

export function getDevOtp(): string {
  return DEV_OTP;
}

function smtpConfigured(): boolean {
  return Boolean(
    process.env.AWS_SES_SMTP_HOST &&
      process.env.AWS_SES_SMTP_USER &&
      process.env.AWS_SES_SMTP_PASS &&
      process.env.AWS_SES_FROM_EMAIL,
  );
}

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.AWS_SES_SMTP_HOST,
    port: Number(process.env.AWS_SES_SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.AWS_SES_SMTP_USER,
      pass: process.env.AWS_SES_SMTP_PASS,
    },
  });
}

export async function sendOtpEmail(input: {
  to: string;
  otp: string;
  kind: "owner" | "user";
}): Promise<{ delivered: boolean; usedDevOtp: boolean }> {
  const portal = input.kind === "owner" ? "Admin" : "User";
  const subject = `${portal} password reset code`;
  const text = `Your ${portal} password reset code is: ${input.otp}\n\nIt expires in 15 minutes.`;

  if (useDevOtp() && !smtpConfigured()) {
    console.info(`[auth] DEV OTP for ${input.to} (${input.kind}): ${input.otp}`);
    return { delivered: false, usedDevOtp: true };
  }

  if (!smtpConfigured()) {
    console.warn("[auth] SES SMTP not configured — OTP not emailed");
    if (useDevOtp()) {
      console.info(`[auth] DEV OTP for ${input.to} (${input.kind}): ${input.otp}`);
      return { delivered: false, usedDevOtp: true };
    }
    throw new Error("Email delivery is not configured");
  }

  const transport = createTransport();
  await transport.sendMail({
    from: process.env.AWS_SES_FROM_EMAIL,
    to: input.to,
    subject,
    text,
    html: `<p>Your ${portal} password reset code is:</p><p style="font-size:24px;font-weight:700;letter-spacing:4px">${input.otp}</p><p>It expires in 15 minutes.</p>`,
  });
  return { delivered: true, usedDevOtp: useDevOtp() };
}
