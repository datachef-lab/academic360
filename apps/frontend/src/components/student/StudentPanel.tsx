import { ThemeProviderContext } from "@/providers/ThemeProvider";
import { useContext } from "react";

type StudentPanelProps = {
  studentTabs: {
    label: string;
    icon: JSX.Element;
    endpoint: string;
  }[];
  activeTab: {
    label: string;
    icon: JSX.Element;
    endpoint: string;
  };
  setActiveTab: React.Dispatch<
    React.SetStateAction<{
      label: string;
      icon: JSX.Element;
      endpoint: string;
    }>
  >;
};

export default function StudentPanel({ studentTabs, activeTab, setActiveTab }: StudentPanelProps) {
  const { theme } = useContext(ThemeProviderContext);

  return (
    <div className="my-3">
      <ul className={`text-[14px] ${theme === "light" ? "text-slate-500" : ""} `}>
        {studentTabs.map((tab, index) => (
          <li
            key={`tab-${index}`}
            className={`flex items-center gap-2 p-1 ${activeTab.label === tab?.label && (theme === "light" ? "bg-slate-100" : "bg-slate-200 text-black")} hover:${theme === "light" ? "bg-slate-100" : "bg-slate-200 hover:text-black"} rounded-sm cursor-pointer`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.icon} {tab.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
