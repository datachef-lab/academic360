import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Student, mockStudents } from "../data/mock-students";

const DocumentIssuanceHomePage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setFilteredStudents([]);
      setHasSearched(false);
      return;
    }

    setHasSearched(true);
    const query = searchQuery.toLowerCase();
    const filtered = mockStudents.filter(
      (student) =>
        student.name.toLowerCase().includes(query) ||
        student.uid.toLowerCase().includes(query) ||
        student.reg.toLowerCase().includes(query) ||
        student.roll.toLowerCase().includes(query),
    );

    setFilteredStudents(filtered);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3 text-violet-600">Student Document Management</h1>
          <p className="text-gray-600 text-lg">Search and manage student documents efficiently</p>
        </div>
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by Student ID, Registration Number, or Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-12 pr-24 h-14 text-base border-gray-300 focus:border-violet-500 focus:ring-violet-500 shadow-medium"
            />
            <Button
              onClick={handleSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-violet-600 hover:bg-violet-700 text-white"
            >
              Search
            </Button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto">
          {hasSearched && filteredStudents.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg border border-gray-200 shadow-medium">
              <p className="text-gray-500 text-lg">No students found</p>
            </div>
          ) : hasSearched && filteredStudents.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-medium">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ID</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Student ID</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        CU Registration Number
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Semester</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredStudents.map((student, index) => (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-900">{index + 1}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{student.uid}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{student.reg}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{student.semester}</td>
                        <td className="px-6 py-4 text-center">
                          <Button
                            onClick={() => navigate(`student/${student.id}`)}
                            size="sm"
                            className="bg-violet-600 hover:bg-violet-700 text-white"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default DocumentIssuanceHomePage;
