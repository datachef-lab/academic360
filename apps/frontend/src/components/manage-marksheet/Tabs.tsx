import { Tabs as ShadTabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Tabs({ activeTab, setActiveTab }: TabsProps) {
  return (
    <ShadTabs defaultValue={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid grid-cols-3 bg-gray-50 border rounded-lg">
        <TabsTrigger value="All Activities" className="py-2">
          All Activities
        </TabsTrigger>
        <TabsTrigger value="CCF" className="py-2">
          CCF
        </TabsTrigger>
        <TabsTrigger value="CBCS" className="py-2">
          CBCS
        </TabsTrigger>
      </TabsList>
    </ShadTabs>
  );
}
