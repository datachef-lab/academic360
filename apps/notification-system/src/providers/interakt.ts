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

    console.log("phoneNumber:", phoneNumber);
    console.log("to in interakt:", to);

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

    // Log the exact payload being sent to Interakt (sanitized)
    console.log("[interakt] request =>", {
      to: phoneNumber,
      templateName,
      headerMediaUrl: Boolean(headerMediaUrl) ? headerMediaUrl : undefined,
      bodyValues: Array.isArray(messageArr) ? messageArr : [],
      baseUrl: INTERAKT_BASE_URL,
    });
    console.log("requestBody:", requestBody);
    const response = await fetch(INTERAKT_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${INTERAKT_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const raw = await response.text().catch(() => "");
      // Try to extract structured message from JSON error bodies
      let message = raw;
      try {
        const json = JSON.parse(raw || "{}");
        // Common Interakt error fields: message, error.message, errors[0].message
        message =
          json?.message ||
          json?.error?.message ||
          (Array.isArray(json?.errors) && json.errors[0]?.message) ||
          raw;
      } catch {
        // keep raw
      }
      const composed = `HTTP ${response.status} ${String(message)}`;
      // Log full error context to help debugging in workers/logs
      console.log("[interakt] error response =>", {
        status: response.status,
        statusText: (response as any).statusText,
        message: composed,
        rawBody: raw,
        requestBody,
      });
      // Return full message (no truncation) so workers can persist completely
      return { ok: false, error: composed, status: response.status };
    }
    await response.json().catch(() => ({}));
    return { ok: true };
  } catch (error: any) {
    // Log full error and propagate full string upwards
    console.log("[interakt] exception =>", {
      error: String(error),
    });
    return { ok: false, error: String(error) };
  }
}
