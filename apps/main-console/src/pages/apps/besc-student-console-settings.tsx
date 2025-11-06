import React from "react";
import MasterLayout from "@/components/layouts/MasterLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Settings, Lock, Bell } from "lucide-react";
import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

const subLinks = [
  { title: "General", url: "general", icon: Settings },
  { title: "Access Control", url: "access-control", icon: Lock },
  { title: "Notifications", url: "notifications", icon: Bell },
];

export default function BescStudentConsoleSettings() {
  useRestrictTempUsers();
  const [tab, setTab] = React.useState("general");
  const navigate = useNavigate();

  return (
    <MasterLayout subLinks={subLinks}>
      <div className="p-6 w-full h-full flex flex-col">
        <Tabs value={tab} onValueChange={setTab} className="w-full h-full flex flex-col">
          <TabsList className="mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="access-control">Access Control</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <div className="mb-4 flex justify-end">
            <Button
              variant="outline"
              onClick={() => navigate("student-console/simulation")}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open Simulation
            </Button>
          </div>

          <TabsContent value="general" className="flex-1">
            <div>General settings for BESC Student Console (placeholder)</div>
          </TabsContent>

          <TabsContent value="access-control" className="flex-1">
            <div>Access control settings (placeholder)</div>
          </TabsContent>

          <TabsContent value="notifications" className="flex-1">
            <div>Notification settings (placeholder)</div>
          </TabsContent>
        </Tabs>
      </div>
    </MasterLayout>
  );
}
