/**
 * Compliance reports (NAAC / NIRF / AISHE) as Excel workbooks. Each has a
 * header sheet (Framework / Academic year / Criterion) and a metrics sheet
 * (Metric / Value). Reuses the JSON-payload shapers already in
 * library-reports.service.
 */

import {
  buildLibraryReport,
  formatAishe,
  formatNaac,
  formatNirf,
} from "../library-reports.service.js";
import { buildStandardWorkbook } from "../report-common/build-standard-workbook.js";

async function buildComplianceWorkbook(
  framework: "NAAC" | "NIRF" | "AISHE",
  year: string,
): Promise<Buffer> {
  const payload = await buildLibraryReport(year);
  let title = framework as string;
  let criterion = "";
  let metrics: Record<string, string | number> = {};

  if (framework === "NAAC") {
    const r = formatNaac(payload);
    title = r.framework;
    criterion = r.criterion;
    metrics = r.metrics;
  } else if (framework === "NIRF") {
    const r = formatNirf(payload);
    title = r.framework;
    metrics = r.libraryResources as Record<string, number>;
  } else {
    const r = formatAishe(payload);
    title = r.framework;
    metrics = r.library as Record<string, number>;
  }

  const headerRows = [
    { Field: "Framework", Value: title },
    { Field: "Academic year", Value: year },
    { Field: "Criterion", Value: criterion || "—" },
  ];
  const metricsRows = Object.entries(metrics).map(([Metric, Value]) => ({
    Metric,
    Value,
  }));

  return buildStandardWorkbook([
    {
      name: "Header",
      columns: [
        { header: "Field", key: "Field", width: 24 },
        { header: "Value", key: "Value", width: 40 },
      ],
      rows: headerRows,
    },
    {
      name: "Metrics",
      columns: [
        { header: "Metric", key: "Metric", width: 40 },
        { header: "Value", key: "Value", width: 28 },
      ],
      rows: metricsRows,
    },
  ]);
}

export const exportNaacExcel = (year: string) =>
  buildComplianceWorkbook("NAAC", year);
export const exportNirfExcel = (year: string) =>
  buildComplianceWorkbook("NIRF", year);
export const exportAisheExcel = (year: string) =>
  buildComplianceWorkbook("AISHE", year);
