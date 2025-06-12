import React from "react";
import { Calendar } from "lucide-react";
import Header from "../../components/common/PageHeader";

const AcademicYear: React.FC = () => {
  return (
    <div className="min-h-[80vh] bg-gradient-to-br from-purple-50 to-white p-4">
      <Header title="Academic Year" subtitle="Manage academic year settings" icon={Calendar} />
      <div className="mt-4">Coming soon...</div>
    </div>
  );
};

export default AcademicYear;
