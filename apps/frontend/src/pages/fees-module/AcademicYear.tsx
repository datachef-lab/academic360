import React, { useState, useEffect } from "react";
import { Calendar, PlusCircle, AlertCircle, Search, Filter, FileDown, CheckCircle, XCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface AcademicYearItem {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  active: boolean;
}

const initialData: AcademicYearItem[] = [
  {
    id: 1,
    name: "2023-24",
    startDate: "2023-04-01",
    endDate: "2024-03-31",
    active: false,
  },
  {
    id: 2,
    name: "2024-25",
    startDate: "2024-04-01",
    endDate: "2025-03-31",
    active: true,
  },
];

const AcademicYear: React.FC = () => {
  const [data, setData] = useState<AcademicYearItem[]>(initialData);
  const [filteredData, setFilteredData] = useState<AcademicYearItem[]>(initialData);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<AcademicYearItem | null>(null);
  const [form, setForm] = useState<AcademicYearItem>({ id: 0, name: "", startDate: "", endDate: "", active: true });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    let updated = data;
    if (searchTerm) {
      updated = updated.filter(
        (y) =>
          y.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          y.startDate.includes(searchTerm) ||
          y.endDate.includes(searchTerm),
      );
    }
    if (statusFilter !== "all") {
      updated = updated.filter((y) => (statusFilter === "active" ? y.active : !y.active));
    }
    setFilteredData(updated);
  }, [data, searchTerm, statusFilter]);

  const handleExport = () => {
    const csvContent = [
      ["ID", "Name", "Start Date", "End Date", "Status"],
      ...filteredData.map((y) => [y.id, y.name, y.startDate, y.endDate, y.active ? "active" : "inactive"]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "academic_years.csv";
    a.click();
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.startDate || !form.endDate) return;

    if (editingItem) {
      setData(data.map((item) => (item.id === editingItem.id ? { ...form, id: item.id } : item)));
    } else {
      setData([...data, { ...form, id: Date.now() }]);
    }
    handleClose();
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingItem(null);
    setForm({ id: 0, name: "", startDate: "", endDate: "", active: true });
  };

  const handleEdit = (item: AcademicYearItem) => {
    setEditingItem(item);
    setForm(item);
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this academic year?")) return;
    setData(data.filter((y) => y.id !== id));
  };

  const totalYears = data.length;
  const activeYears = data.filter((y) => y.active).length;
  const inactiveYears = data.filter((y) => !y.active).length;

  return (
    <div className="min-h-screen bg-gray-50 p-3 lg:p-4">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-600 text-white rounded-lg">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Academic Year</h1>
            <p className="text-sm text-gray-600">Manage academic year settings and periods</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Total Years</p>
                <p className="text-lg font-bold text-gray-900">{totalYears}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded">
                <Calendar className="h-4 w-4 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Active</p>
                <p className="text-lg font-bold text-gray-900">{activeYears}</p>
              </div>
              <div className="p-2 bg-green-100 rounded">
                <CheckCircle className="h-4 w-4 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Inactive</p>
                <p className="text-lg font-bold text-gray-900">{inactiveYears}</p>
              </div>
              <div className="p-2 bg-gray-100 rounded">
                <XCircle className="h-4 w-4 text-gray-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-3 mb-4 border border-gray-200">
        <div className="flex flex-col gap-3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search academic years..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border transition-all ${
                showFilters
                  ? "bg-purple-50 border-purple-300 text-purple-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              Filters
              {statusFilter !== "all" && (
                <span className="bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full">1</span>
              )}
            </button>

            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Add
            </button>

            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              <FileDown className="h-3.5 w-3.5" />
              Export
            </button>
          </div>

          {showFilters && (
            <div className="pt-3 border-t border-gray-200">
              <div className="flex flex-wrap gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setStatusFilter("all");
                    }}
                    className="px-2 py-1 text-xs text-purple-600 hover:text-purple-700 transition-colors"
                  >
                    Clear filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <Table>
          <TableHeader className="bg-gray-50 border-b border-gray-200">
            <TableRow className="hover:bg-gray-50">
              <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                #
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Academic Year
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider hidden sm:table-cell">
                Start Date
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider hidden sm:table-cell">
                End Date
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white divide-y divide-gray-200">
            {filteredData.length ? (
              filteredData.map((item, index) => (
                <TableRow key={item.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">{index + 1}</TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">{item.name}</span>
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap hidden sm:table-cell">
                    <span className="text-sm text-gray-600">{item.startDate}</span>
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap hidden sm:table-cell">
                    <span className="text-sm text-gray-600">{item.endDate}</span>
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {item.active ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    <button onClick={() => handleEdit(item)} className="text-purple-600 hover:text-purple-800">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800 ml-4">
                      Delete
                    </button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <AlertCircle className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No Academic Years Found</p>
                  <p className="text-sm text-gray-500 mt-1">Adjust your filters or add a new academic year.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Academic Year" : "Add New Academic Year"}</DialogTitle>
            <DialogDescription>Configure academic year period and status.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name / Label</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., 2025-26"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="active">Active Status</Label>
              <Switch
                id="active"
                checked={form.active}
                onCheckedChange={(checked) => setForm({ ...form, active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="bg-purple-600 hover:bg-purple-700">
              {editingItem ? "Update" : "Create"} Academic Year
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AcademicYear;
