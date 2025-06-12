import React from "react";
import { PlusCircle } from "lucide-react";
import Header from "../../components/common/PageHeader";

const Addon: React.FC = () => {
  return (
    <div className="min-h-[80vh] bg-gradient-to-br from-purple-50 to-white p-4">
      <Header title="Addon Fees" subtitle="Manage addon fees details" icon={PlusCircle} />
      <div className="mt-4">Coming soon...</div>
    </div>
  );
};

export default Addon;
