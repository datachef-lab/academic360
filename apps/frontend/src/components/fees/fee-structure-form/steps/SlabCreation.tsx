import React, { useEffect, useState } from "react";
import { InputNumber, Select } from "antd";
import { FeesSlab, FeesSlabYear } from "@/types/fees";
import { Plus, Trash2 } from "lucide-react";

interface SlabCreationProps {
  feesSlabYears: FeesSlabYear[];
  setFeesSlabYears: React.Dispatch<React.SetStateAction<FeesSlabYear[]>>;
  slabs: FeesSlab[];
  // setSlabs: React.Dispatch<React.SetStateAction<FeesSlab[]>>;
  academicYearId: number | undefined;
  // slabYearMappings?: FeesSlabYear[];
}

export const SlabCreation: React.FC<SlabCreationProps> = ({
  feesSlabYears,
  setFeesSlabYears,
  slabs,
  // setSlabs,
  academicYearId,
  // slabYearMappings = [],
}) => {
  const [slabOptions, setSlabOptions] = useState<FeesSlab[]>([]);

  useEffect(() => {
    // Only show slabs not already used in feesSlabYears
    const tmpSlabOptions = slabs.filter(
      (slb) => !feesSlabYears.some((ele) => ele.feesSlabId === slb.id)
    );
    setSlabOptions(tmpSlabOptions);
  }, [slabs, feesSlabYears]);

  // useEffect(() => {
  //   if (slabYearMappings.length && slabs.length && academicYearId) {
  //     const updatedFeesSlabYears = slabs.map(slab => {
  //       const mapping = slabYearMappings.find(
  //         m => m.feesSlabId === slab.id && m.academicYearId === academicYearId
  //       );
  //       return {
  //         feesSlabId: slab.id!,
  //         academicYearId: academicYearId,
  //         feeConcessionRate: mapping ? mapping.feeConcessionRate : 0,
  //       };
  //     });
  //     setFeesSlabYears(updatedFeesSlabYears);
  //   }
  // }, [slabYearMappings, slabs, academicYearId, setFeesSlabYears]);

  const handleSlabChange = (index: number, selectedSlabId: number) => {
    // const selectedSlab = slabOptions.find(option => option.id === selectedSlabId);
    // if (!selectedSlab) return;

    // const updatedSlabs = [...slabs];
    // const oldSlabId = updatedSlabs[index].id;
    // updatedSlabs[index] = { ...selectedSlab };
    // setSlabs(updatedSlabs);

    // if (oldSlabId) {
    //     const updatedFeesSlabYears = [...feesSlabYears];
    //     const slabYearIndex = updatedFeesSlabYears.findIndex(sy => sy.feesSlabId === oldSlabId);
    //     if (slabYearIndex > -1) {
    //       updatedFeesSlabYears[slabYearIndex] = { ...updatedFeesSlabYears[slabYearIndex], feesSlabId: selectedSlab.id! };
    //       setFeesSlabYears(updatedFeesSlabYears);
    //     }
    // }

    const updatedFeesSlabYears = feesSlabYears.map((ele, idx) => {
      if (idx === index) {
        return { ...ele, feesSlabId: selectedSlabId };
      }
      return ele;
    });

    setFeesSlabYears(updatedFeesSlabYears);

    const tmpSlabOptions = slabs.filter((slb) => !feesSlabYears.find((ele) => ele.feesSlabId != slb.id));
    setSlabOptions(tmpSlabOptions);
  };

  const handleConcessionChange = (slabId: number, concessionRate: number) => {
    const updatedSlabYears = [...feesSlabYears];
    const slabYearIndex = updatedSlabYears.findIndex((sy) => sy.feesSlabId === slabId);
    if (slabYearIndex > -1) {
      updatedSlabYears[slabYearIndex] = { ...updatedSlabYears[slabYearIndex], feeConcessionRate: concessionRate };
      setFeesSlabYears(updatedSlabYears);
    }
  };

  const handleAddSlab = () => {
    if (slabOptions.length === 0) {
      return;
    }
    const newSlabYear: FeesSlabYear = {
      id: Date.now(),
      academicYearId: academicYearId!,
      feesSlabId: slabOptions[0].id!,
      feeConcessionRate: 0,
    };
    setFeesSlabYears([...feesSlabYears, newSlabYear]);
  };

  const handleRemoveSlab = (slabIdToRemove: number) => {
    const removeIndex = feesSlabYears.findIndex((s) => s.feesSlabId === slabIdToRemove);
    if (removeIndex < 0) return;

    const updatedFeesSlabYears = feesSlabYears.filter((_ele, index) => index != removeIndex);

    const updatedSlabOptions = slabOptions.filter(ele => !updatedFeesSlabYears.find(x => x.feesSlabId == ele.id));


    setFeesSlabYears(updatedFeesSlabYears);
    setSlabOptions(updatedSlabOptions);
  };

  const getConcessionRate = (slabId: number) => {
    return feesSlabYears.find((sy) => sy.feesSlabId === slabId)?.feeConcessionRate ?? 0;
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex-grow overflow-auto pr-2 -mr-2">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20"
              >
                Seq
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Slab Name
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Fee Concession Rate (%)
              </th>
              <th scope="col" className="relative px-6 py-3 w-20">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {feesSlabYears.map((feesSlabYear, index) => (
              <tr key={`${feesSlabYear.id}-${index}`}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Select
                    value={feesSlabYear.feesSlabId}
                    onChange={(value) => handleSlabChange(index, value)}
                    placeholder="Select Fee Slab"
                    className="w-full"
                    showSearch
                    optionFilterProp="children"
                  >
                    {slabs.map((option) => (
                      <Select.Option key={option.id} value={option.id!}>
                        {option.name}
                      </Select.Option>
                    ))}
                  </Select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <InputNumber
                    min={0}
                    max={100}
                    value={getConcessionRate(feesSlabYear.feesSlabId)}
                    onChange={(value) => handleConcessionChange(feesSlabYear.feesSlabId!, value || 0)}
                    formatter={(value) => `${value}%`}
                    parser={(value) => Number(value?.replace("%", "") || "")}
                    className="w-40"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleRemoveSlab(feesSlabYear.feesSlabId!)} className="text-red-600 hover:text-red-900">
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
