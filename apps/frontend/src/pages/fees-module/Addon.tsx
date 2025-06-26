import React, { useState, useEffect } from "react";
import { PlusCircle, AlertCircle, Search, Filter, FileDown, CheckCircle, XCircle, DollarSign } from "lucide-react";
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

interface AddonFee {
  id: number;
  name: string;
  description: string;
  amount: number;
  category: string;
  active: boolean;
}

const initialData: AddonFee[] = [
  {
    id: 1,
    name: "Library Fee",
    description: "Annual library access and book lending fee",
    amount: 500,
    category: "Academic",
    active: true,
  },
  {
    id: 2,
    name: "Lab Fee",
    description: "Science laboratory usage and equipment fee",
    amount: 1200,
    category: "Academic",
    active: true,
  },
  {
    id: 3,
    name: "Transport Fee",
    description: "School bus transportation service",
    amount: 2000,
    category: "Transport",
    active: true,
  },
  {
    id: 4,
    name: "Sports Fee",
    description: "Sports activities and equipment fee",
    amount: 800,
    category: "Sports",
    active: true,
  },
  {
    id: 5,
    name: "Computer Lab Fee",
    description: "Computer lab access and maintenance",
    amount: 1500,
    category: "Academic",
    active: false,
  },
  {
    id: 6,
    name: "Hostel Fee",
    description: "Accommodation and boarding charges",
    amount: 15000,
    category: "Accommodation",
    active: true,
  },
];

const categories = ["Academic", "Transport", "Sports", "Accommodation", "Miscellaneous"];

const Addon: React.FC = () => {
  const [data, setData] = useState<AddonFee[]>(initialData);
  const [filteredData, setFilteredData] = useState<AddonFee[]>(initialData);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<AddonFee | null>(null);
  const [form, setForm] = useState<AddonFee>({
    id: 0,
    name: "",
    description: "",
    amount: 0,
    category: "Academic",
    active: true,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    let updated = data;
    if (searchTerm) {
      updated = updated.filter(
        (addon) =>
          addon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          addon.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          addon.category.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }
    if (statusFilter !== "all") {
      updated = updated.filter((addon) => (statusFilter === "active" ? addon.active : !addon.active));
    }
    if (categoryFilter !== "all") {
      updated = updated.filter((addon) => addon.category === categoryFilter);
    }
    setFilteredData(updated);
  }, [data, searchTerm, statusFilter, categoryFilter]);

  const handleExport = () => {
    const csvContent = [
      ["ID", "Name", "Description", "Amount", "Category", "Status"],
      ...filteredData.map((addon) => [
        addon.id,
        addon.name,
        addon.description,
        addon.amount,
        addon.category,
        addon.active ? "active" : "inactive",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "addon_fees.csv";
    a.click();
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.description.trim() || form.amount <= 0) return;

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
    setForm({ id: 0, name: "", description: "", amount: 0, category: "Academic", active: true });
  };

  const handleEdit = (item: AddonFee) => {
    setEditingItem(item);
    setForm(item);
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this addon fee?")) return;
    setData(data.filter((addon) => addon.id !== id));
  };

  const totalAddons = data.length;
  const activeAddons = data.filter((addon) => addon.active).length;
  const inactiveAddons = data.filter((addon) => !addon.active).length;
  const totalRevenue = data.filter((addon) => addon.active).reduce((sum, addon) => sum + addon.amount, 0);

  const filterCount = (statusFilter !== "all" ? 1 : 0) + (categoryFilter !== "all" ? 1 : 0);

  return (
    <div className="min-h-screen bg-gray-50 p-3 lg:p-4">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-600 text-white rounded-lg">
            <PlusCircle className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Addon Fees</h1>
            <p className="text-sm text-gray-600">Manage additional fees and charges for students</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Total Addons</p>
                <p className="text-lg font-bold text-gray-900">{totalAddons}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded">
                <PlusCircle className="h-4 w-4 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Active</p>
                <p className="text-lg font-bold text-gray-900">{activeAddons}</p>
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
                <p className="text-lg font-bold text-gray-900">{inactiveAddons}</p>
              </div>
              <div className="p-2 bg-gray-100 rounded">
                <XCircle className="h-4 w-4 text-gray-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Total Revenue</p>
                <p className="text-lg font-bold text-gray-900">₹{totalRevenue.toLocaleString()}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded">
                <DollarSign className="h-4 w-4 text-blue-700" />
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
              placeholder="Search addon fees..."
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
              {filterCount > 0 && (
                <span className="bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full">{filterCount}</span>
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
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Category</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setStatusFilter("all");
                      setCategoryFilter("all");
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
                Addon Name
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider hidden md:table-cell">
                Description
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Amount
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Category
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
                  <TableCell className="px-4 py-3 hidden md:table-cell">
                    <span className="text-sm text-gray-600">{item.description}</span>
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-900">₹{item.amount.toLocaleString()}</span>
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                      {item.category}
                    </span>
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
                <TableCell colSpan={7} className="text-center py-8">
                  <AlertCircle className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No Addon Fees Found</p>
                  <p className="text-sm text-gray-500 mt-1">Adjust your filters or add a new addon fee.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Addon Fee" : "Add New Addon Fee"}</DialogTitle>
            <DialogDescription>Configure additional fees and charges for students.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Addon Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Library Fee"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of the addon fee"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                value={form.amount || ""}
                onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
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
              {editingItem ? "Update" : "Create"} Addon Fee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Addon;
