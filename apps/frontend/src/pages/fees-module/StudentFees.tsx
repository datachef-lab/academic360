import React from "react";
import { Wallet } from "lucide-react";
import Header from "../../components/common/PageHeader";

const StudentFees: React.FC = () => {
  return (
    <div className="min-h-[80vh] bg-gradient-to-br from-purple-50 to-white p-4">
      <Header title="Student Fees" subtitle="Manage student fee payments" icon={Wallet} />
      <div className="mt-4">Coming soon...</div>
    </div>
  );
};

export default StudentFees;
