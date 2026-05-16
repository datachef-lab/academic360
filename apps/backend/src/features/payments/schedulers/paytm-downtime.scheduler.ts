import { createLogger } from "@/config/logger.js";
import { paytmConfig } from "../config/paytm.config.js";
import { runPaytmDowntimePoll } from "../services/payment-downtime.service.js";

const log = createLogger("paytm-downtime");

const TEN_MIN_MS = 10 * 60 * 1000;

/**
 * Poll Paytm “Fetch current downtime” every 10 minutes. Disabled when `PAYTM_DOWNTIME_CRON_ENABLED=false`.
 */
export function startPaytmDowntimeScheduler(): void {
  if (process.env.PAYTM_DOWNTIME_CRON_ENABLED === "false") {
    log.info(
      "Paytm downtime scheduler disabled (PAYTM_DOWNTIME_CRON_ENABLED=false)",
    );
    return;
  }
  if ((process.env.NODE_ENV ?? "").toLowerCase() !== "production") {
    log.info("Paytm downtime scheduler skipped: NODE_ENV is not production");
    return;
  }
  if (paytmConfig.environment !== "PRODUCTION") {
    log.info(
      "Paytm downtime scheduler skipped: API is not hosted on staging environment",
    );
    return;
  }

  void runPaytmDowntimePoll().catch((err) =>
    log.error("Paytm downtime initial poll failed", { err }),
  );

  setInterval(() => {
    void runPaytmDowntimePoll().catch((err) =>
      log.error("Paytm downtime poll failed", { err }),
    );
  }, TEN_MIN_MS);

  log.info("Paytm downtime poll scheduled every 10 minutes");
}
