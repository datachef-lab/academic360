import React from "react";
import MasterLayout from "@/components/layouts/MasterLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Settings, Lock, Bell } from "lucide-react";

const subLinks = [
  { title: "General", url: "general", icon: Settings },
  { title: "Access Control", url: "access-control", icon: Lock },
  { title: "Notifications", url: "notifications", icon: Bell },
];

export default function BescStudentConsoleSettings() {
  const [tab, setTab] = React.useState("general");
  return (
    <MasterLayout subLinks={subLinks}>
      <div className="p-6 w-full">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="access-control">Access Control</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          <TabsContent value="general">
            <div>General settings for BESC Student Console (placeholder)</div>
          </TabsContent>
          <TabsContent value="access-control">
            <div>Access control settings (placeholder)</div>
          </TabsContent>
          <TabsContent value="notifications">
            <div>Notification settings (placeholder)</div>
          </TabsContent>
        </Tabs>
      </div>
    </MasterLayout>
  );
}
