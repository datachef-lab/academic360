interface FooterProps {
  onSave: () => void;
}
export default function Footer({ onSave }: FooterProps) {
  return (
    <>
      <div className="text-sm w-[45%] pl-5 border py-2 border-gray-400 rounded-sm mt-4">
        <p className="font-semibold">Abbreviations</p>
        <p>P : Passed in the Course, F : Failed in the Course,</p>
        <p>F(TH) : Failed in Theoretical, F(PR) : Failed in Practical, F(TU) : Failed in Tutorial,</p>
        <p>AB : Absent, +1 : Grace Mark, EC : Examination Cancelled,</p>
        <p>ECDB1 : Debarment for 1 year, ECDB2 : Debarment for 2 year,</p>
        <p>N.A. : Not Applicable</p>
      </div>
      <div className="p-0 mt-4">
        <button className="print:hidden bg-black text-white px-4 py-2 rounded" onClick={onSave}>
          Save
        </button>
      </div>
    </>
  );
}
