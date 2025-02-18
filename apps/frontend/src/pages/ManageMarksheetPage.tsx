import { useState } from "react";
import { Outlet } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FileUpload from "@/components/manage-marksheet/FileUpload";
import SearchBar from "@/components/manage-marksheet/SearchBar";
import Tabs from "@/components/manage-marksheet/Tabs";
import DataTable from "@/components/manage-marksheet/DataTable";

interface ActivityLog {
  date: string;
  activity: string;
}

export default function ManageMarksheetPage() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResult, setSearchResult] = useState<ActivityLog[]>([]);
  const [activeTab, setActiveTab] = useState<string>("All Activities");

  return (
    <div className="p-8 bg-gray-100 min-h-screen flex flex-col gap-6">
      <Card className="shadow-lg border rounded-2xl bg-white">
        <CardHeader className="border-b p-6">
          <CardTitle className="text-2xl font-semibold">Manage Marksheet</CardTitle>
        </CardHeader>
        <CardContent className="p-6 flex flex-col gap-6">
          {/* File Upload */}
          <FileUpload />

          {/* Search Bar */}
          <SearchBar setSearchQuery={setSearchQuery} setSearchResult={setSearchResult} />

          {/* Tabs for Filtering */}
          <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Display either search results or activity logs */}
          <DataTable data={searchQuery ? searchResult : []} />

          <Outlet />
        </CardContent>
      </Card>
    </div>
  );
}
