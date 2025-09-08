import { motion } from "framer-motion";
import { Dispatch, SetStateAction, useState } from "react";

const tabs = ["Academic (39)", "Administrative (17)", "Co-curricular/Sports/Cultural (13)", "Examination (5)"];

const ChipTabs = () => {
  const [selected, setSelected] = useState(tabs[0]!);

  return (
    <div className="px-4 py-1 bg-gray-50 flex items-center flex-wrap gap-2 sm:gap-3 ">
      {tabs.map((tab) => (
        <Chip text={tab} selected={selected === tab} setSelected={setSelected} key={tab} />
      ))}
    </div>
  );
};

const Chip = ({
  text,
  selected,
  setSelected,
}: {
  text: string;
  selected: boolean;
  setSelected: Dispatch<SetStateAction<string>>;
}) => {
  return (
    <button
      onClick={() => setSelected(text)}
      className={`${
        selected ? "text-white" : "text-slate-800 hover:text-slate-800 hover:bg-slate-200"
      } text-xs transition-colors px-3.5 py-2 rounded-md relative`}
    >
      <span className="relative z-10">{text}</span>
      {selected && (
        <motion.span
          layoutId="pill-tab"
          transition={{ type: "spring", duration: 0.5 }}
          className="absolute inset-0 z-0 bg-gradient-to-r from-blue-500 to-indigo-400 rounded-md"
        ></motion.span>
      )}
    </button>
  );
};

export default ChipTabs;
