import React from 'react';
import { Input, InputNumber } from 'antd';
import { FeesSlab, FeesSlabYear } from '@/types/fees';
import { Plus, Trash2 } from 'lucide-react';

interface SlabCreationProps {
  feesSlabYears: FeesSlabYear[];
  setFeesSlabYears: React.Dispatch<React.SetStateAction<FeesSlabYear[]>>;
  slabs: FeesSlab[];
  setSlabs: React.Dispatch<React.SetStateAction<FeesSlab[]>>;
  academicYearId: number | undefined;
}

export const SlabCreation: React.FC<SlabCreationProps> = ({
  feesSlabYears,
  setFeesSlabYears,
  slabs,
  setSlabs,
  academicYearId,
}) => {
  const handleSlabNameChange = (index: number, name: string) => {
    const updatedSlabs = [...slabs];
    updatedSlabs[index] = { ...updatedSlabs[index], name };
    setSlabs(updatedSlabs);
  };

  const handleConcessionChange = (slabId: number, concessionRate: number) => {
    const updatedSlabYears = [...feesSlabYears];
    const slabYearIndex = updatedSlabYears.findIndex(sy => sy.feesSlabId === slabId);
    if (slabYearIndex > -1) {
      updatedSlabYears[slabYearIndex] = { ...updatedSlabYears[slabYearIndex], feeConcessionRate: concessionRate };
      setFeesSlabYears(updatedSlabYears);
    }
  };

  const handleAddSlab = () => {
    const newSlab: FeesSlab = {
      id: Date.now(), // temporary id
      name: '',
      description: null,
      sequence: slabs.length + 1,
    };
    setSlabs([...slabs, newSlab]);

    if (academicYearId) {
        const newSlabYear: FeesSlabYear = {
          feesSlabId: newSlab.id!,
          academicYearId: academicYearId,
          feeConcessionRate: 0,
        };
        setFeesSlabYears([...feesSlabYears, newSlabYear]);
    }
  };

  const handleRemoveSlab = (slabIdToRemove: number) => {
    const slabToRemove = slabs.find(s => s.id === slabIdToRemove);
    if (!slabToRemove) return;

    setSlabs(slabs.filter(s => s.id !== slabIdToRemove));
    setFeesSlabYears(feesSlabYears.filter(sy => sy.feesSlabId !== slabIdToRemove));
  };
  
  const getConcessionRate = (slabId: number) => {
    return feesSlabYears.find(sy => sy.feesSlabId === slabId)?.feeConcessionRate ?? 0;
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex-grow overflow-auto pr-2 -mr-2">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                Seq
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Slab Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fee Concession Rate (%)
              </th>
              <th scope="col" className="relative px-6 py-3 w-20">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {slabs.map((slab, index) => (
              <tr key={slab.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Input
                    value={slab.name}
                    onChange={(e) => handleSlabNameChange(index, e.target.value)}
                    placeholder="e.g., Merit Based"
                    className="w-full"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <InputNumber
                    min={0}
                    max={100}
                    value={getConcessionRate(slab.id!)}
                    onChange={(value) => handleConcessionChange(slab.id!, value || 0)}
                    formatter={(value) => `${value}%`}
                    parser={(value) => Number(value?.replace('%', '') || '')}
                    className="w-40"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleRemoveSlab(slab.id!)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex-shrink-0 pt-4">
        <button
          onClick={handleAddSlab}
          className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-purple-600 bg-purple-100 border border-transparent rounded-md hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Slab
        </button>
      </div>
    </div>
  );
};
