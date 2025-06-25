import React, { useState, useMemo } from "react";
import {
  FeesStructureDto,
  FeesSlabYear,
  FeesSlab,
  FeesHead,
  FeesComponent,
  FeesReceiptType,
} from "@/types/fees";
import {
  CalendarDays,
  Clock,
  School,
  GraduationCap,
  CheckSquare,
  Square,
  FileText,
} from "lucide-react";

interface PreviewSimulationProps {
  feesStructure: FeesStructureDto & { feesReceiptTypeId?: number | null };
  feesSlabYears: FeesSlabYear[];
  slabs: FeesSlab[];
  feeHeads: FeesHead[];
  feesReceiptTypes: FeesReceiptType[];
}

interface CalculatedFee extends FeesComponent {
  feeHeadName: string;
  adjustedAmount?: number;
}

export const PreviewSimulation: React.FC<PreviewSimulationProps> = ({
  feesStructure,
  feesSlabYears,
  slabs,
  feeHeads,
  feesReceiptTypes,
}) => {
  const MIN_ROWS = 8;
  const [selectedSlabId, setSelectedSlabId] = useState<number | null>(feesSlabYears[0].feesSlabId!);

  const getFeeHeadName = (id: number) =>
    feeHeads.find((h) => h.id === id)?.name || "N/A";
  const getSlabName = (id: number) =>
    slabs.find((s) => s.id === id)?.name || "N/A";

  const getReceiptTypeName = (id: number | null | undefined) => {
    if (!id) return "N/A";
    return feesReceiptTypes.find((rt) => rt.id === id)?.name || "N/A";
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "Not Set";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const calculatedFees = useMemo((): CalculatedFee[] => {
    const components = feesStructure.components.map((component) => ({
      ...component,
      feeHeadName: getFeeHeadName(component.feesHeadId),
    }));

    if (!selectedSlabId) {
      return components.map((c) => ({ ...c, adjustedAmount: c.amount }));
    }

    const selectedSlabData = feesSlabYears.find(
      (slab) => slab.feesSlabId === selectedSlabId
    );

    if (!selectedSlabData) {
      return components.map((c) => ({ ...c, adjustedAmount: c.amount }));
    }

    return components.map((component) => ({
      ...component,
      adjustedAmount: component.isConcessionApplicable
        ? component.amount -
          (component.amount * selectedSlabData.feeConcessionRate) / 100
        : component.amount,
    }));
  }, [feesStructure.components, feesSlabYears, selectedSlabId, feeHeads]);

  const totalAmount = useMemo(
    () => calculatedFees.reduce((sum, fee) => sum + fee.amount, 0),
    [calculatedFees]
  );

  const adjustedTotalAmount = useMemo(
    () =>
      calculatedFees.reduce(
        (sum, fee) => sum + (fee.adjustedAmount ?? fee.amount),
        0
      ),
    [calculatedFees]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Left Panel */}
      <div className="lg:col-span-1 h-full">
        <div className="bg-white rounded-lg border border-gray-200 h-full flex flex-col">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h4 className="text-sm font-medium text-gray-900">
              Details Summary
            </h4>
          </div>
          <div className="p-4 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Fees Receipt Type</p>
                  <p className="text-sm font-medium text-gray-900">
                    {getReceiptTypeName(feesStructure.feesReceiptTypeId)}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <School className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Academic Year</p>
                  <p className="text-sm font-medium text-gray-900">
                    {feesStructure.academicYear?.startYear
                      ? `${new Date(
                          feesStructure.academicYear.startYear
                        ).getFullYear()}`
                      : "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <GraduationCap className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Course</p>
                  <p className="text-sm font-medium text-gray-900">
                    {feesStructure.course?.name || "N/A"} (Semester{" "}
                    {feesStructure.semester})
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Shift</p>
                  <p className="text-sm font-medium text-gray-900">
                    {feesStructure.shift?.name || "N/A"}
                  </p>
                </div>
              </div>
              {feesStructure.advanceForCourse && (
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">
                      To be treated as Advance for
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {feesStructure.advanceForCourse.name} (Semester{" "}
                      {feesStructure.advanceForSemester})
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start space-x-3">
                <CalendarDays className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Fee Collection Period</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(feesStructure.startDate)} -{" "}
                    {formatDate(feesStructure.endDate)}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CalendarDays className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">
                    Online Collection Period
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(feesStructure.onlineStartDate)} -{" "}
                    {formatDate(feesStructure.onlineEndDate)}
                  </p>
                </div>
              </div>
              {feesStructure.numberOfInstalments &&
                feesStructure.numberOfInstalments > 0 && (
                  <div className="flex items-start space-x-3">
                    <CalendarDays className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Installments</p>
                      <p className="text-sm font-medium text-gray-900">
                        {feesStructure.numberOfInstalments} from{" "}
                        {formatDate(feesStructure.instalmentStartDate)}
                      </p>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="lg:col-span-2 flex flex-col space-y-6 h-full">
        {/* Concession Slabs Tabs */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-3">
            <div className="flex flex-wrap gap-2">
              {feesSlabYears.map((slabYear) => (
                <button
                  key={slabYear.feesSlabId}
                  onClick={() =>
                    setSelectedSlabId(
                      selectedSlabId === slabYear.feesSlabId
                        ? null
                        : slabYear.feesSlabId
                    )
                  }
                  className={`px-4 py-2 text-sm rounded-md transition-colors ${
                    selectedSlabId === slabYear.feesSlabId
                      ? "bg-purple-100 text-purple-700 border-purple-200"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                  } border`}
                >
                  <span>{getSlabName(slabYear.feesSlabId)}</span>
                  <span
                    className={`ml-2 font-medium ${
                      selectedSlabId === slabYear.feesSlabId
                        ? "text-purple-700"
                        : "text-gray-900"
                    }`}
                  >
                    ({slabYear.feeConcessionRate}%)
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Fee Structure Details Card */}
        <div className="bg-white rounded-lg border border-gray-200 flex-grow flex flex-col">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h4 className="text-sm font-medium text-gray-900">
              Fee Structure Details
            </h4>
          </div>
          <div className="p-4 flex-grow flex flex-col overflow-hidden">
            <div className="flex-grow overflow-hidden border border-gray-300 rounded-lg flex flex-col">
              <table className="min-w-full h-[330px] flex flex-col">
                <thead className="flex-shrink-0">
                  <tr className="flex">
                    <th className="w-16 px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r border-gray-300">
                      SR. NO.
                    </th>
                    <th className="flex-1 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r border-gray-300">
                      Fee Head
                    </th>
                    <th className="w-24 px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r border-gray-300">
                      Sequence
                    </th>
                    <th className="w-28 px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r border-gray-300">
                      Applied Concession
                    </th>
                    <th className="w-32 px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r border-gray-300">
                      Amount
                    </th>
                    {selectedSlabId && (
                      <th className="w-32 px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                        Adjusted Amount
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="flex-grow overflow-y-auto bg-white">
                  {calculatedFees.map((fee, index) => (
                    <tr key={index} className="flex border-b-transparent">
                      <td className="w-16 px-4 py-2 text-center border-r border-gray-300 flex items-center justify-center">
                        {index + 1}.
                      </td>
                      <td className="flex-1 px-4 py-2 text-left border-r border-gray-300 flex items-center">
                        {fee.feeHeadName}
                      </td>
                      <td className="w-24 px-4 py-2 text-center border-r border-gray-300 flex items-center justify-center">
                        {fee.sequence}
                      </td>
                      <td className="w-28 px-4 py-2 text-center border-r border-gray-300 flex items-center justify-center">
                        {fee.isConcessionApplicable ? (
                          <CheckSquare className="h-5 w-5 text-purple-600" />
                        ) : (
                          <Square className="h-5 w-5 text-gray-400" />
                        )}
                      </td>
                      <td className="w-32 px-4 py-2 text-right border-r border-gray-300 flex items-center justify-end">
                        ₹{fee.amount.toLocaleString()}
                      </td>
                      {selectedSlabId && (
                        <td
                          className={`w-32 px-4 py-2 text-right  border-gray-300 flex items-center justify-end ${
                            fee.isConcessionApplicable
                              ? "text-green-600 font-medium"
                              : "text-gray-900"
                          }`}
                        >
                          ₹{(fee.adjustedAmount ?? fee.amount).toLocaleString()}
                        </td>
                      )}
                    </tr>
                  ))}
                  {Array.from({ length: Math.max(0, MIN_ROWS - feesStructure.components.length) }).map((_, index) => (
                <tr key={`empty-${index}`} className="flex h-[53px]">
                  <td className="w-16 border-r border-gray-300"></td>
                  <td className="flex-1 border-r border-gray-300"></td>
                  <td className="w-24 border-r border-gray-300"></td>
                  <td className="w-28 border-r border-gray-300"></td>
                  <td className="w-32 border-r border-gray-300"></td>
                  <td className="w-32"></td>
                </tr>
              ))}
                </tbody>
                <tfoot className="flex-shrink-0">
                  <tr className="flex bg-gray-50">
                    <td
                      className="flex-1 px-4 py-2 border-t border-r border-gray-300 text-right font-bold text-gray-900"
                    >
                      Total
                    </td>
                    <td className="w-32 px-4 py-2 border-t border-r border-gray-300 font-bold text-gray-900 text-right">
                      ₹{totalAmount.toLocaleString()}
                    </td>
                    {selectedSlabId && (
                      <td className="w-32 px-4 py-2 border-t border-gray-300 font-bold text-green-600 text-right">
                        ₹{adjustedTotalAmount.toLocaleString()}
                      </td>
                    )}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
