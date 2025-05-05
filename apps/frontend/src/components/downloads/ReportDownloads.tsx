import React from 'react';
import FilterAndExportComponent from '@/components/reports/FilterAndExportComponent';

const ReportDownloads: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white/20 rounded-2xl drop-shadow-xl p-4">
        <FilterAndExportComponent />
      </div>
      <div className="bg-white/20 rounded-2xl drop-shadow-xl p-4">
        <div className="text-center py-8">
          <h3 className="text-xl font-semibold text-gray-700">Report Downloads</h3>
          <p className="text-gray-500 mt-2">Select and export your reports here</p>
        </div>
      </div>
    </div>
  );
};

export default ReportDownloads; 