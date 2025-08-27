// components/ChipTabs.tsx
import { motion } from "framer-motion";

interface ChipTabsProps {
  tabs: string[];
  selected: string;
  setSelected: (tab: string) => void;
  colorFrom?: string;
  colorTo?: string;
  className?: string;
  tabClassName?: string;
  activeTabClassName?: string;
  inactiveTabClassName?: string;
}

export const ChipTabs = ({
  tabs,
  selected,
  setSelected,
  colorFrom = "from-violet-600",
  colorTo = "to-indigo-600",
  className = "",
  tabClassName = "",
  activeTabClassName = "",
  inactiveTabClassName = "",
}: ChipTabsProps) => {
  // Validate tabs array
  if (!tabs || tabs.length === 0) {
    console.error("ChipTabs: tabs prop must be a non-empty array");
    return null;
  }

  // Ensure selected tab exists in tabs
  if (!tabs.includes(selected)) {
    console.warn(
      `ChipTabs: selected tab "${selected}" not found in tabs array. Defaulting to first tab.`
    );
    setSelected(tabs[0]);
    return null;
  }

  return (
    <div
      role="tablist"
      aria-label="Navigation tabs"
      className={`flex flex-wrap items-center gap-2 ${className}`}
    >
      {tabs.map((tab) => (
        <Chip
          key={tab}
          text={tab}
          selected={selected === tab}
          setSelected={setSelected}
          colorFrom={colorFrom}
          colorTo={colorTo}
          tabClassName={tabClassName}
          activeTabClassName={activeTabClassName}
          inactiveTabClassName={inactiveTabClassName}
        />
      ))}
    </div>
  );
};

interface ChipProps {
  text: string;
  selected: boolean;
  setSelected: (tab: string) => void;
  colorFrom?: string;
  colorTo?: string;
  tabClassName?: string;
  activeTabClassName?: string;
  inactiveTabClassName?: string;
}

const Chip = ({
  text,
  selected,
  setSelected,
  colorFrom,
  colorTo,
  tabClassName = "",
  activeTabClassName = "",
  inactiveTabClassName = "",
}: ChipProps) => {
  const baseClasses = `text-sm transition-all px-3 py-1.5 rounded-md relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 ${tabClassName}`;
  const inactiveClasses = `text-slate-500 hover:text-slate-700 hover:bg-slate-100  ${inactiveTabClassName}`;
  const activeClasses = `text-white ${activeTabClassName}`;

  return (
    <button
      role="tab"
      aria-selected={selected}
      aria-controls={`${text.toLowerCase()}-tabpanel`}
      id={`${text.toLowerCase()}-tab`}
      onClick={() => setSelected(text)}
      className={`${baseClasses} ${
        selected ? activeClasses : inactiveClasses
      }`}
    >
      <span className="relative z-10 font-medium">{text}</span>
      {selected && (
        <motion.span
          layoutId="pill-tab"
          transition={{
            type: "spring",
            duration: 0.5,
          }}
          className={`absolute inset-0 z-0 bg-gradient-to-r ${colorFrom} ${colorTo} rounded-md shadow-sm`}
          aria-hidden="true"
        />
      )}
    </button>
  );
};