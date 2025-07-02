import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { Settings, ExternalLink } from "lucide-react";
import React from "react";
import { Switch } from "@/components/ui/switch";

const APPS = [
  {
    name: "BESC Student Console",
    logo: null, // Replace with import or <img src=... /> if available
    url: "https://student-console.besc.edu/",
    settings: "/dashboard/apps/besc-student-console",
  },
  {
    name: "Event Gatekeeper",
    logo: null,
    url: "https://event-gatekeeper.besc.edu/",
    settings: "/dashboard/apps/event-gatekeeper",
  },
  {
    name: "Exam Management System",
    logo: null,
    url: "https://exam-mgmt.besc.edu/",
    settings: "/dashboard/apps/exam-management-system",
  },
  {
    name: "Umang Fest",
    logo: null,
    url: "https://umang.besc.edu/",
    settings: "/dashboard/apps/umang-fest",
  },
  {
    name: "BESC Admission Comm. Module",
    logo: null,
    url: "https://admission-comm.besc.edu/",
    settings: "/dashboard/apps/admission-comm-module",
  },
];

// export default function AppMaster() {
//   const navigate = useNavigate();
//   return (
//     <div className="p-6">
//       <h1 className="text-2xl font-bold mb-6">Connected Apps</h1>
//       <Table>
//         <TableHeader>
//           <TableRow>
//             <TableHead className="w-16">Logo</TableHead>
//             <TableHead>App Name</TableHead>
//             <TableHead>Visit</TableHead>
//             <TableHead>Settings</TableHead>
//           </TableRow>
//         </TableHeader>
//         <TableBody>
//           {APPS.map((app) => (
//             <TableRow key={app.name}>
//               <TableCell>
//                 <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center text-lg font-bold">
//                   {/* Placeholder logo: first letter */}
//                   {app.name[0]}
//                 </div>
//               </TableCell>
//               <TableCell className="font-medium">{app.name}</TableCell>
//               <TableCell>
//                 <Button asChild variant="outline" size="sm">
//                   <a href={app.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
//                     <ExternalLink className="h-4 w-4" /> Visit
//                   </a>
//                 </Button>
//               </TableCell>
//               <TableCell>
//                 <Button
//                   variant="secondary"
//                   size="sm"
//                   onClick={() => navigate(app.settings)}
//                   className="flex items-center gap-1"
//                 >
//                   <Settings className="h-4 w-4" /> Settings
//                 </Button>
//               </TableCell>
//             </TableRow>
//           ))}
//         </TableBody>
//       </Table>
//     </div>
//   );
// }
export default function AppMaster() {
  const navigate = useNavigate();
  // Local state to track enabled/disabled status
  const [enabledApps, setEnabledApps] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(APPS.map((app) => [app.name, true])),
  );

  const handleToggle = (appName: string) => {
    setEnabledApps((prev) => ({
      ...prev,
      [appName]: !prev[appName],
    }));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Connected Apps</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Logo</TableHead>
            <TableHead>App Name</TableHead>
            <TableHead>Enabled</TableHead>
            <TableHead>Visit</TableHead>
            <TableHead>Settings</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {APPS.map((app) => (
            <TableRow key={app.name}>
              <TableCell>
                <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center text-lg font-bold">
                  {/* Placeholder logo: first letter */}
                  {app.name[0]}
                </div>
              </TableCell>
              <TableCell className="font-medium">{app.name}</TableCell>
              <TableCell>
                <Switch
                  checked={enabledApps[app.name]}
                  onCheckedChange={() => handleToggle(app.name)}
                  aria-label={`Enable or disable ${app.name}`}
                />
              </TableCell>
              <TableCell>
                <Button asChild variant="outline" size="sm" disabled={!enabledApps[app.name]}>
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
                  disabled={!enabledApps[app.name]}
                >
                  <Settings className="h-4 w-4" /> Settings
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
