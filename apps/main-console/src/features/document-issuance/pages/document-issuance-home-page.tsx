import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  DashboardHeader,
  type DashboardTabId,
} from "@/features/document-issuance/components/dashboard/DashboardHeader";
import { OverviewTab } from "@/features/document-issuance/components/dashboard/tabs/OverviewTab";
import { BatchReceiptsTab } from "@/features/document-issuance/components/dashboard/tabs/BatchReceiptsTab";
import { ByDocumentTypeTab } from "@/features/document-issuance/components/dashboard/tabs/ByDocumentTypeTab";
import { HandoversTab } from "@/features/document-issuance/components/dashboard/tabs/HandoversTab";
import { FeeClearanceBlocksTab } from "@/features/document-issuance/components/dashboard/tabs/FeeClearanceBlocksTab";
import { useDocumentsRealtime } from "@/features/document-issuance/hooks/useDocumentsRealtime";
import { LiveUpdatesBadge } from "@/features/fees-dashboard/components/LiveUpdatesBadge";
import { getAllBatchReceipts } from "@/features/document-issuance/services/document-batch-receipt.service";
import { useDocumentTypes } from "@/features/document-issuance/hooks/use-document-types";
import { useDashboardFeeClearance } from "@/features/document-issuance/hooks/use-documents-dashboard";

/** Document Issuance landing screen — the Documents Dashboard. */
const DocumentIssuanceHomePage = () => {
  const [activeTab, setActiveTab] = useState<DashboardTabId>("overview");

  // Real socket connection — drives the fixed "Live Updates" badge (bottom
  // right). Every documents:batch-receipt:updated / documents:ledger:updated
  // event invalidates the dashboard's React Query keys (in addition to the
  // hook's own defaults), so every tab refetches without a page reload.
  const { isConnected } = useDocumentsRealtime({
    invalidatePrefixes: [
      "student-ledger",
      "document-batch-receipts",
      "document-types",
      "documents-dashboard",
    ],
  });

  // Same query keys the tabs themselves use, so React Query dedupes — these
  // just let the tab strip's counts populate without waiting for the user
  // to open each tab first.
  const { data: batchReceipts } = useQuery({
    queryKey: ["document-batch-receipts"] as const,
    queryFn: () => getAllBatchReceipts(),
  });
  const { data: documentTypes } = useDocumentTypes();
  const { data: feeClearance } = useDashboardFeeClearance();

  const tabCounts = useMemo(
    () => ({
      "batch-receipts": batchReceipts ? String(batchReceipts.length) : undefined,
      "by-document-type": documentTypes ? String(documentTypes.length) : undefined,
      "fee-clearance": feeClearance ? String(feeClearance.kpis.studentsBlocked) : undefined,
    }),
    [batchReceipts, documentTypes, feeClearance],
  );

  return (
    <div className="min-h-full  p-2 sm:p-4">
      <div className="flex flex-col gap-3">
        <DashboardHeader activeTab={activeTab} onTabChange={setActiveTab} tabCounts={tabCounts} />

        {activeTab === "overview" && <OverviewTab onNavigate={setActiveTab} />}
        {activeTab === "batch-receipts" && <BatchReceiptsTab />}
        {activeTab === "by-document-type" && <ByDocumentTypeTab />}
        {activeTab === "handovers" && <HandoversTab />}
        {activeTab === "fee-clearance" && <FeeClearanceBlocksTab />}
      </div>
      <LiveUpdatesBadge connected={isConnected} />
    </div>
  );
};

export default DocumentIssuanceHomePage;
