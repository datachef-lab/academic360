import React from "react";
import { Plus, Trash2 } from "lucide-react";

interface SlabCreationProps {
  data: Array<{
    id: number;
    slabType: string;
    concessionPercentage: number;
  }>;
  onChange: (data: SlabCreationProps["data"]) => void;
}

export const SlabCreation: React.FC<SlabCreationProps> = ({ data, onChange }) => {
  const handleAddSlab = () => {
    onChange([
      ...data,
      {
        id: data.length + 1,
        slabType: "",
        concessionPercentage: 0,
      },
    ]);
  };

  const handleRemoveSlab = (id: number) => {
    onChange(data.filter((slab) => slab.id !== id));
  };

  const handleSlabChange = (id: number, field: "slabType" | "concessionPercentage", value: string | number) => {
    onChange(
      data.map((slab) =>
        slab.id === id
          ? {
              ...slab,
              [field]: field === "concessionPercentage" ? Number(value) : value,
            }
          : slab,
      ),
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Slab Creation</h3>
        <p className="text-sm text-gray-600 mb-6">Define concession slabs and their percentages</p>
      </div>

      <div className="space-y-4">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sr. No.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slab Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Concession %
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((slab, index) => (
                <tr key={slab.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={slab.slabType}
                      onChange={(e) => handleSlabChange(slab.id, "slabType", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm text-black focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">Select Slab Type</option>
                      <option value="merit">Merit Based</option>
                      <option value="income">Income Based</option>
                      <option value="sibling">Sibling Discount</option>
                      <option value="staff">Staff Ward</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={slab.concessionPercentage}
                      onChange={(e) => handleSlabChange(slab.id, "concessionPercentage", e.target.value)}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm text-black focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button onClick={() => handleRemoveSlab(slab.id)} className="text-red-600 hover:text-red-900">
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
            onClick={handleAddSlab}
            className="flex items-center px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-md hover:bg-purple-100"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Slab
          </button>
        </div>
      </div>
    </div>
  );
};
