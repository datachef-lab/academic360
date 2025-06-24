import React from "react";
import { Plus, Trash2 } from "lucide-react";

interface FeeConfigurationProps {
  data: {
    course: string;
    semester: string;
    shift: string;
    advanceFor?: {
      course: string;
      semester: string;
      session: string;
    };
    components: Array<{
      id: number;
      feeHead: string;
      amount: number;
      sequence: number;
      concessionEligible: boolean;
      refundType: "Full" | "Forfeit";
      specialType: "Excess" | "Casual" | "Re-admission" | null;
      lateFeeType: string;
    }>;
  };
  onChange: (data: FeeConfigurationProps["data"]) => void;
}

export const FeeConfiguration: React.FC<FeeConfigurationProps> = ({ data, onChange }) => {
  const handleInputChange = (field: string, value: unknown) => {
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

  const handleAddComponent = () => {
    onChange({
      ...data,
      components: [
        ...data.components,
        {
          id: data.components.length + 1,
          feeHead: "",
          amount: 0,
          sequence: data.components.length + 1,
          concessionEligible: false,
          refundType: "Full" as const,
          specialType: null,
          lateFeeType: "",
        },
      ],
    });
  };

  const handleRemoveComponent = (id: number) => {
    onChange({
      ...data,
      components: data.components.filter((component) => component.id !== id),
    });
  };

  const handleComponentChange = (
    id: number,
    field: keyof FeeConfigurationProps["data"]["components"][0],
    value: unknown,
  ) => {
    onChange({
      ...data,
      components: data.components.map((component) =>
        component.id === id
          ? {
              ...component,
              [field]: value,
            }
          : component,
      ),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Fee Structure Configuration</h3>
        <p className="text-sm text-gray-600 mb-6">Configure fee components and academic parameters</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
          <select
            value={data.course}
            onChange={(e) => handleInputChange("course", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm text-black focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">Select Course</option>
            <option value="bca">BCA</option>
            <option value="bba">BBA</option>
            <option value="bcom">B.Com</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
          <select
            value={data.semester}
            onChange={(e) => handleInputChange("semester", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm text-black focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">Select Semester</option>
            {[1, 2, 3, 4, 5, 6].map((sem) => (
              <option key={sem} value={sem}>
                Semester {sem}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
          <select
            value={data.shift}
            onChange={(e) => handleInputChange("shift", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm text-black focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">Select Shift</option>
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Fee Components</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sr. No.
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fee Head
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sequence
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Concession
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Refund Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Special Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Late Fee
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.components.map((component, index) => (
                <tr key={component.id}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-black">{index + 1}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <select
                      value={component.feeHead}
                      onChange={(e) => handleComponentChange(component.id, "feeHead", e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm text-black"
                    >
                      <option value="">Select Fee Head</option>
                      <option value="tuition">Tuition Fee</option>
                      <option value="development">Development Fee</option>
                      <option value="library">Library Fee</option>
                      <option value="sports">Sports Fee</option>
                    </select>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <input
                      type="text"
                      value={component.amount}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^\d*\.?\d*$/.test(val)) {
                          handleComponentChange(
                          component.id,
                          "amount",
                          val === "" || val.endsWith(".") ? val : parseFloat(val),
                        );
                        }
                      }}
                      className="w-24 px-2 py-1 border border-gray-300 rounded-md text-sm text-black"
                    />
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <input
                      type="text"
                      value={component.sequence}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^\d*$/.test(val)) {
                          handleComponentChange(component.id, "sequence", val === "" ? 0 : parseInt(val, 10));
                        }
                      }}
                      className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm text-black"
                    />
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={component.concessionEligible}
                      onChange={(e) => handleComponentChange(component.id, "concessionEligible", e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <select
                      value={component.refundType}
                      onChange={(e) => handleComponentChange(component.id, "refundType", e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm text-black"
                    >
                      <option value="Full">Full</option>
                      <option value="Forfeit">Forfeit</option>
                    </select>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <select
                      value={component.specialType || ""}
                      onChange={(e) => handleComponentChange(component.id, "specialType", e.target.value || null)}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm text-black"
                    >
                      <option value="">None</option>
                      <option value="Excess">Excess</option>
                      <option value="Casual">Casual</option>
                      <option value="Re-admission">Re-admission</option>
                    </select>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <select
                      value={component.lateFeeType}
                      onChange={(e) => handleComponentChange(component.id, "lateFeeType", e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm text-black"
                    >
                      <option value="">Select Type</option>
                      <option value="daily">Daily</option>
                      <option value="monthly">Monthly</option>
                      <option value="fixed">Fixed</option>
                    </select>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <button
                      onClick={() => handleRemoveComponent(component.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleAddComponent}
            className="flex items-center px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-md hover:bg-purple-100"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Component
          </button>
        </div>
      </div>
    </div>
  );
};
