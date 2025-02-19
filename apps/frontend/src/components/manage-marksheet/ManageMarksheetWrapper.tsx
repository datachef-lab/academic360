import React, { useContext } from "react";
import { Link, useParams } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FileUpload from "@/components/manage-marksheet/FileUpload";

import { Button } from "@/components/ui/button";
import { ThemeProviderContext } from "@/providers/ThemeProvider";

// interface ActivityLog {
//   date: string;
//   activity: string;
// }

const tabs = [
  { url: "/home/manage-marksheet", label: "All Activities", isActive: true },
  { url: "/home/manage-marksheet/CCF", label: "CCF", isActive: false },
  { url: "/home/manage-marksheet/CBCS", label: "CBCS", isActive: false },
];

export default function ManageMarksheetWrapper({ children }: { children: React.ReactNode }) {
  const { framework } = useParams();
  const { theme } = useContext(ThemeProviderContext);

  const activeTab = framework || "All Activities"; // use framework param as the active tab

  console.log(framework);

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-lg border rounded-2xl">
        <CardHeader className="border-b p-6">
          <CardTitle className="text-2xl font-semibold">Manage Marksheet</CardTitle>
        </CardHeader>
        <CardContent className="p-6 flex flex-col gap-6">
          <div className="flex justify-between">
            <FileUpload />
            <Button size="icon" variant="ghost" className="border">
              +
            </Button>
          </div>
          <ul className="flex gap-5 my-5">
            {tabs.map((tab) => (
              <li
                key={tab.label}
                className={`min-w-[100px] pb-2 border-b border-b-transparent flex justify-center ${
                  activeTab === tab.label ? "border-b-slate-400" : ""
                }`}
              >
                <Link to={tab.url} className={`${theme === "light" ? "text-black" : "text-white"} p-0`}>
                  {tab.label}
                </Link>
              </li>
            ))}
          </ul>
          {children}
        </CardContent>
      </Card>
    </div>
  );
}
