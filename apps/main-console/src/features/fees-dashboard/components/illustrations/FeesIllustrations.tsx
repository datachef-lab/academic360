import type { MetricId } from "../../data/dashboard-metrics";

/** Optional raster/vector assets in /public/fees-dashboard */
export const METRIC_ASSET_SRC: Partial<Record<MetricId, string>> = {
  fee_receivable: "/fees-dashboard/wallet.svg",
  fee_collected: "/fees-dashboard/collected.svg",
  fee_structures_total: "/fees-dashboard/structure.svg",
};
