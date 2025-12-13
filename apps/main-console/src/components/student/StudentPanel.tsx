// import { motion } from "framer-motion";
import { TabsList, TabsTrigger } from "../ui/tabs";

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

export default function StudentPanel({ studentTabs, setActiveTab }: StudentPanelProps) {
  return (
    <div className="overflow-x-auto">
      <TabsList className="inline-flex h-auto min-w-max w-full lg:w-auto">
        {studentTabs.map((tab, index) => (
          <TabsTrigger
            key={`tab-${index}`}
            value={tab.label}
            onClick={() => setActiveTab(tab)}
            className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-4 py-2"
          >
            {tab.label}
          </TabsTrigger>
        ))}
        {/* <ul className="space-y-1">
          {studentTabs.map((tab, index) => (
            <motion.li
              key={`tab-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`
                relative group
                ${activeTab.label === tab?.label ? "bg-purple-50" : ""}
              `}
            >
              <button
                onClick={() => setActiveTab(tab)}
                className={`
                  w-full flex items-center gap-3 px-4 py-2.5 rounded-lg
                  transition-all duration-200 ease-in-out
                  ${activeTab.label === tab?.label
                    ? "text-purple-700"
                    : "text-gray-600 group-hover:text-purple-600"
                  }
                  hover:bg-purple-50
                `}
              >
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-lg
                  transition-all duration-200
                  ${activeTab.label === tab?.label
                    ? "bg-purple-100 text-purple-700"
                    : "bg-gray-100 text-gray-600 group-hover:bg-purple-100 "
                  }
                `}>
                  {tab.icon}
                </div>
                <span className="font-medium">{tab.label}</span>
  
                {activeTab.label === tab?.label && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-purple-600 rounded-r-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            </motion.li>
          ))}
        </ul> */}
      </TabsList>
    </div>
  );
}
