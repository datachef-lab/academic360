import React from 'react';
import { UserPlus } from 'lucide-react';
import Header from '../components/common/PageHeader';

const AdmissionAndFees: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white items-center justify-center px-2 py-3 sm:px-2 lg:px-2">
      <Header
        title="Admission & Fees"
        subtitle="Apply for admission or explore our fee details"
        icon={UserPlus}
      />
      {/* content */}
      <div className="div"></div>
    </div>
  );
};

export default AdmissionAndFees;
