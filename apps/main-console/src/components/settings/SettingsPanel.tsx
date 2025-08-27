import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useContext } from "react";
import { ThemeProviderContext } from "@/providers/ThemeProvider";

type SettingsPanelProps = {
  settingsCategories: {
    category: string;
    icon: JSX.Element;
    tabs: {
      label: string;
      icon: JSX.Element;
      endpoint: string;
    }[];
  }[];
  activeSetting: {
    label: string;
    icon: JSX.Element;
    endpoint: string;
  };
  setActiveSetting: React.Dispatch<
    React.SetStateAction<{
      label: string;
      icon: JSX.Element;
      endpoint: string;
    }>
  >;
};
export default function SettingsPanel({ settingsCategories,  setActiveSetting }: SettingsPanelProps) {
  const { theme } = useContext(ThemeProviderContext);

  return (
    <ul>
      <Accordion type="multiple" defaultValue={settingsCategories.map((_, index) => `panel-${index}`)}>
        {settingsCategories.map((panel, index) => (
          <AccordionItem key={`settings-panel-option-${index}`} value={`panel-${index}`} className="text-[14px]">
            <AccordionTrigger >
              <div className="flex items-center gap-3 p-2 rounded-md cursor-pointer">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-full shadow-md">
                {panel.icon}
              </div>
                 <p className="text-base">{panel.category}</p>
                 </div>
            </AccordionTrigger>
            <AccordionContent className={`text-[14px] ${theme === "light" ? "text-slate-600" : "text-gray-300"} `}>
  {panel.tabs.length > 0 ? (
    <ul className="pl-4 ">
      {panel.tabs.map((tab, tabIndex) => (
        <li
          key={`settings-tab-${tabIndex}`}
          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all duration-300 `}
          onClick={() => setActiveSetting(tab)}
        >
          <div className=" text-gray-600   drop-shadow-md">
            {tab.icon}
          </div>
          <p className="text-sm font-medium">{tab.label}</p>
        </li>
      ))}
    </ul>
  ) : (
    <p className="text-gray-500 italic">No settings available.</p>
  )}
</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </ul>
  );
}
