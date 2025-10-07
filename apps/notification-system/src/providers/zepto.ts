import { SendMailClient } from "zeptomail";

const client = new SendMailClient({
  url: process.env.ZEPTO_URL!,
  token: `Zoho-enczapikey ${process.env.ZEPTO_TOKEN!}`,
});

interface ZeptoAttachmentPayload {
  name: string;
  mime_type: string;
  content: string; // base64
}

interface ZeptoPayload {
  from: { address: string; name: string };
  to: { email_address: { address: string; name: string } }[];
  subject: string;
  htmlbody: string;
  attachments?: ZeptoAttachmentPayload[];
}

export async function sendZeptoMail(
  to: string,
  subject: string,
  htmlBody: string,
  name?: string,
  attachments?: Array<{
    filename: string;
    contentBase64: string;
    mimeType: string;
  }>,
  fromNameOverride?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const recipient =
    process.env.NODE_ENV === "development" ? process.env.DEVELOPER_EMAIL! : to;
  const fromName = fromNameOverride || "Academic360 Notifications";
  const payload: ZeptoPayload = {
    from: { address: process.env.ZEPTO_FROM!, name: fromName },
    to: [{ email_address: { address: recipient, name: name || "User" } }],
    subject,
    htmlbody: htmlBody,
  };
  if (attachments && attachments.length > 0) {
    payload.attachments = attachments.map((a) => ({
      name: a.filename,
      mime_type: a.mimeType,
      content: a.contentBase64,
    }));
  }
  try {
    await client.sendMail(payload);
    return { ok: true };
  } catch (e: any) {
    console.log(
      `[zepto] sendZeptoMail error:`,
      e.error,
      e.error.message,
      e.error.details,
    );

    // Extract proper error message from ZeptoMail API response
    let errorMessage = "Unknown error";
    if (e?.error?.message) {
      errorMessage = e.error.message;
    } else if (e?.message) {
      errorMessage = e.message;
    } else if (typeof e === "string") {
      errorMessage = e;
    } else if (e && typeof e === "object") {
      errorMessage = JSON.stringify(e);
    }

    console.log(`[zepto] extracted error message:`, errorMessage);
    return { ok: false, error: errorMessage.slice(0, 500) };
  }
}
