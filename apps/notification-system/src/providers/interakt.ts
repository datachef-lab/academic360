const INTERAKT_API_KEY = process.env.INTERAKT_API_KEY!;
const INTERAKT_BASE_URL = process.env.INTERAKT_BASE_URL!;

export async function sendWhatsAppMessage(
  to: string,
  messageArr: string[] = [],
  templateName: string,
  headerMediaUrl?: string,
): Promise<{ ok: true } | { ok: false; error: string; status?: number }> {
  try {
    const phoneNumber =
      process.env.NODE_ENV === "development"
        ? process.env.DEVELOPER_PHONE!
        : to;

    const requestBody: Record<string, unknown> = {
      countryCode: "+91",
      phoneNumber,
      type: "Template",
      template: {
        name: templateName,
        languageCode: "en",
        headerValues: headerMediaUrl ? [headerMediaUrl] : ["Alert"],
        bodyValues: messageArr,
      },
      data: { message: "" },
    };

    const response = await fetch(INTERAKT_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${INTERAKT_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const err = await response.text().catch(() => "");
      return {
        ok: false,
        error: `HTTP ${response.status} ${err}`.slice(0, 500),
        status: response.status,
      };
    }
    await response.json().catch(() => ({}));
    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: String(error).slice(0, 500) };
  }
}
