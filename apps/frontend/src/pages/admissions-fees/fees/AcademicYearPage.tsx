import React, { useState, useEffect } from "react";
import { Calendar, PlusCircle, Search, Filter, FileDown, CheckCircle, XCircle } from "lucide-react";
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
// import { getAllAcademicYears, createAcademicYear, updateAcademicYearById } from "@/services/academic-identifiers.service";
import { AcademicYear } from "@/types/academics/academic-year";
import { createAcademicYear, getAllAcademicYears, updateAcademicYearById } from "@/services/academic-year-api";


const AcademicYearPage: React.FC = () => {
  const [data, setData] = useState<AcademicYear[]>([]);
  const [filteredData, setFilteredData] = useState<AcademicYear[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<AcademicYear | null>(null);
  const [form, setForm] = useState<AcademicYear>({ id: 0, year: "", isCurrentYear: true, });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function fetchAcademicYears() {
      try {
        const res = await getAllAcademicYears();
        const mapped = (res.payload || res).map((item: AcademicYear) => ({
          id: item.id,
          year: item.year,
          isCurrentYear: item.isCurrentYear,
        }));
        setData(mapped);
        setFilteredData(mapped);
      } catch (error) {
        console.error("Failed to fetch academic years", error);
      }
    }
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    let updated = data;
    if (searchTerm) {
      updated = updated.filter((y) => y.year.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (statusFilter !== "all") {
      updated = updated.filter((y) => (statusFilter === "active" ? y.isCurrentYear : !y.isCurrentYear));
    }
    setFilteredData(updated);
  }, [data, searchTerm, statusFilter]);

  const handleExport = () => {
    const csvContent = [
      ["ID", "Year", "Status"],
      ...filteredData.map((y) => [y.id, y.year, y.isCurrentYear ? "active" : "inactive"]),
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

  const handleSubmit = async () => {
    // Validate year is a four-digit number
    if (!/^[0-9]{4}$/.test(form.year)) {
      alert("Year must be a four-digit number.");
      return;
    }
    try {
      if (editingItem) {
        const updated = {
          year: form.year,
          isCurrentYear: form.isCurrentYear,
        };
        await updateAcademicYearById(editingItem.id!, updated);
      } else {
        const newAcademicYear = {
          year: form.year,
          isCurrentYear: form.isCurrentYear,
        };
        await createAcademicYear(newAcademicYear);
      }
      // Always re-fetch the list after create/edit
      const res = await getAllAcademicYears();
      const mapped = (res.payload || res).map((item: AcademicYear) => ({
        id: item.id,
        year: item.year,
        isCurrentYear: item.isCurrentYear,
      }));
      setData(mapped);
      setFilteredData(mapped);
      handleClose();
    } catch (error) {
      alert("Failed to save academic year");
      console.error(error);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingItem(null);
    setForm({ id: 0, year: "", isCurrentYear: true });
  };

  const handleEdit = (item: AcademicYear) => {
    setEditingItem(item);
    setForm(item);
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this academic year?")) return;
    setData(data.filter((y) => y.id !== id));
  };

  const totalYears = data.length;
  const activeYears = data.filter((y) => y.isCurrentYear).length;
  const inactiveYears = data.filter((y) => !y.isCurrentYear).length;

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
              <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">#</TableHead>
              <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Academic Year</TableHead>
              <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</TableHead>
              <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white divide-y divide-gray-200">
            {filteredData.length ? (
              filteredData.map((item, index) => (
                <TableRow key={item.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">{index + 1}</TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">{item.year}</span>
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${item.isCurrentYear ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {item.isCurrentYear ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    <button onClick={() => handleEdit(item)} className="text-purple-600 hover:text-purple-800">Edit</button>
                    <button onClick={() => handleDelete(item.id!)} className="text-red-600 hover:text-red-800 ml-4">Delete</button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <span className="text-gray-600 font-medium">No Academic Years Found</span>
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
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                min={1900}
                max={2099}
                value={form.year}
                onChange={e => {
                  // Only allow 4 digits
                  const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                  setForm({ ...form, year: val });
                }}
                placeholder="e.g., 2025"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="isCurrentYear">Active Status</Label>
              <Switch
                id="isCurrentYear"
                checked={form.isCurrentYear}
                onCheckedChange={checked => setForm({ ...form, isCurrentYear: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            <Button onClick={handleSubmit} className="bg-purple-600 hover:bg-purple-700">{editingItem ? "Update" : "Create"} Academic Year</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AcademicYearPage;
