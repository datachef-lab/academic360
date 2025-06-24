import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { FeesStructureDto, FeesComponent, FeesHead, FeesReceiptType } from "@/types/fees";
import { DatePicker, Select, InputNumber } from "antd";
import dayjs from "dayjs";
import { Course } from "@/types/academics/course";

interface FeeConfigurationProps {
  feesStructure: FeesStructureDto;
  setFeesStructure: React.Dispatch<React.SetStateAction<FeesStructureDto>>;
  feeHeads: FeesHead[];
  courses: Course[];
  feesReceiptTypes: FeesReceiptType[];
}

export const FeeConfiguration: React.FC<FeeConfigurationProps> = ({
  feesStructure,
  setFeesStructure,
  feeHeads,
  courses,
  feesReceiptTypes,
}) => {
  const tbodyRef = useRef<HTMLTableSectionElement>(null);
  const setEmptyRows = useState(0)[1];
  const ROW_HEIGHT = 53; // Approximate height of a row in pixels
  // const MIN_ROWS = 8; // Set a minimum number of rows to display

  useEffect(() => {
    // Add 1 default fee component if the list is empty
    if (feesStructure.components.length === 0) {
      const defaultComponents = Array.from({ length: 1 }, (_, i) => ({
        feesHeadId: 0,
        amount: 0,
        sequence: i + 1,
        isConcessionApplicable: false,
        feesStructureId: feesStructure.id || 0,
        remarks: "",
        severity: "low",
      }));
      setFeesStructure(prev => ({ ...prev, components: defaultComponents as FeesComponent[] }));
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

  const handleInputChange = (field: keyof FeesStructureDto, value: unknown) => {
    setFeesStructure(prev => ({ ...prev, [field]: value }));
  };

  // const handleDateChange = (
  //   field: keyof FeesStructureDto,
  //   value: string
  // ) => {
  //   setFeesStructure((prev: FeesStructureDto) => ({
  //     ...prev,
  //     [field]: new Date(value),
  //   }));
  // };

  // const formatDateForInput = (date: Date | null | undefined) => {
  //   if (!date) return "";
  //   return new Date(date).toISOString().split("T")[0];
  // };

  const handleAddComponent = () => {
    const newComponent: FeesComponent = {
      sequence: feesStructure.components.length + 1,
      isConcessionApplicable: false,
      feesHeadId: 0,
      amount: 0,
      remarks: "",
      feesStructureId: feesStructure.id || 0,
    };
    setFeesStructure((prev: FeesStructureDto) => ({
      ...prev,
      components: [...prev.components, newComponent],
    }));
  };

  const handleRemoveComponent = (index: number) => {
    setFeesStructure((prev: FeesStructureDto) => ({
      ...prev,
      components: prev.components.filter((_: FeesComponent, i: number) => i !== index),
    }));
  };

  const handleComponentChange = <K extends keyof Omit<FeesComponent, "id">>(
    index: number,
    field: K,
    value: FeesComponent[K],
  ) => {
    const newComponents = [...feesStructure.components];
    newComponents[index][field] = value;
    setFeesStructure({ ...feesStructure, components: newComponents });
  };

  const MIN_ROWS = 8;
  const totalAmount = feesStructure.components.reduce((sum, component) => sum + (component.amount || 0), 0);

  useEffect(() => {
    const tableBody = document.querySelector('.table-body-fee-config');
    if (tableBody) {
      // const visibleRows = Math.floor(tableBody.clientHeight / ROW_HEIGHT);
      const dataRows = feesStructure.components.length;
      const calculatedEmptyRows = Math.max(0, MIN_ROWS - dataRows);
      setEmptyRows(calculatedEmptyRows);
    }
  }, [feesStructure.components.length]);

  // const generateEmptyRows = (count: number) => {
  //   return Array.from({ length: count }, (_, i) => ({
  //     id: `empty-${i}`,
  //     feesHead: { id: '', name: '' },
  //     amount: 0,
  //     sequence: feesStructure.components.length + i + 1,
  //     isConcessionApplicable: false,
  //     feesStructureId: feesStructure.id || 0,
  //     remarks: "",
  //   }));
  // };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="space-y-6">
        {/* Top Row */}
        <div className="flex items-end justify-between gap-4">
          <div className="flex items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Closing Date</label>
              <DatePicker
                value={feesStructure.closingDate ? dayjs(feesStructure.closingDate) : null}
                onChange={(date) => handleInputChange('closingDate', date ? date.toDate() : null)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
              <p className="w-48 px-3 py-1.5 border border-gray-300 rounded-md bg-gray-50 text-sm h-[38px] flex items-center">{feesStructure.course?.name || 'Not Selected'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
              <Select
                className="w-32"
                placeholder="Select"
                value={feesStructure.semester}
                onChange={(value) => handleInputChange('semester', value)}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                  <Select.Option key={sem} value={sem}>
                    Sem {sem}
                  </Select.Option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
              <Select
                className="w-48"
                placeholder="Select"
                value={feesStructure.shift}
                onChange={(value) => handleInputChange('shift', value)}
              >
                <Select.Option key={"MORNING"} value={"MORNING"}>MORNING</Select.Option>
                <Select.Option key={"EVENING"} value={"EVENING"}>EVENING</Select.Option>
              </Select>
            </div>
          </div>
          
          <div className="flex items-end gap-4">
            <div className="pl-4">
              <p className="text-sm font-medium text-gray-700 mb-1">To be treated as advance for:</p>
              <div className="flex items-center gap-4">
                <Select
                  className="w-32"
                  placeholder="Adv. Course"
                  value={feesStructure.advanceForCourse?.id}
                  onChange={(value) => handleInputChange('advanceForCourse', courses.find(c => c.id === value))}
                >
                  {courses.map(course => (
                    <Select.Option key={course.id} value={course.id!}>
                      {course.name}
                    </Select.Option>
                  ))}
                </Select>
                <Select
                  className="w-32"
                  placeholder="Adv. Semester"
                  value={feesStructure.advanceForSemester}
                  onChange={(value) => handleInputChange('advanceForSemester', value)}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                    <Select.Option key={sem} value={sem}>
                      Sem {sem}
                    </Select.Option>
                  ))}
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="flex items-end gap-9 justify-between">
          <div className="flex items-center gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fee Collection Start</label>
              <DatePicker
                className="w-full"
                value={feesStructure.startDate ? dayjs(feesStructure.startDate) : null}
                onChange={(date) => handleInputChange('startDate', date ? date.toDate() : null)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fee Collection End</label>
              <DatePicker
                className="w-full"
                value={feesStructure.endDate ? dayjs(feesStructure.endDate) : null}
                onChange={(date) => handleInputChange('endDate', date ? date.toDate() : null)}
              />
            </div>
            <div>

            </div>
          </div>





          <div className="flex justify-center gap-2 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Installments</label>
              <InputNumber
                className="w-[100px]"
                min={1}
                max={12}
                value={feesStructure.numberOfInstalments}
                onChange={(value) => handleInputChange('numberOfInstalments', value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Installments Start</label>
              <DatePicker
                className="w-full"
                value={feesStructure.instalmentStartDate ? dayjs(feesStructure.instalmentStartDate) : null}
                onChange={(date) => handleInputChange('instalmentStartDate', date ? date.toDate() : null)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Installments End</label>
              <DatePicker
                className="w-full"
                value={feesStructure.instalmentEndDate ? dayjs(feesStructure.instalmentEndDate) : null}
                onChange={(date) => handleInputChange('instalmentEndDate', date ? date.toDate() : null)}
              />
            </div>
          </div>



          <div className="flex items-center gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Online Start</label>
              <DatePicker
                className="w-full"
                value={feesStructure.onlineStartDate ? dayjs(feesStructure.onlineStartDate) : null}
                onChange={(date) => handleInputChange('onlineStartDate', date ? date.toDate() : null)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Online End</label>
              <DatePicker
                className="w-full"
                value={feesStructure.onlineEndDate ? dayjs(feesStructure.onlineEndDate) : null}
                onChange={(date) => handleInputChange('onlineEndDate', date ? date.toDate() : null)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Fee Components Section */}
      <div className="flex-grow flex flex-col min-h-0">
        <div className="flex justify-between items-center mb-2 flex-shrink-0">
          {/* <h4 className="font-medium text-gray-900">Fee Components</h4> */}
          <div className="flex items-baseline gap-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Fees Receipt Type</label>
            <Select className="w-40" placeholder="Select Type">
              {feesReceiptTypes.map(rt => <Select.Option key={rt.id} value={rt.id}>{rt.name}</Select.Option>)}
            </Select>
          </div>



          <div className="flex items-center gap-4">
            <button onClick={handleAddComponent} className="flex border border-gray-400 items-center px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-md hover:bg-purple-100">
              <Plus className="h-4 w-4 mr-1" />
              Add Component
            </button>
          </div>
        </div>
        <div className="flex-grow overflow-hidden border border-gray-400 rounded-lg flex flex-col">
          <table className="min-w-full h-full flex flex-col">
            <thead className="flex-shrink-0">
              <tr className="flex">
                <th className="w-16 px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r border-gray-400">Sr. No.</th>
                <th className="flex-1 px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r border-gray-400">Fee Head</th>
                <th className="w-24 px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r border-gray-400">Sequence</th>
                <th className="w-28 px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r border-gray-400">Apply Concession?</th>
                <th className="w-32 px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r border-gray-400">Amount</th>
                <th className="w-20 px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className={`flex-grow overflow-y-auto bg-white`}>
              {feesStructure.components.map((component, index) => (
                <tr key={component.sequence || index} className="flex h-[35px]">
                  <td className="w-16 px-4 py-2 border-r border-gray-400 text-sm text-black flex items-center justify-center">{index + 1}.</td>
                  <td className="flex-1 px-4 py-2 border-r border-gray-400">
                    <select value={component.feesHeadId} onChange={(e) => handleComponentChange(index, "feesHeadId", Number(e.target.value))} className="w-full bg-transparent px-2 py-1 border border-transparent hover:border-gray-400 focus:border-purple-500 focus:ring-0 focus:outline-none rounded-md text-sm text-black">
                      <option value={0}>Select Fee Head</option>
                      {feeHeads.map((head) => (<option key={head.id} value={head.id}>{head.name}</option>))}
                    </select>
                  </td>
                  <td className="w-24 px-4 py-2 border-r border-gray-400 flex items-center justify-center">
                    <input type="number" value={component.sequence} onChange={(e) => handleComponentChange(index, "sequence", Number(e.target.value))} className="w-20 text-center bg-transparent px-2 py-1 border border-transparent hover:border-gray-400 focus:border-purple-500 focus:ring-0 focus:outline-none rounded-md text-sm text-black" />
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
                    <input type="number" value={component.amount} onChange={(e) => handleComponentChange(index, "amount", Number(e.target.value))} className="w-24 ml-1 bg-transparent px-2 py-1 border border-transparent hover:border-gray-400 focus:border-purple-500 focus:ring-0 focus:outline-none rounded-md text-sm text-black" />
                  </td>
                  <td className="w-20 px-4 py-2 text-center border-gray-400 flex items-center justify-center">
                    <button onClick={() => handleRemoveComponent(index)} className="text-red-600 hover:text-red-900"><Trash2 className="h-5 w-5" /></button>
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
                <td className="flex-1 px-4 py-2 border-t border-r border-gray-400 text-right font-bold text-gray-900">Total</td>
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
