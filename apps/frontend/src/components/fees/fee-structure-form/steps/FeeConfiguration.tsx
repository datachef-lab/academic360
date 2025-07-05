import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { FeesStructureDto, FeesComponent, FeesHead, FeesReceiptType, CreateFeesStructureDto } from "@/types/fees";
import { Select,  } from "antd";
// import dayjs from "dayjs";
import { Course } from "@/types/academics/course";
import { Shift } from "@/types/academics/shift";
import { Class as ClassType } from "@/types/academics/class";

type FeeConfigurationProps =
  | {
      formType: "ADD";
      feesStructure: CreateFeesStructureDto;
      setFeesStructure: React.Dispatch<React.SetStateAction<CreateFeesStructureDto>>;
      feeHeads: FeesHead[];
      courses: Course[];
      feesReceiptTypes: FeesReceiptType[];
      shifts: Shift[];
      existingFeeStructures?: FeesStructureDto[];
      classes: ClassType[];
    }
  | {
      formType: "EDIT";
      feesStructure: FeesStructureDto;
      setFeesStructure: React.Dispatch<React.SetStateAction<FeesStructureDto>>;
      feeHeads: FeesHead[];
      courses: Course[];
      feesReceiptTypes: FeesReceiptType[];
      shifts: Shift[];
      existingFeeStructures?: FeesStructureDto[];
      classes: ClassType[];
    };

export const FeeConfiguration: React.FC<FeeConfigurationProps> = (props) => {
  const { formType, feesStructure, setFeesStructure, feeHeads, feesReceiptTypes = [] } = props;
  const tbodyRef = useRef<HTMLTableSectionElement>(null);
  const setEmptyRows = useState(0)[1];
  const ROW_HEIGHT = 53; // Approximate height of a row in pixels
  // const MIN_ROWS = 8; // Set a minimum number of rows to display

  // Helper type guards
  const isAdd = formType === 'ADD';
  const isEdit = formType === 'EDIT';

  // Separate handlers for add/edit mode
  // const handleInputChangeAdd = (field: keyof CreateFeesStructureDto, value: unknown) => {
  //   (setFeesStructure as React.Dispatch<React.SetStateAction<CreateFeesStructureDto>>)((prev: CreateFeesStructureDto) => ({ ...prev, [field]: value }));
  // };
  const handleInputChangeEdit = (field: keyof FeesStructureDto, value: unknown) => {
    (setFeesStructure as React.Dispatch<React.SetStateAction<FeesStructureDto>>)((prev: FeesStructureDto) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    // Add 1 default fee component if the list is empty
    if (feesStructure.components.length === 0) {
      const defaultComponents: FeesComponent[] = Array.from({ length: 1 }, (_, i) => ({
        feesHeadId: 0,
        baseAmount: 0,
        sequence: i + 1,
        isConcessionApplicable: false,
        feesStructureId: feesStructure.id || 0,
        remarks: "",
      }));
      if (isAdd) {
        (setFeesStructure as React.Dispatch<React.SetStateAction<CreateFeesStructureDto>>)((prev: CreateFeesStructureDto) => ({ ...prev, components: defaultComponents as FeesComponent[] }));
      } else {
        (setFeesStructure as React.Dispatch<React.SetStateAction<FeesStructureDto>>)((prev: FeesStructureDto) => ({ ...prev, components: defaultComponents as FeesComponent[] }));
      }
    }
  }, []);

  useLayoutEffect(() => {
    if (tbodyRef.current) {
      const tbodyHeight = tbodyRef.current.offsetHeight;
      const numVisibleRows = Math.floor(tbodyHeight / ROW_HEIGHT);
      const newEmptyRows = Math.max(0, numVisibleRows - feesStructure.components.length);
      setEmptyRows(newEmptyRows);
    }
  }, [feesStructure.components.length]);

  // Fix: Only use 'course' for EDIT mode, and 'courses' for ADD mode
  // const existingCombinations = useMemo(() => {
  //   if (isEdit) {
  //     return existingFeeStructures
  //       .filter(
  //         (fs) =>
  //           fs.id !== (feesStructure as FeesStructureDto).id &&
  //           fs.academicYear?.id === (feesStructure as FeesStructureDto).academicYear?.id &&
  //           fs.course?.id === (feesStructure as FeesStructureDto).course?.id,
  //       )
  //       .map((fs) => ({ classId: fs.class?.id, shiftId: fs.shift?.id }));
  //   } else {
  //     // For ADD, we can't filter by course, so just filter by academicYear
  //     return existingFeeStructures
  //       .filter(
  //         (fs) =>
  //           fs.academicYear?.id === (feesStructure as CreateFeesStructureDto).academicYear?.id
  //       )
  //       .map((fs) => ({ classId: fs.class?.id, shiftId: fs.shift?.id }));
  //   }
  // }, [existingFeeStructures, feesStructure, isEdit]);

  // const availableShifts = useMemo(() => {
  //   if (!feesStructure.class?.id) {
  //     return shifts;
  //   }
  //   const takenShiftIds = existingCombinations
  //     .filter((c) => c.classId === feesStructure.class.id)
  //     .map((c) => c.shiftId);
  //   return shifts.filter((shift) => !takenShiftIds.includes(shift.id));
  // }, [feesStructure.class, shifts, existingCombinations]);

  // Use correct type for handleClassChange
  // const handleClassChange = (classId: number | null) => {
  //   const takenShiftIdsForNewClass = existingFeeStructures.filter((c) => c.class?.id === classId).map((c) => c.shift?.id);
  //   const isCurrentShiftAvailableInNewClass = !takenShiftIdsForNewClass.includes(feesStructure.shift?.id);
  //   if (classId) {
  //     if (isAdd) {
  //       (setFeesStructure as React.Dispatch<React.SetStateAction<CreateFeesStructureDto>>)((prev) => ({
  //         ...prev,
  //         class: classes.find((cls) => cls.id === classId)!,
  //         shift: isCurrentShiftAvailableInNewClass ? prev.shift : null,
  //       }));
  //     } else {
  //       (setFeesStructure as React.Dispatch<React.SetStateAction<FeesStructureDto>>)((prev) => ({
  //         ...prev,
  //         class: classes.find((cls) => cls.id === classId)!,
  //         shift: isCurrentShiftAvailableInNewClass ? prev.shift : null,
  //       }));
  //     }
  //   }
  // };

  // Use correct type for handleAddComponent
  const handleAddComponent = () => {
    const newComponent: FeesComponent = {
      sequence: feesStructure.components.length + 1,
      isConcessionApplicable: false,
      feesHeadId: 0,
      baseAmount: 0,
      remarks: "",
      feesStructureId: feesStructure.id || 0,
    };
    if (isAdd) {
      (setFeesStructure as React.Dispatch<React.SetStateAction<CreateFeesStructureDto>>)((prev) => ({
        ...prev,
        components: [...prev.components, newComponent],
      }));
    } else {
      (setFeesStructure as React.Dispatch<React.SetStateAction<FeesStructureDto>>)((prev) => ({
        ...prev,
        components: [...prev.components, newComponent],
      }));
    }
  };

  // Use correct type for handleRemoveComponent
  const handleRemoveComponent = (index: number) => {
    if (isAdd) {
      (setFeesStructure as React.Dispatch<React.SetStateAction<CreateFeesStructureDto>>)((prev: CreateFeesStructureDto) => ({
        ...prev,
        components: prev.components.filter((_: FeesComponent, i: number) => i !== index),
      }));
    } else {
      (setFeesStructure as React.Dispatch<React.SetStateAction<FeesStructureDto>>)((prev: FeesStructureDto) => ({
        ...prev,
        components: prev.components.filter((_: FeesComponent, i: number) => i !== index),
      }));
    }
  };

  // Use correct type for handleComponentChange
  const handleComponentChange = <K extends keyof Omit<FeesComponent, "id">>(
    index: number,
    field: K,
    value: FeesComponent[K],
  ) => {
    const newComponents = [...feesStructure.components];
    newComponents[index][field] = value;
    if (isAdd) {
      (setFeesStructure as React.Dispatch<React.SetStateAction<CreateFeesStructureDto>>)((prev: CreateFeesStructureDto) => ({ ...prev, components: newComponents }));
    } else {
      (setFeesStructure as React.Dispatch<React.SetStateAction<FeesStructureDto>>)((prev: FeesStructureDto) => ({ ...prev, components: newComponents }));
    }
  };

  const MIN_ROWS = 8;
  const totalAmount = feesStructure.components.reduce((sum, component) => sum + (component.baseAmount || 0), 0);

  useEffect(() => {
    const tableBody = document.querySelector(".table-body-fee-config");
    if (tableBody) {
      // const visibleRows = Math.floor(tableBody.clientHeight / ROW_HEIGHT);
      const dataRows = feesStructure.components.length;
      const calculatedEmptyRows = Math.max(0, MIN_ROWS - dataRows);
      setEmptyRows(calculatedEmptyRows);
    }
  }, [feesStructure.components.length]);

  // const disablePastDates = (current: dayjs.Dayjs) => current && current < dayjs().startOf("day");

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="space-y-6">
        {/* Top Row */}
        <div className="flex items-end justify-between gap-4">
          <div className="flex items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
              {isEdit && (
                <p className="w-48 px-3 py-1.5 border border-gray-300 rounded-md bg-gray-50 text-sm h-[38px] flex items-center">
                  {(feesStructure as FeesStructureDto).course?.name || "Not Selected"}
                </p>
              )}
              {isAdd && (
                <div className="flex flex-row flex-wrap gap-2 items-center">
                  {feesStructure.courses.map((c) => (
                    <span
                      key={c.id}
                      className="px-3 py-1 bg-purple-50 border border-purple-200 rounded-full text-sm font-medium text-purple-800 shadow-sm flex items-center gap-1"
                    >
                      {c.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <Select
                className="w-32"
                placeholder="Select Class"
                value={feesStructure.class?.id}
                onChange={handleClassChange}
              >
                {classes.map((cls) => (
                  <Select.Option key={cls.id} value={cls.id}>
                    {cls.name}
                  </Select.Option>
                ))}
              </Select>
            </div> */}
            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
              <Select
                value={feesStructure.shift?.id}
                onChange={(value) => handleInputChangeEdit("shift", shifts.find((s) => s.id === value) || null)}
                placeholder="Select Shift"
                className="w-full"
                disabled={!feesStructure.class}
              >
                {availableShifts.map((shift) => (
                  <Select.Option key={shift.id} value={shift.id!}>
                    {shift.name}
                  </Select.Option>
                ))}
              </Select>
            </div> */}
          </div>

          <div className="flex items-end gap-4">
            {/* Removed advance for fields */}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="flex items-end gap-9 justify-between">
          <div className="flex items-center gap-2">
            {/* Removed Fee Collection Start/End */}
          </div>

          <div className="flex justify-center gap-2 items-center">
            {/* Removed Installments */}
          </div>

          <div className="flex items-center gap-2">
            {/* Removed Online Start/End */}
          </div>
        </div>
      </div>

      {/* Fee Components Section */}
      <div className="flex-grow flex flex-col min-h-0">
        <div className="flex justify-between items-center mb-2 flex-shrink-0">
          {/* <h4 className="font-medium text-gray-900">Fee Components</h4> */}
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fees Receipt Type</label>
              <Select
                className="w-48"
                placeholder="Select"
                value={feesStructure.feesReceiptTypeId}
                onChange={(value) => handleInputChangeEdit("feesReceiptTypeId", value)}
              >
                {feesReceiptTypes.map((type) => (
                  <Select.Option key={type.id} value={type.id!}>
                    {type.name}
                  </Select.Option>
                ))}
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleAddComponent}
              className="flex border border-gray-400 items-center px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-md hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={feesStructure.components.length >= feeHeads.length}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Component
            </button>
          </div>
        </div>
        <div className="flex-grow overflow-hidden border border-gray-400 rounded-lg flex flex-col">
          <table className="min-w-full h-full flex flex-col">
            <thead className="flex-shrink-0">
              <tr className="flex">
                <th className="w-16 px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r border-gray-400">
                  Sr. No.
                </th>
                <th className="flex-1 px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r border-gray-400">
                  Fee Head
                </th>
                <th className="w-24 px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r border-gray-400">
                  Sequence
                </th>
                <th className="w-28 px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r border-gray-400">
                  Apply Concession?
                </th>
                <th className="w-32 px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r border-gray-400">
                  Amount
                </th>
                <th className="w-20 px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`flex-grow overflow-y-auto bg-white`}>
              {feesStructure.components.map((component, index) => (
                <tr key={component.sequence || index} className="flex h-[35px]">
                  <td className="w-16 px-4 py-2 border-r border-gray-400 text-sm text-black flex items-center justify-center">
                    {index + 1}.
                  </td>
                  <td className="flex-1 px-4 py-2 border-r border-gray-400">
                    <Select
                      value={component.feesHeadId || null}
                      onChange={(value) => handleComponentChange(index, "feesHeadId", value)}
                      placeholder="Select Fee Head"
                      className="w-full"
                      showSearch
                      optionFilterProp="children"
                      bordered={false}
                    >
                      {feeHeads
                        .filter((head) =>
                          // Show this head if it's not selected in any other component, or if it's the current value for this row
                          !feesStructure.components.some((c, i) => i !== index && c.feesHeadId === head.id)
                        )
                        .map((head) => (
                          <Select.Option key={head.id} value={head.id!}>
                            {head.name}
                          </Select.Option>
                        ))}
                    </Select>
                  </td>
                  <td className="w-24 px-4 py-2 border-r border-gray-400 flex items-center justify-center">
                    <input
                      type="number"
                      value={component.sequence}
                      onChange={(e) => handleComponentChange(index, "sequence", Number(e.target.value))}
                      className="w-20 text-center bg-transparent px-2 py-1 border border-transparent hover:border-gray-400 focus:border-purple-500 focus:ring-0 focus:outline-none rounded-md text-sm text-black"
                    />
                  </td>
                  <td className="w-28 px-4 py-2 border-r border-gray-400 text-center flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={component.isConcessionApplicable}
                      onChange={(e) => handleComponentChange(index, "isConcessionApplicable", e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="w-32 px-4 py-2 border-r border-gray-400 flex items-center">
                    <span className="text-gray-900">₹</span>
                    <input
                      type="number"
                      value={component.baseAmount}
                      onChange={(e) => handleComponentChange(index, "baseAmount", Number(e.target.value))}
                      className="w-24 ml-1 bg-transparent px-2 py-1 border border-transparent hover:border-gray-400 focus:border-purple-500 focus:ring-0 focus:outline-none rounded-md text-sm text-black"
                    />
                  </td>
                  <td className="w-20 px-4 py-2 text-center border-gray-400 flex items-center justify-center">
                    <button onClick={() => handleRemoveComponent(index)} className="text-red-600 hover:text-red-900">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {Array.from({ length: Math.max(0, MIN_ROWS - feesStructure.components.length) }).map((_, index) => (
                <tr key={`empty-${index}`} className="flex h-[53px]">
                  <td className="w-16 border-r border-gray-400"></td>
                  <td className="flex-1 border-r border-gray-400"></td>
                  <td className="w-24 border-r border-gray-400"></td>
                  <td className="w-28 border-r border-gray-400"></td>
                  <td className="w-32 border-r border-gray-400"></td>
                  <td className="w-20"></td>
                </tr>
              ))}
            </tbody>
            <tfoot className="flex-shrink-0">
              <tr className="flex bg-gray-50">
                <td className="flex-1 px-4 py-2 border-t border-r border-gray-400 text-right font-bold text-gray-900">
                  Total
                </td>
                <td className="w-32 px-4 py-2 border-t border-r border-gray-400 font-bold text-gray-900">
                  ₹ {totalAmount.toLocaleString()}
                </td>
                <td className="w-20 px-4 py-2 border-t border-gray-400"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FeeConfiguration;
