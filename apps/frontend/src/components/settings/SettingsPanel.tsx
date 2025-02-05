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
export default function SettingsPanel({ settingsCategories, activeSetting, setActiveSetting }: SettingsPanelProps) {
  const { theme } = useContext(ThemeProviderContext);

  return (
    <ul>
      <Accordion type="multiple" defaultValue={settingsCategories.map((_, index) => `panel-${index}`)}>
        {settingsCategories.map((panel, index) => (
          <AccordionItem key={`settings-panel-option-${index}`} value={`panel-${index}`} className="text-[14px]">
            <AccordionTrigger className="flex items-center gap-2">
              <p className="flex gap-2 items-center">
                {panel.icon} {panel.category}
              </p>
            </AccordionTrigger>
            <AccordionContent className={`text-[14px] ${theme === "light" ? "text-slate-500" : ""} `}>
              {panel.tabs.length > 0 ? (
                <ul className="pl-4">
                  {panel.tabs.map((tab, tabIndex) => (
                    <li
                      key={`settings-tab-${tabIndex}`}
                      className={`flex items-center gap-2 p-1 ${activeSetting.label === tab?.label && (theme === "light" ? "bg-slate-100" : "bg-slate-200 text-black")} hover:${theme === "light" ? "bg-slate-100" : "bg-slate-200 hover:text-black"} rounded-sm cursor-pointer`}
                      onClick={() => setActiveSetting(tab)}
                    >
                      {tab.icon} {tab.label}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No settings available.</p>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </ul>
  );
}
