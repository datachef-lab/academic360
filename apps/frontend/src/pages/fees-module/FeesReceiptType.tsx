import React from "react";
import { Receipt } from "lucide-react";
import Header from "../../components/common/PageHeader";

const FeesReceiptType: React.FC = () => {
  return (
    <div className="min-h-[80vh] bg-gradient-to-br from-purple-50 to-white p-4">
      <Header title="Fees Receipt Type" subtitle="Manage receipt types" icon={Receipt} />
      <div className="mt-4">Coming soon...</div>
    </div>
  );
};

export default FeesReceiptType;
