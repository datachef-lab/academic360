import React, { useState, useMemo } from "react";
import type { FeeStructureFormData } from "../FeeStructureForm";

interface PreviewSimulationProps {
  data: FeeStructureFormData;
}

export const PreviewSimulation: React.FC<PreviewSimulationProps> = ({ data }) => {
  const [selectedSlab, setSelectedSlab] = useState<number | null>(null);

  const calculatedFees = useMemo(() => {
    if (!selectedSlab) {
      return data.feeConfiguration.components;
    }

    const selectedSlabData = data.slabs.find((slab) => slab.id === selectedSlab);
    if (!selectedSlabData) {
      return data.feeConfiguration.components;
    }

    return data.feeConfiguration.components.map((component) => ({
      ...component,
      adjustedAmount: component.concessionEligible
        ? component.amount - (component.amount * selectedSlabData.concessionPercentage) / 100
        : component.amount,
    }));
  }, [data.feeConfiguration.components, data.slabs, selectedSlab]);

  const totalAmount = useMemo(() => calculatedFees.reduce((sum, fee) => sum + fee.amount, 0), [calculatedFees]);

  const adjustedTotalAmount = useMemo(
    () => calculatedFees.reduce((sum, fee) => sum + (fee.adjustedAmount || fee.amount), 0),
    [calculatedFees],
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Preview & Simulation</h3>
        <p className="text-sm text-gray-600 mb-6">Review fee structure and simulate concession slabs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Fee Structure */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h4 className="text-sm font-medium text-gray-900">Fee Structure Details</h4>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Academic Year</p>
                  <p className="text-sm font-medium text-gray-900">{data.academicSetup.academicYear}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Course</p>
                  <p className="text-sm font-medium text-gray-900">{data.feeConfiguration.course.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Semester</p>
                  <p className="text-sm font-medium text-gray-900">{data.feeConfiguration.semester}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Shift</p>
                  <p className="text-sm font-medium text-gray-900">{data.feeConfiguration.shift}</p>
                </div>
              </div>

              <div className="mt-4">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fee Head
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      {selectedSlab && (
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Adjusted Amount
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {calculatedFees.map((fee) => (
                      <tr key={fee.id}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{fee.feeHead}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                          ₹{fee.amount.toLocaleString()}
                        </td>
                        {selectedSlab && (
                          <td
                            className={`px-4 py-2 whitespace-nowrap text-sm text-right ${
                              fee.concessionEligible ? "text-green-600 font-medium" : "text-gray-900"
                            }`}
                          >
                            ₹{(fee.adjustedAmount || fee.amount).toLocaleString()}
                          </td>
                        )}
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-medium">
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">Total</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                        ₹{totalAmount.toLocaleString()}
                      </td>
                      {selectedSlab && (
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-green-600 text-right">
                          ₹{adjustedTotalAmount.toLocaleString()}
                        </td>
                      )}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Slab Selection */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h4 className="text-sm font-medium text-gray-900">Concession Slabs</h4>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                {data.slabs.map((slab) => (
                  <button
                    key={slab.id}
                    onClick={() => setSelectedSlab(selectedSlab === slab.id ? null : slab.id)}
                    className={`w-full px-4 py-2 text-sm rounded-md transition-colors ${
                      selectedSlab === slab.id
                        ? "bg-purple-100 text-purple-700 border-purple-200"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    } border`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{slab.slabType}</span>
                      <span className={`font-medium ${selectedSlab === slab.id ? "text-purple-700" : "text-gray-900"}`}>
                        {slab.concessionPercentage}%
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {selectedSlab && (
                <div className="mt-4 p-4 bg-green-50 rounded-md">
                  <div className="text-sm text-green-700">
                    <div className="font-medium mb-1">Savings Summary</div>
                    <div className="flex justify-between">
                      <span>Original Amount:</span>
                      <span>₹{totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>After Concession:</span>
                      <span>₹{adjustedTotalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-medium mt-1 pt-1 border-t border-green-200">
                      <span>Total Savings:</span>
                      <span>₹{(totalAmount - adjustedTotalAmount).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
