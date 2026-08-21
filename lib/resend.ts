import { Resend } from "resend";

let resendClient: Resend | null = null;

export function getResend() {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

export function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}
