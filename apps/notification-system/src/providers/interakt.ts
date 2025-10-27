const INTERAKT_API_KEY = process.env.INTERAKT_API_KEY!;
const INTERAKT_BASE_URL = process.env.INTERAKT_BASE_URL!;

export async function sendWhatsAppMessage(
  to: string,
  messageArr: string[] = [],
  templateName: string,
  headerMediaUrl?: string,
  buttonValues?: string[],
): Promise<{ ok: true } | { ok: false; error: string; status?: number }> {
  try {
    console.log("[whatsapp.interakt] Starting WhatsApp message send");
    console.log("[whatsapp.interakt] Input params:", {
      to,
      messageArr,
      templateName,
      headerMediaUrl,
      buttonValues,
      nodeEnv: process.env.NODE_ENV,
    });

    const phoneNumber =
      process.env.NODE_ENV === "development"
        ? process.env.DEVELOPER_PHONE!
        : to;

    console.log("[whatsapp.interakt] Phone number resolution:", {
      originalTo: to,
      resolvedPhoneNumber: phoneNumber,
      isDevelopment: process.env.NODE_ENV === "development",
      developerPhone: process.env.DEVELOPER_PHONE,
    });

    const requestBody: any = {
      countryCode: "+91",
      phoneNumber: phoneNumber,
      type: "Template",
      template: {
        name: templateName,
        languageCode: "en",
        headerValues: headerMediaUrl ? [headerMediaUrl] : ["Alert"],
        bodyValues: messageArr,
      },
      data: {
        message: "",
      },
    };

    // Add button values if provided
    if (buttonValues && buttonValues.length > 0) {
      requestBody.template.buttonValues = {
        "0": buttonValues,
      };
    }

    // Log the exact payload being sent to Interakt (sanitized)
    console.log("[whatsapp.interakt] Request details:", {
      to: phoneNumber,
      templateName,
      headerMediaUrl: Boolean(headerMediaUrl) ? headerMediaUrl : undefined,
      bodyValues: Array.isArray(messageArr) ? messageArr : [],
      buttonValues: Array.isArray(buttonValues) ? buttonValues : [],
      baseUrl: INTERAKT_BASE_URL,
      hasApiKey: Boolean(INTERAKT_API_KEY),
      apiKeyLength: INTERAKT_API_KEY?.length || 0,
    });
    console.log(
      "[whatsapp.interakt] Full request body:",
      JSON.stringify(requestBody, null, 2),
    );
    console.log("[whatsapp.interakt] Making API request to Interakt...");
    const response = await fetch(INTERAKT_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${INTERAKT_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log("[whatsapp.interakt] Response received:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
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
      console.log("[whatsapp.interakt] ERROR response =>", {
        status: response.status,
        statusText: (response as any).statusText,
        message: composed,
        rawBody: raw,
        requestBody,
      });
      // Return full message (no truncation) so workers can persist completely
      return { ok: false, error: composed, status: response.status };
    }

    const responseData = await response.json().catch(() => ({}));
    console.log("[whatsapp.interakt] SUCCESS response data:", responseData);
    console.log("[whatsapp.interakt] WhatsApp message sent successfully!");
    return { ok: true };
  } catch (error: any) {
    // Log full error and propagate full string upwards
    console.log("[whatsapp.interakt] EXCEPTION =>", {
      error: String(error),
      stack: error?.stack,
      name: error?.name,
    });
    return { ok: false, error: String(error) };
  }
}
