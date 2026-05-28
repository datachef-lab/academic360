import React, { useMemo } from "react";
import { ActivityIndicator, Modal, Platform, Pressable, Text, View } from "react-native";
import { useTheme } from "@/hooks/use-theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Linking from "expo-linking";

type PaytmWebCheckoutProps = {
  visible: boolean;
  mid: string;
  host: string;
  orderId: string;
  txnToken: string;
  onClose: () => void;
  onNavigationChange?: (url: string) => void;
};

function buildPaytmAutoSubmitHtml(mid: string, orderId: string, txnToken: string, host: string) {
  const paytmHost = host.replace(/^https?:\/\//, "");
  const action = `https://${paytmHost}/theia/api/v1/showPaymentPage?mid=${encodeURIComponent(mid)}&orderId=${encodeURIComponent(orderId)}`;
  return `<!DOCTYPE html>
<html>
  <head><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
  <body onload="document.getElementById('paytm').submit()">
    <form id="paytm" method="POST" action="${action}">
      <input type="hidden" name="mid" value="${mid}" />
      <input type="hidden" name="orderId" value="${orderId}" />
      <input type="hidden" name="txnToken" value="${txnToken}" />
    </form>
    <p style="font-family: sans-serif; text-align:center; padding:24px;">Redirecting to Paytm…</p>
  </body>
</html>`;
}

/** Opens Paytm via auto-submit HTML (WebView on native, injected form on web). */
export function PaytmWebCheckout({
  visible,
  mid,
  host,
  orderId,
  txnToken,
  onClose,
  onNavigationChange,
}: PaytmWebCheckoutProps) {
  const { theme, colorScheme } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === "dark";
  const html = useMemo(
    () => buildPaytmAutoSubmitHtml(mid, orderId, txnToken, host),
    [mid, orderId, txnToken, host],
  );
  const paytmHost = host.replace(/^https?:\/\//, "");
  const paytmUrl = `https://${paytmHost}/theia/api/v1/showPaymentPage?mid=${encodeURIComponent(mid)}&orderId=${encodeURIComponent(orderId)}`;
  let WebViewComponent: any = null;
  try {
    // Optional dependency: avoid crashing the whole app if package isn't installed yet.
    WebViewComponent = require("react-native-webview").WebView;
  } catch {
    WebViewComponent = null;
  }

  React.useEffect(() => {
    if (!visible || Platform.OS !== "web" || typeof document === "undefined") return;
    const form = document.createElement("form");
    form.method = "POST";
    form.action = paytmUrl;
    form.target = "_self";
    form.style.display = "none";
    [
      { name: "mid", value: mid },
      { name: "orderId", value: orderId },
      { name: "txnToken", value: txnToken },
    ].forEach(({ name, value }) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
    onClose();
  }, [visible, mid, orderId, txnToken, paytmUrl, onClose]);

  if (Platform.OS === "web") {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: theme.background, paddingTop: insets.top }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderColor: isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb",
          }}
        >
          <Text style={{ color: theme.text, fontSize: 17, fontWeight: "600" }}>Paytm Checkout</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={{ color: theme.text, fontSize: 22, lineHeight: 22 }}>×</Text>
          </Pressable>
        </View>
        {WebViewComponent ? (
          <WebViewComponent
            originWhitelist={["*"]}
            source={{ html }}
            startInLoadingState
            renderLoading={() => (
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <ActivityIndicator size="large" color={isDark ? "#a5b4fc" : "#4f46e5"} />
              </View>
            )}
            onNavigationStateChange={(nav: { url?: string }) => {
              if (nav.url) onNavigationChange?.(nav.url);
            }}
          />
        ) : (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
            <Text
              style={{ color: theme.text, opacity: 0.8, textAlign: "center", marginBottom: 16 }}
            >
              In-app web checkout is unavailable right now.
            </Text>
            <Pressable
              onPress={() => Linking.openURL(paytmUrl)}
              style={{
                backgroundColor: isDark ? "#6366f1" : "#4f46e5",
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 10,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>Open Paytm in Browser</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}
