import { useCallback, useEffect, useRef, useState } from "react";
import { initiateFeePayment, getPaymentConfig, getPaymentStatus } from "@/services/payments-api";

declare global {
  interface Window {
    Paytm?: {
      CheckoutJS: {
        onLoad: (callback: () => void) => void;
        init: (config: PaytmCheckoutConfig) => Promise<void>;
        invoke: () => void;
      };
    };
  }
}

interface PaytmCheckoutConfig {
  root: string;
  flow: string;
  data: {
    orderId: string;
    token: string;
    tokenType: string;
    amount: string;
  };
  merchant?: {
    redirect?: boolean;
  };
  handler: {
    notifyMerchant: (eventName: string, data: unknown) => void;
    transactionStatus?: (paymentStatus: Record<string, unknown>) => void;
  };
}

export function usePaytmCheckout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scriptLoadedRef = useRef(false);

  const loadPaytmScript = useCallback(async (mid: string, host: string): Promise<boolean> => {
    if (scriptLoadedRef.current && window.Paytm?.CheckoutJS) return true;

    return new Promise((resolve) => {
      const existing = document.querySelector(`script[src*="merchants/${mid}.js"]`);
      if (existing) {
        scriptLoadedRef.current = true;
        resolve(!!window.Paytm?.CheckoutJS);
        return;
      }
      const script = document.createElement("script");
      script.type = "application/javascript";
      script.src = `${host}/merchantpgpui/checkoutjs/merchants/${mid}.js`;
      script.crossOrigin = "anonymous";
      script.onload = () => {
        scriptLoadedRef.current = true;
        resolve(true);
      };
      script.onerror = () => {
        setError("Failed to load Paytm checkout");
        resolve(false);
      };
      document.head.appendChild(script);
    });
  });

  useEffect(() => {
    getPaymentConfig()
      .then((res) => {
        const { mid, host } = res.payload ?? {};
        if (mid && host) loadPaytmScript(mid, host);
      })
      .catch(() => {});
  }, [loadPaytmScript]);

  const openPaytmCheckout = useCallback(
    async (params: {
      feeStudentMappingId: number;
      amount: number;
      studentId: number;
      studentName?: string;
      studentEmail?: string;
      studentMobile?: string;
      onBeforeInvoke?: () => void;
      onSuccess?: (orderId: string) => void;
      onFailure?: (message: string) => void;
    }) => {
      setLoading(true);
      setError(null);

      try {
        const [configRes, initiateRes] = await Promise.all([
          getPaymentConfig(),
          initiateFeePayment({
            feeStudentMappingId: params.feeStudentMappingId,
            amount: String(params.amount),
            studentId: params.studentId,
            email: params.studentEmail,
            mobile: params.studentMobile,
            firstName: params.studentName?.split(" ")[0],
            lastName: params.studentName?.split(" ").slice(1).join(" ") || undefined,
          }),
        ]);

        const config = configRes.payload;
        const initData = initiateRes.payload;

        if (!config?.mid || !config?.host || !initData?.txnToken || !initData?.orderId) {
          const msg = initiateRes.message || configRes.message || "Failed to initiate payment";
          setError(msg);
          params.onFailure?.(msg);
          setLoading(false);
          return;
        }

        params.onBeforeInvoke?.();

        const paytmHost = config.host?.replace(/^https?:\/\//, "") || "securestage.paytmpayments.com";
        const showPaymentUrl = `https://${paytmHost}/theia/api/v1/showPaymentPage?mid=${config.mid}&orderId=${initData.orderId}`;

        const form = document.createElement("form");
        form.method = "POST";
        form.action = showPaymentUrl;
        form.target = "_blank";
        form.style.display = "none";

        const fields = [
          { name: "mid", value: config.mid },
          { name: "orderId", value: initData.orderId },
          { name: "txnToken", value: initData.txnToken },
        ];
        fields.forEach(({ name, value }) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = name;
          input.value = value;
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        setLoading(false);
      } catch (err: unknown) {
        const axiosData = (err as { response?: { data?: { message?: string } } })?.response?.data;
        const msg = axiosData?.message || (err instanceof Error ? err.message : "Failed to open payment");
        setError(msg);
        params.onFailure?.(msg);
        setLoading(false);
      }
    },
    [],
  );

  const pollPaymentStatus = useCallback(async (orderId: string): Promise<"SUCCESS" | "FAILED" | "PENDING"> => {
    const res = await getPaymentStatus(orderId);
    return (
      res.payload?.status === "TXN_SUCCESS" ? "SUCCESS" : res.payload?.status === "TXN_FAILURE" ? "FAILED" : "PENDING"
    ) as "SUCCESS" | "FAILED" | "PENDING";
  }, []);

  return { openPaytmCheckout, pollPaymentStatus, loading, error };
}
