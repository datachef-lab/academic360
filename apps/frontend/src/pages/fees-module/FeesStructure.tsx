import React, { useState, useRef } from "react";
import {
  Banknote,
  PlusCircle,
  Upload,
  FileDown,
  Filter,
  X,
  TrendingUp,
  Users,
  DollarSign,
  AlertCircle,
  Search,
} from "lucide-react";
interface FeeStructure {
  id: number;
  name: string;
  amount: number;
  category: string;
  description?: string;
  appliedTo?: string;
  dueDate?: string;
  status?: "active" | "inactive";
}

const dummyData: FeeStructure[] = [
  {
    id: 1,
    name: "Tuition Fee",
    amount: 50000,
    category: "Mandatory",
    appliedTo: "All Students",
    dueDate: "2024-06-01",
    status: "active",
    description: "Basic tuition fees for the academic year",
  },
  {
    id: 2,
    name: "Library Fee",
    amount: 2500,
    category: "Mandatory",
    appliedTo: "All Students",
    dueDate: "2024-06-01",
    status: "active",
    description: "Access to library resources and digital materials",
  },
  {
    id: 3,
    name: "Transport Fee",
    amount: 15000,
    category: "Optional",
    appliedTo: "Bus Users",
    dueDate: "2024-06-15",
    status: "active",
    description: "School bus transportation service",
  },
  {
    id: 4,
    name: "Lab Fee",
    amount: 8000,
    category: "Mandatory",
    appliedTo: "Science Students",
    dueDate: "2024-06-01",
    status: "active",
    description: "Laboratory equipment and materials",
  },
  {
    id: 5,
    name: "Sports Fee",
    amount: 3000,
    category: "Optional",
    appliedTo: "Sports Participants",
    dueDate: "2024-07-01",
    status: "active",
    description: "Sports facilities and equipment maintenance",
  },
  {
    id: 6,
    name: "Computer Lab Fee",
    amount: 5000,
    category: "Mandatory",
    appliedTo: "CS Students",
    dueDate: "2024-06-01",
    status: "active",
    description: "Computer lab access and software licenses",
  },
  {
    id: 7,
    name: "Annual Day Fee",
    amount: 1500,
    category: "Mandatory",
    appliedTo: "All Students",
    dueDate: "2024-11-01",
    status: "inactive",
    description: "Annual day celebration and activities",
  },
];

const FeesStructure: React.FC = () => {
  const [data, setData] = useState<FeeStructure[]>(dummyData);
  const [filteredData, setFilteredData] = useState<FeeStructure[]>(dummyData);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New fee form state
  const [newFee, setNewFee] = useState<Partial<FeeStructure>>({
    name: "",
    amount: 0,
    category: "Mandatory",
    appliedTo: "All Students",
    dueDate: "",
    status: "active",
    description: "",
  });

  const totalFees = data.reduce((sum, fee) => sum + fee.amount, 0);
  const mandatoryFees = data.filter((fee) => fee.category === "Mandatory").reduce((sum, fee) => sum + fee.amount, 0);
  const activeFees = data.filter((fee) => fee.status === "active").length;
  React.useEffect(() => {
    let filtered = data;

    if (searchTerm) {
      filtered = filtered.filter(
        (fee) =>
          fee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          fee.description?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((fee) => fee.category === categoryFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((fee) => fee.status === statusFilter);
    }

    setFilteredData(filtered);
  }, [searchTerm, categoryFilter, statusFilter, data]);

  const handleFileUpload = (file: File) => {
    console.log("Uploading file:", file.name);
    setTimeout(() => {
      alert("File uploaded successfully!");
    }, 1000);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const handleAddFee = () => {
    if (newFee.name && newFee.amount) {
      const fee: FeeStructure = {
        id: data.length + 1,
        name: newFee.name,
        amount: newFee.amount,
        category: newFee.category || "Mandatory",
        appliedTo: newFee.appliedTo || "All Students",
        dueDate: newFee.dueDate || "",
        status: newFee.status || "active",
        description: newFee.description || "",
      };
      setData([...data, fee]);
      setShowAddModal(false);
      setNewFee({
        name: "",
        amount: 0,
        category: "Mandatory",
        appliedTo: "All Students",
        dueDate: "",
        status: "active",
        description: "",
      });
    }
  };

  const handleExport = () => {
    const csvContent = [
      ["ID", "Name", "Amount", "Category", "Applied To", "Due Date", "Status", "Description"],
      ...filteredData.map((fee) => [
        fee.id,
        fee.name,
        fee.amount,
        fee.category,
        fee.appliedTo || "",
        fee.dueDate || "",
        fee.status || "",
        fee.description || "",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fees_structure.csv";
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 lg:p-4">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-600 text-white rounded-lg">
            <Banknote className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Fees Structure</h1>
            <p className="text-sm text-gray-600">Manage and organize fee structures</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Total Fees</p>
              <p className="text-lg font-bold text-gray-900">₹{totalFees.toLocaleString()}</p>
            </div>
            <div className="p-2 bg-green-100 rounded">
              <DollarSign className="h-4 w-4 text-green-700" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Mandatory</p>
              <p className="text-lg font-bold text-gray-900">₹{mandatoryFees.toLocaleString()}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded">
              <TrendingUp className="h-4 w-4 text-blue-700" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Active Types</p>
              <p className="text-lg font-bold text-gray-900">{activeFees}</p>
            </div>
            <div className="p-2 bg-purple-100 rounded">
              <Users className="h-4 w-4 text-purple-700" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-3 mb-4 border border-gray-200">
        <div className="flex flex-col gap-3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search fees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-black pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              {(categoryFilter !== "all" || statusFilter !== "all") && (
                <span className="bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {[categoryFilter !== "all", statusFilter !== "all"].filter(Boolean).length}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowAddModal(true)}
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

            <div
              className={`relative border-2 border-dashed rounded-md transition-all ${
                isDragging ? "border-purple-500 bg-purple-50" : "border-gray-300 hover:border-gray-400"
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700"
              >
                <Upload className="h-3.5 w-3.5" />
                Upload
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex flex-wrap gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Categories</option>
                  <option value="Mandatory">Mandatory</option>
                  <option value="Optional">Optional</option>
                </select>
              </div>
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
                    setCategoryFilter("all");
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

      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Fee Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider hidden sm:table-cell">
                  Applied To
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider hidden md:table-cell">
                  Due Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((fee) => (
                <tr key={fee.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{fee.name}</div>
                      <div className="text-xs text-gray-600 hidden sm:block">{fee.description}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-900">₹{fee.amount.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        fee.category === "Mandatory" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {fee.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 hidden sm:table-cell">
                    {fee.appliedTo}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell">
                    {fee.dueDate}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        fee.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {fee.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    <button className="text-purple-600 hover:text-purple-800 mr-2">Edit</button>
                    <button className="text-red-600 hover:text-red-800">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-8">
            <AlertCircle className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 text-sm">No fees found matching your criteria</p>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Add New Fee</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fee Name</label>
                  <input
                    type="text"
                    value={newFee.name}
                    onChange={(e) => setNewFee({ ...newFee, name: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Tuition Fee"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    value={newFee.amount}
                    onChange={(e) => setNewFee({ ...newFee, amount: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={newFee.category}
                    onChange={(e) => setNewFee({ ...newFee, category: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Mandatory">Mandatory</option>
                    <option value="Optional">Optional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Applied To</label>
                  <input
                    type="text"
                    value={newFee.appliedTo}
                    onChange={(e) => setNewFee({ ...newFee, appliedTo: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., All Students"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newFee.dueDate}
                    onChange={(e) => setNewFee({ ...newFee, dueDate: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newFee.description}
                    onChange={(e) => setNewFee({ ...newFee, description: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={3}
                    placeholder="Fee description..."
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleAddFee}
                  className="flex-1 py-1.5 px-3 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors font-medium"
                >
                  Add Fee
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-1.5 px-3 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeesStructure;
