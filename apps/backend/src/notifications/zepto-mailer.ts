import { SendMailClient } from "zeptomail";
import { createLogger } from "@/config/logger.js";
const log = createLogger("zepto");

const ZEPTO_URL = process.env.ZEPTO_URL!;
const ZEPTO_FROM = process.env.ZEPTO_FROM!;
const ZEPTO_TOKEN = process.env.ZEPTO_TOKEN!;
const NODE_ENV = process.env.NODE_ENV ?? "development";
const DEVELOPER_EMAIL = process.env.DEVELOPER_EMAIL!;

log.debug(`URL : ${ZEPTO_URL}`);
log.debug(`FROM: ${ZEPTO_FROM}`);
log.debug(`Zoho-enczapikey ${ZEPTO_TOKEN!}`);

const client = new SendMailClient({
  url: process.env.ZEPTO_URL!,
  token: `Zoho-enczapikey ${ZEPTO_TOKEN!}`,
});

export async function sendZeptoMail(
  to: string,
  subject: string,
  htmlBody: string,
  name?: string,
) {
  try {
    // Use developer email in development mode
    const recipientEmail = NODE_ENV === "development" ? DEVELOPER_EMAIL! : to;

    log.info(`Sending email → ${recipientEmail}`, { subject, name });
    // console.log("email subject:", subject);
    // console.log("email body:", htmlBody);
    // console.log("email name:", name);
    const response = await client.sendMail({
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
    });

    log.info(`Email sent ✅`, { to: recipientEmail, subject });
    return response;
  } catch (error) {
    log.error("❌ ZeptoMail send error:", { error });
    throw error;
  }
}
