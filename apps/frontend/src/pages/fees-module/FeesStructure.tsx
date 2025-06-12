import React from "react";
import { Banknote } from "lucide-react";
import Header from "../../components/common/PageHeader";

const FeesStructure: React.FC = () => {
  return (
    <div className="min-h-[80vh] bg-gradient-to-br from-purple-50 to-white p-4">
      <Header title="Fees Structure" subtitle="Manage fees structure details" icon={Banknote} />
      <div className="mt-4">Coming soon...</div>
    </div>
  );
};

export default FeesStructure;
