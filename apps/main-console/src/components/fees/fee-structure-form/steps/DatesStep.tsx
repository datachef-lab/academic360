import React from "react";
import { DatePicker, InputNumber, Table, Switch } from "antd";
import dayjs from "dayjs";
import { FeesStructureDto, CreateFeesStructureDto } from "@/types/fees";
import { CloseCircleTwoTone, CheckCircleTwoTone } from "@ant-design/icons";

type DatesStepProps =
  | {
      formType: "ADD";
      feesStructure: CreateFeesStructureDto;
      setFeesStructure: React.Dispatch<React.SetStateAction<CreateFeesStructureDto>>;
    }
  | {
      formType: "EDIT";
      feesStructure: FeesStructureDto;
      setFeesStructure: React.Dispatch<React.SetStateAction<FeesStructureDto>>;
    };

type InstalmentT =
  | NonNullable<FeesStructureDto["instalments"]>[number]
  | NonNullable<CreateFeesStructureDto["instalments"]>[number];

export const DatesStep: React.FC<DatesStepProps> = (props) => {
  const { formType, feesStructure, setFeesStructure } = props;
  const isAdd = formType === "ADD";

  // Handlers for updating fields
  const handleInputChangeAdd = (field: keyof CreateFeesStructureDto, value: unknown) => {
    (setFeesStructure as React.Dispatch<React.SetStateAction<CreateFeesStructureDto>>)((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  const handleInputChangeEdit = (field: keyof FeesStructureDto, value: unknown) => {
    (setFeesStructure as React.Dispatch<React.SetStateAction<FeesStructureDto>>)((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const disablePastDates = (current: dayjs.Dayjs) => current && current < dayjs().startOf("day");

  // State for installments toggle
  const hasInstallments = Boolean(feesStructure.numberOfInstalments && feesStructure.numberOfInstalments === 2);

  // Handler for installments toggle
  const handleInstallmentsToggle = (checked: boolean) => {
    if (!checked) {
      // Reset installments if toggled off
      if (isAdd) {
        handleInputChangeAdd("numberOfInstalments", 1);
        handleInputChangeAdd("instalments", []);
      } else {
        handleInputChangeEdit("numberOfInstalments", 1);
        handleInputChangeEdit("instalments", []);
      }
    } else {
      if (isAdd) {
        handleInputChangeAdd("numberOfInstalments", 2);
        handleInputChangeAdd("instalments", [
          {
            instalmentNumber: 1,
            baseAmount: 0,
            startDate: null,
            endDate: null,
            onlineStartDate: null,
            onlineEndDate: null,
            feesStructureId: 0,
          },
          {
            instalmentNumber: 2,
            baseAmount: 0,
            startDate: null,
            endDate: null,
            onlineStartDate: null,
            onlineEndDate: null,
            feesStructureId: 0,
          },
        ]);
      } else {
        handleInputChangeEdit("numberOfInstalments", 2);
        handleInputChangeEdit("instalments", [
          {
            instalmentNumber: 1,
            baseAmount: 0,
            startDate: null,
            endDate: null,
            onlineStartDate: null,
            onlineEndDate: null,
            feesStructureId: 0,
          },
          {
            instalmentNumber: 2,
            baseAmount: 0,
            startDate: null,
            endDate: null,
            onlineStartDate: null,
            onlineEndDate: null,
            feesStructureId: 0,
          },
        ]);
      }
    }
  };

  // Handlers for installment table
  const handleInstalmentChange = (index: number, field: string, value: unknown) => {
    const newInstalments = [...(feesStructure.instalments || [])];
    newInstalments[index] = {
      ...newInstalments[index],
      [field]: value,
      feesStructureId: newInstalments[index]?.feesStructureId || 0,
    } as InstalmentT;
    if (isAdd) {
      handleInputChangeAdd("instalments", newInstalments);
    } else {
      handleInputChangeEdit("instalments", newInstalments);
    }
  };

  // No add/remove for exactly 2 installments
  // const handleRemoveInstalment = (index: number) => {
  //   // Do nothing or optionally clear the row
  // };

  // Calculate total base amount from fees configuration
  const totalBaseAmount = (feesStructure.components || []).reduce((sum, c) => sum + (c.baseAmount || 0), 0);
  const totalInstalmentAmount = (feesStructure.instalments || []).reduce((sum, i) => sum + (i.baseAmount || 0), 0);
  const showInstalmentWarning = hasInstallments && totalBaseAmount !== totalInstalmentAmount;

  // Smart auto-fill for 2 installments
  const handleSmartInstalmentAmount = (index: number, value: string | number | null | undefined) => {
    if (!hasInstallments || !feesStructure.instalments) return handleInstalmentChange(index, "baseAmount", value);
    // Prevent non-numeric input and leading zeros
    let numericValue = typeof value === "string" ? value.replace(/[^0-9]/g, "").replace(/^0+(?!$)/, "") : value;
    // If empty, treat as zero
    if (numericValue === "" || numericValue === null || numericValue === undefined) numericValue = 0;
    numericValue = Number(numericValue) || 0;
    // (No clamping here, allow unknown value)
    const newInstalments = [...feesStructure.instalments];
    newInstalments[index] = {
      ...newInstalments[index],
      baseAmount: numericValue,
      feesStructureId: newInstalments[index]?.feesStructureId ?? 0,
      instalmentNumber: newInstalments[index]?.instalmentNumber ?? index + 1,
    } as InstalmentT;
    if (isAdd) {
      handleInputChangeAdd("instalments", newInstalments);
    } else {
      handleInputChangeEdit("instalments", newInstalments);
    }
  };

  // For disabling Next button, expose a flag
  const isInstalmentTotalValid = !hasInstallments || totalBaseAmount === totalInstalmentAmount;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Closing Date</label>
          <DatePicker
            value={feesStructure.closingDate ? dayjs(feesStructure.closingDate) : null}
            onChange={(date) =>
              isAdd
                ? handleInputChangeAdd("closingDate", date ? date.toDate() : null)
                : handleInputChangeEdit("closingDate", date ? date.toDate() : null)
            }
            disabledDate={disablePastDates}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fee Collection Start</label>
          <DatePicker
            value={feesStructure.startDate ? dayjs(feesStructure.startDate) : null}
            onChange={(date) =>
              isAdd
                ? handleInputChangeAdd("startDate", date ? date.toDate() : null)
                : handleInputChangeEdit("startDate", date ? date.toDate() : null)
            }
            disabledDate={disablePastDates}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fee Collection End</label>
          <DatePicker
            value={feesStructure.endDate ? dayjs(feesStructure.endDate) : null}
            onChange={(date) =>
              isAdd
                ? handleInputChangeAdd("endDate", date ? date.toDate() : null)
                : handleInputChangeEdit("endDate", date ? date.toDate() : null)
            }
            disabledDate={disablePastDates}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Online Start</label>
          <DatePicker
            value={feesStructure.onlineStartDate ? dayjs(feesStructure.onlineStartDate) : null}
            onChange={(date) =>
              isAdd
                ? handleInputChangeAdd("onlineStartDate", date ? date.toDate() : null)
                : handleInputChangeEdit("onlineStartDate", date ? date.toDate() : null)
            }
            disabledDate={disablePastDates}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Online End</label>
          <DatePicker
            value={feesStructure.onlineEndDate ? dayjs(feesStructure.onlineEndDate) : null}
            onChange={(date) =>
              isAdd
                ? handleInputChangeAdd("onlineEndDate", date ? date.toDate() : null)
                : handleInputChangeEdit("onlineEndDate", date ? date.toDate() : null)
            }
            disabledDate={disablePastDates}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Installments</label>
          <div className="flex items-center gap-3">
            <span className="mr-2">Do you want to have installments?</span>
            <Switch checked={hasInstallments} onChange={handleInstallmentsToggle} />
            {hasInstallments && <span className="text-base font-semibold text-purple-700">2</span>}
          </div>
        </div>
      </div>
      {/* Installment Table */}
      {hasInstallments && (
        <div className="mt-4">
          <div className="mb-2 text-base font-semibold flex items-center gap-2">
            Total Base Amount Required:
            <span className={isInstalmentTotalValid ? "text-green-700" : "text-red-600"}>
              ₹{totalBaseAmount.toLocaleString()}
            </span>
            {isInstalmentTotalValid ? (
              <CheckCircleTwoTone twoToneColor="#52c41a" className="ml-1 align-middle" />
            ) : (
              <CloseCircleTwoTone twoToneColor="#ff4d4f" className="ml-1 align-middle" />
            )}
          </div>
          <Table
            dataSource={feesStructure.instalments?.map((inst, idx) => ({ ...inst, key: idx })) || []}
            pagination={false}
            bordered
            size="small"
            className="rounded-lg shadow-sm"
            columns={[
              {
                title: "#",
                dataIndex: "instalmentNumber",
                width: 40,
                align: "center" as const,
                render: (_: unknown, __: unknown, idx: number) => idx + 1,
              },
              {
                title: (
                  <span>
                    Base Amount <span className="text-gray-500">(₹)</span>
                  </span>
                ),
                dataIndex: "baseAmount",
                width: 120,
                render: (val: number, row: unknown, idx: number) => {
                  console.log(row);
                  // Calculate max allowed for this field
                  const otherIndex = idx === 0 ? 1 : 0;
                  const otherVal = feesStructure.instalments?.[otherIndex]?.baseAmount || 0;
                  const maxAllowed = totalBaseAmount - otherVal;
                  const maxLength = String(maxAllowed).length;
                  return (
                    <div className="flex items-center">
                      <span className="mr-1 text-gray-500">₹</span>
                      <InputNumber
                        min={0}
                        value={val}
                        onChange={(v: string | number | null | undefined) => {
                          handleSmartInstalmentAmount(idx, v);
                        }}
                        stringMode={false}
                        parser={(value: string | undefined) => Number(value ? value.replace(/[^0-9]/g, "") : "0")}
                        className="w-full"
                        inputMode="numeric"
                        maxLength={maxLength}
                      />
                    </div>
                  );
                },
              },
              {
                title: "Start Date",
                dataIndex: "startDate",
                width: 140,
                render: (val: Date, _row: unknown, idx: number) => (
                  <DatePicker
                    value={val ? dayjs(val) : null}
                    onChange={(date) => handleInstalmentChange(idx, "startDate", date ? date.toDate() : null)}
                    disabledDate={disablePastDates}
                  />
                ),
              },
              {
                title: "End Date",
                dataIndex: "endDate",
                width: 140,
                render: (val: Date, _row: unknown, idx: number) => (
                  <DatePicker
                    value={val ? dayjs(val) : null}
                    onChange={(date) => handleInstalmentChange(idx, "endDate", date ? date.toDate() : null)}
                    disabledDate={disablePastDates}
                  />
                ),
              },
              {
                title: "Online Start",
                dataIndex: "onlineStartDate",
                width: 140,
                render: (val: Date, _row: unknown, idx: number) => (
                  <DatePicker
                    value={val ? dayjs(val) : null}
                    onChange={(date) => handleInstalmentChange(idx, "onlineStartDate", date ? date.toDate() : null)}
                    disabledDate={disablePastDates}
                  />
                ),
              },
              {
                title: "Online End",
                dataIndex: "onlineEndDate",
                width: 140,
                render: (val: Date, _row: unknown, idx: number) => (
                  <DatePicker
                    value={val ? dayjs(val) : null}
                    onChange={(date) => handleInstalmentChange(idx, "onlineEndDate", date ? date.toDate() : null)}
                    disabledDate={disablePastDates}
                  />
                ),
              },
            ]}
          />
          {showInstalmentWarning && (
            <div className="mt-2 text-red-600 font-medium">
              The sum of all installment base amounts must equal the total base amount set in Fee Configuration (₹
              {totalBaseAmount}).
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DatesStep;
