import React from "react";
import { Layers3 } from "lucide-react";
import Header from "../../components/common/PageHeader";

const FeesSlab: React.FC = () => {
  return (
    <div className="min-h-[80vh] bg-gradient-to-br from-purple-50 to-white p-4">
      <Header title="Fees Slab" subtitle="Manage fees slab details" icon={Layers3} />
      <div className="mt-4">Coming soon...</div>
    </div>
  );
};

export default FeesSlab;
