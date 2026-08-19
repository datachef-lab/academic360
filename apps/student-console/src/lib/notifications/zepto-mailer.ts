import { SendMailClient } from "zeptomail";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const ZEPTO_URL = process.env.ZEPTO_URL!;
const ZEPTO_FROM = process.env.ZEPTO_FROM!;
const ZEPTO_TOKEN = process.env.ZEPTO_TOKEN!;
const NODE_ENV = process.env.NODE_ENV!;
const DEVELOPER_EMAIL = process.env.DEVELOPER_EMAIL!;

console.log("ZeptoMail URL:", ZEPTO_URL);
console.log("ZeptoMail FROM:", ZEPTO_FROM);
console.log(`Zoho-enczapikey ${ZEPTO_TOKEN!}`);

const client = new SendMailClient({
  url: process.env.ZEPTO_URL!,
  token: `Zoho-enczapikey ${ZEPTO_TOKEN!}`,
});

export async function sendZeptoMail(to: string, subject: string, htmlBody: string, name?: string) {
  try {
    // Use developer email in development mode
    const recipientEmail = NODE_ENV === "development" ? DEVELOPER_EMAIL! : to;

    console.log("sending email to:", recipientEmail);
    console.log("email subject:", subject);
    console.log("email body:", htmlBody);
    console.log("email name:", name);

    // The zeptomail SendMailClient has no built-in request timeout option,
    // so bound the call with a race against a timer instead - this doesn't
    // cancel the underlying HTTP call, but it stops us from hanging on it.
    // On timeout this rejects the same way any other send failure does, so
    // callers (see the catch block below and app/api/otp/generate) see the
    // same error shape as any other ZeptoMail failure.
    const response = await Promise.race([
      client.sendMail({
        from: {
          address: process.env.ZEPTO_FROM!,
          name: "BESC Admission Communication",
        },
        to: [
          {
            email_address: {
              address: recipientEmail,
              name: name || "User",
            },
          },
        ],
        subject,
        htmlbody: htmlBody,
      }),
      new Promise((_resolve, reject) =>
        setTimeout(() => reject(new Error("ZeptoMail request timed out")), 10_000),
      ),
    ]);

    console.log("✅ Email sent via ZeptoMail:", response);
    return response;
  } catch (error) {
    console.error("❌ ZeptoMail send error:", error);
    throw error;
  }
}
