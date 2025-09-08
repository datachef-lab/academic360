import React, { useEffect, useState } from "react";
import { InputNumber, Select } from "antd";
import { FeesSlab, FeesSlabMapping, FeesStructureDto, CreateFeesStructureDto } from "@/types/fees";
import { Plus, Trash2 } from "lucide-react";

// Type predicate to distinguish CreateFeesStructureDto
function isCreateFeesStructureDto(obj: CreateFeesStructureDto | FeesStructureDto): obj is CreateFeesStructureDto {
  return "courses" in obj && Array.isArray((obj as CreateFeesStructureDto).courses);
}

type SlabCreationProps<T extends CreateFeesStructureDto | FeesStructureDto> = {
  feesSlabMappings: FeesSlabMapping[];
  setFormFeesStructure: React.Dispatch<React.SetStateAction<T>>;
  slabs: FeesSlab[];
};

export function SlabCreation<T extends CreateFeesStructureDto | FeesStructureDto>({
  feesSlabMappings,
  setFormFeesStructure,
  slabs,
}: SlabCreationProps<T>) {
  const [slabOptions, setSlabOptions] = useState<FeesSlab[]>([]);

  // DEBUG: Log slabs and mappings on every render
  console.log("SlabCreation slabs:", slabs);
  console.log("SlabCreation feesSlabMappings:", feesSlabMappings);

  // Remove default population useEffect here
  useEffect(() => {
    // Only show slabs not already used in feesSlabMappings
    const tmpSlabOptions = slabs.filter((slb) => !feesSlabMappings.some((ele) => ele.feesSlabId === slb.id));
    setSlabOptions(tmpSlabOptions);
  }, [slabs, feesSlabMappings]);

  // useEffect(() => {
  //   if (slabYearMappings.length && slabs.length && academicYearId) {
  //     const updatedFeesSlabMappings = slabs.map(slab => {
  //       const mapping = slabYearMappings.find(
  //         m => m.feesSlabId === slab.id && m.academicYearId === academicYearId
  //       );
  //       return {
  //         feesSlabId: slab.id!,
  //         academicYearId: academicYearId,
  //         feeConcessionRate: mapping ? mapping.feeConcessionRate : 0,
  //       };
  //     });
  //     setFeesSlabMappings(updatedFeesSlabMappings);
  //   }
  // }, [slabYearMappings, slabs, academicYearId, setFeesSlabMappings]);

  const handleSlabChange = (index: number, selectedSlabId: number) => {
    const updatedFeesSlabMappings = feesSlabMappings.map((ele, idx) => {
      if (idx === index) {
        return { ...ele, feesSlabId: selectedSlabId };
      }
      return ele;
    });
    setFormFeesStructure((prev: T) => {
      if (isCreateFeesStructureDto(prev)) {
        return {
          ...prev,
          feesSlabMappings: updatedFeesSlabMappings,
        } as T;
      } else {
        return {
          ...prev,
          feesSlabMappings: updatedFeesSlabMappings,
        } as T;
      }
    });
    const tmpSlabOptions = slabs.filter((slb) => !feesSlabMappings.find((ele) => ele.feesSlabId != slb.id));
    setSlabOptions(tmpSlabOptions);
  };

  const handleConcessionChange = (slabId: number, concessionRate: number) => {
    const updatedSlabMappings = [...feesSlabMappings];
    const slabMappingIndex = updatedSlabMappings.findIndex((sy) => sy.feesSlabId === slabId);
    if (slabMappingIndex > -1) {
      updatedSlabMappings[slabMappingIndex] = {
        ...updatedSlabMappings[slabMappingIndex],
        feeConcessionRate: concessionRate,
        feesStructureId: updatedSlabMappings[slabMappingIndex]?.feesStructureId || 0,
        feesSlabId: updatedSlabMappings[slabMappingIndex]?.feesSlabId || 0,
      };
      setFormFeesStructure((prev: T) => {
        if (isCreateFeesStructureDto(prev)) {
          return {
            ...prev,
            feesSlabMappings: updatedSlabMappings,
          } as T;
        } else {
          return {
            ...prev,
            feesSlabMappings: updatedSlabMappings,
          } as T;
        }
      });
    }
  };

  const handleAddSlab = () => {
    if (slabOptions.length === 0) {
      return;
    }
    // Add the first available missing slab
    const missingSlab = slabOptions[0];
    if (!missingSlab) return;

    const newSlabMapping: FeesSlabMapping = {
      id: Date.now(),
      feesSlabId: missingSlab.id!,
      feesStructureId: 0, // Placeholder, update as needed
      feeConcessionRate: 0,
    };
    setFormFeesStructure((prev: T) => {
      if (isCreateFeesStructureDto(prev)) {
        return {
          ...prev,
          feesSlabMappings: [...feesSlabMappings, newSlabMapping],
        } as T;
      } else {
        return {
          ...prev,
          feesSlabMappings: [...feesSlabMappings, newSlabMapping],
        } as T;
      }
    });
  };

  const handleRemoveSlab = (slabIdToRemove: number) => {
    const removeIndex = feesSlabMappings.findIndex((s) => s.feesSlabId === slabIdToRemove);
    if (removeIndex < 0) return;

    const updatedFeesSlabMappings = feesSlabMappings.filter((_ele, index) => index != removeIndex);

    const updatedSlabOptions = slabOptions.filter(
      (ele) => !updatedFeesSlabMappings.find((x) => x.feesSlabId == ele.id),
    );

    setFormFeesStructure((prev: T) => {
      if (isCreateFeesStructureDto(prev)) {
        return {
          ...prev,
          feesSlabMappings: updatedFeesSlabMappings,
        } as T;
      } else {
        return {
          ...prev,
          feesSlabMappings: updatedFeesSlabMappings,
        } as T;
      }
    });

    setSlabOptions(updatedSlabOptions);
  };

  const getConcessionRate = (slabId: number) => {
    return feesSlabMappings.find((sy) => sy.feesSlabId === slabId)?.feeConcessionRate ?? 0;
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
            {feesSlabMappings.map((feesSlabMapping, index) => (
              <tr key={`${feesSlabMapping.id}-${index}`}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Select
                    value={feesSlabMapping.feesSlabId}
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
                    value={getConcessionRate(feesSlabMapping.feesSlabId)}
                    onChange={(value) => handleConcessionChange(feesSlabMapping.feesSlabId!, value || 0)}
                    formatter={(value) => `${value}%`}
                    parser={(value) => Number(value?.replace("%", "") || "")}
                    className="w-40"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleRemoveSlab(feesSlabMapping.feesSlabId!)}
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
}
