import React from "react";

interface AcademicSetupProps {
  data: {
    academicYear: string;
    feeCollectionDates: {
      startDate: string;
      endDate: string;
      onlineStartDate: string;
      onlineEndDate: string;
    };
  };
  onChange: (data: AcademicSetupProps["data"]) => void;
}

export const AcademicSetup: React.FC<AcademicSetupProps> = ({ data, onChange }) => {
  const handleInputChange = (field: string, value: string) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      onChange({
        ...data,
        [parent]: {
          ...data[parent as keyof typeof data],
          [child]: value,
        },
      });
    } else {
      onChange({
        ...data,
        [field]: value,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Academic Setup</h3>
        <p className="text-sm text-gray-600 mb-6">Configure the academic year and fee collection timeline</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
          <select
            value={data.academicYear}
            onChange={(e) => handleInputChange("academicYear", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm text-black focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">Select Academic Year</option>
            <option value="2025-26">2025-26</option>
            <option value="2026-27">2026-27</option>
            <option value="2027-28">2027-28</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fee Collection Start Date</label>
            <input
              type="date"
              value={data.feeCollectionDates.startDate}
              onChange={(e) => handleInputChange("feeCollectionDates.startDate", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm text-black focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fee Collection End Date</label>
            <input
              type="date"
              value={data.feeCollectionDates.endDate}
              onChange={(e) => handleInputChange("feeCollectionDates.endDate", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm text-black focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Online Fee Collection Start Date</label>
            <input
              type="date"
              value={data.feeCollectionDates.onlineStartDate}
              onChange={(e) => handleInputChange("feeCollectionDates.onlineStartDate", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm text-black focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Online Fee Collection End Date</label>
            <input
              type="date"
              value={data.feeCollectionDates.onlineEndDate}
              onChange={(e) => handleInputChange("feeCollectionDates.onlineEndDate", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm text-black focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
