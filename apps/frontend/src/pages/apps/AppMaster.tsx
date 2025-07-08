import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { Settings, ExternalLink } from "lucide-react";
import React from "react";

const APPS = [
  {
    name: "BESC Student Console",
    logo: null, // Replace with import or <img src=... /> if available
    url: "https://student-console.besc.edu/",
    settings: "/dashboard/apps/besc-student-console",
    enabled: true,
  },
  {
    name: "Event Gatekeeper",
    logo: null,
    url: "https://event-gatekeeper.besc.edu/",
    settings: "/dashboard/apps/event-gatekeeper",
    enabled: true,
  },
  {
    name: "Exam Management System",
    logo: null,
    url: "https://exam-mgmt.besc.edu/",
    settings: "/dashboard/apps/exam-management-system",
    enabled: false,
  },
  {
    name: "Umang Fest",
    logo: null,
    url: "https://umang.besc.edu/",
    settings: "/dashboard/apps/umang-fest",
    enabled: true,
  },
  {
    name: "BESC Admission Comm. Module",
    logo: null,
    url: "https://admission-comm.besc.edu/",
    settings: "/dashboard/apps/admission-comm-module",
    enabled: false,
  },
];

export default function AppMaster() {
  const navigate = useNavigate();
  const [apps, setApps] = React.useState(APPS);

  const handleToggle = (idx: number) => {
    setApps((prev) => prev.map((app, i) => (i === idx ? { ...app, enabled: !app.enabled } : app)));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 p-0">
      <div className="flex flex-col items-center py-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-purple-700 mb-2 drop-shadow-lg">Connected Apps</h1>
        <p className="text-lg text-purple-500 mb-8">Manage your integrations and access all modules from one place.</p>
        <div className="w-full max-w-5xl bg-white/80 rounded-2xl shadow-xl p-6 border border-purple-100">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Logo</TableHead>
                <TableHead>App Name</TableHead>
                <TableHead>Visit</TableHead>
                <TableHead>Settings</TableHead>
                <TableHead>Enabled</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apps.map((app, idx) => (
                <TableRow key={app.name} className={app.enabled ? "bg-white" : "bg-gray-50 opacity-70"}>
                  <TableCell>
                    <div className="h-10 w-10 bg-gradient-to-br from-purple-200 via-pink-200 to-blue-200 rounded-full flex items-center justify-center text-lg font-bold text-purple-700 shadow">
                      {/* Placeholder logo: first letter */}
                      {app.name[0]}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-purple-700 text-base">{app.name}</TableCell>
                  <TableCell>
                    <Button asChild variant="outline" size="sm" disabled={!app.enabled}>
                      <a href={app.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                        <ExternalLink className="h-4 w-4" /> Visit
                      </a>
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(app.settings)}
                      className="flex items-center gap-1"
                      disabled={!app.enabled}
                    >
                      <Settings className="h-4 w-4" /> Settings
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={app.enabled}
                      onCheckedChange={() => handleToggle(idx)}
                      className="data-[state=checked]:bg-purple-500"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
