import { FaGraduationCap } from "react-icons/fa";
import { useEffect, useState } from "react";
import { getStudentStats, getSemesterStats, StudentStats, SemesterStats } from "@/services/stats";
import { Skeleton } from "@/components/ui/skeleton";

export default function Cards() {
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [semesterStats, setSemesterStats] = useState<SemesterStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'semester'>('general');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedSemesterYear, setSelectedSemesterYear] = useState<number | 'all'>('all');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await getStudentStats();
        setStats(data);
        const semData = await getSemesterStats();
        setSemesterStats(semData);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch statistics:", err);
        setError("Failed to load statistics. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Get all available years from stats
  const getAvailableYears = (): number[] => {
    if (!stats) return [];
    
    const years = new Set<number>();
    
    Object.values(stats.courseStats).forEach(course => {
      Object.keys(course.years).forEach(year => {
        years.add(Number(year));
      });
    });
    
    return Array.from(years).sort((a, b) => b - a); // Sort years in descending order
  };

  // Get all available years from semester stats
  const getAvailableSemesterYears = (): number[] => {
    if (!semesterStats) return [];
    
    const years = new Set<number>();
    
    semesterStats.degrees.forEach(degree => {
      Object.values(degree.semesters).forEach(semester => {
        if (semester.year) {
          years.add(Number(semester.year));
        }
      });
    });
    
    return Array.from(years).sort((a, b) => b - a); // Sort years in descending order
  };

  // Helper function to render a card with loading state
  const renderCard = (title: string, data: { count: number, years: Record<number, number> } | undefined, bgColor: string) => {
    const count = data ? 
      selectedYear === 'all' ? 
        data.count : 
        data.years[selectedYear] || 0 
      : 0;
    
    return (
      <div className={`flex p-5 items-center ${bgColor} border overflow-hidden shadow rounded-lg`}>
        <div className="p-5 bg-white text-4xl dark:text-black rounded-lg">
          <FaGraduationCap />
        </div>
        <div className="px-4 text-gray-700">
          <h3 className="text-sm tracking-wider font-medium text-center">
            {title}
          </h3>
          {loading ? (
            <Skeleton className="h-10 w-20 bg-gray-200 mx-auto mt-1" />
          ) : (
            <p className="text-3xl font-bold text-center">{count}</p>
          )}
        </div>
      </div>
    );
  };

  // Helper function to render a semester card
  const renderSemesterCard = (degreeInfo: SemesterStats['degrees'][0], bgColor: string) => {
    const { name, semesters, totalStudents } = degreeInfo;
    
    // Filter semesters by year if a specific year is selected
    const filteredSemesters = selectedSemesterYear === 'all' 
      ? semesters 
      : Object.entries(semesters).reduce((acc, [semNum, semData]) => {
          if (semData.year === selectedSemesterYear) {
            acc[Number(semNum)] = semData;
          }
          return acc;
        }, {} as typeof semesters);
    
    // If no semesters for this degree in the selected year, hide the card
    if (selectedSemesterYear !== 'all' && Object.keys(filteredSemesters).length === 0) {
      return null;
    }
    
    // Calculate sum of semester counts for verification
    const semesterSum = Object.values(filteredSemesters).reduce((sum, semData) => sum + (semData.count || 0), 0);
    const hasIncompleteData = semesterSum > totalStudents;
    
    // Get displayed semester numbers after filtering
    const displayedSemesters = Object.keys(filteredSemesters)
      .map(Number)
      .sort((a, b) => a - b);
    
    return (
      <div className={`flex flex-col p-5 ${bgColor} border overflow-hidden shadow rounded-lg`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="p-3 bg-white text-3xl dark:text-black rounded-lg">
              <FaGraduationCap />
            </div>
            <h3 className="ml-3 text-lg font-semibold text-gray-700">{name}</h3>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-600">Total Students</p>
            <div className="flex items-center">
              <p className="text-xl font-bold">{selectedSemesterYear === 'all' ? totalStudents : semesterSum}</p>
              {hasIncompleteData && (
                <span className="ml-1 text-xs text-amber-600 font-medium" title="Some students are enrolled in multiple semesters">*</span>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {displayedSemesters.map(semester => (
            <div 
              key={`${name}-${semester}`} 
              className={`bg-white bg-opacity-50 p-3 rounded-md transform transition-all duration-200 hover:shadow-md ${filteredSemesters[semester]?.count ? "hover:scale-105" : "opacity-50"}`}
            >
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-gray-600">Semester {semester}</p>
                {filteredSemesters[semester]?.year && (
                  <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium">
                    {filteredSemesters[semester].year}
                  </span>
                )}
              </div>
              <p className="text-xl font-bold">{filteredSemesters[semester]?.count || 0}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="p-4 text-center text-red-600 bg-red-50 rounded-lg border border-red-200 my-8">
        <p className="font-medium">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const tabColors = {
    active: "bg-blue-500 text-white",
    inactive: "bg-gray-200 text-gray-700 hover:bg-gray-300"
  };

  // Sort degrees by name for consistent display
  const sortedDegrees = semesterStats?.degrees.slice().sort((a, b) => a.name.localeCompare(b.name)) || [];
  const availableYears = getAvailableYears();
  const availableSemesterYears = getAvailableSemesterYears();

  // Render the year filter component
  const renderYearFilter = (years: number[], selectedYear: number | 'all', setSelectedYear: (year: number | 'all') => void, label: string = "Academic Year:") => (
    <div className="relative flex items-center bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 hover:shadow transition-all">
      <svg 
        className="w-5 h-5 text-gray-500 mr-2" 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 20 20" 
        fill="currentColor"
      >
        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
      </svg>
      <label htmlFor="yearFilter" className="text-sm font-medium text-gray-700 mr-2">
        {label}
      </label>
      <select
        value={selectedYear === 'all' ? 'all' : selectedYear.toString()}
        onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
        className="bg-transparent text-gray-800 font-medium focus:outline-none cursor-pointer"
      >
        <option value="all">All Years</option>
        {years.map(year => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div>
      <div className="flex justify-center space-x-4 mb-6 mt-8">
        <button
          className={`px-4 py-2 rounded-lg transition-colors ${activeTab === "general" ? tabColors.active : tabColors.inactive}`}
          onClick={() => setActiveTab("general")}
        >
          General Stats
        </button>
        <button
          className={`px-4 py-2 rounded-lg transition-colors ${activeTab === "semester" ? tabColors.active : tabColors.inactive}`}
          onClick={() => setActiveTab("semester")}
        >
          Semester-wise Stats
        </button>
      </div>

      {activeTab === "general" ? (
        <div>
          {!loading && availableYears.length > 0 && (

            <div className="flex justify-between items-center mb-6 px-4 sm:px-8">
              <h2 className="text-xl font-bold text-gray-800">📊 Enrollment Statistics</h2>  
              {renderYearFilter(availableYears, selectedYear, setSelectedYear)}
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-4 w-full sm:px-8">
            {renderCard("TOTAL STUDENTS", { 
              count: stats?.totalStudents || 0, 
              years: stats ? availableYears.reduce((acc, year) => {
                acc[year] = Object.values(stats.courseStats).reduce(
                  (sum, course) => sum + (course.years[year] || 0), 
                  0
                );
                return acc;
              }, {} as Record<number, number>) : {} 
            }, "bg-green-300")}
            {renderCard("BA", stats?.courseStats.BA, "bg-purple-300")}
            {renderCard("B.COM", stats?.courseStats["B.COM"], "bg-blue-400")}
            {renderCard("B.SC", stats?.courseStats["B.SC"], "bg-indigo-400")}
            {renderCard("BBA", stats?.courseStats.BBA, "bg-red-400")}
            {renderCard("M.A", stats?.courseStats["M.A"], "bg-yellow-400")}
            {renderCard("M.COM", stats?.courseStats["M.COM"], "bg-orange-400")}
          </div>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-6 px-4 sm:px-8">
            <h2 className="text-xl font-bold text-gray-800">🎓 Student Distribution by Semester</h2>
            {!loading && availableSemesterYears.length > 0 && (
              renderYearFilter(availableSemesterYears, selectedSemesterYear, setSelectedSemesterYear)
            )}
          </div>

          {!loading && sortedDegrees.length > 0 && (
            <div className="mb-6 px-4 sm:px-8">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-lg p-5 text-white">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Overall Enrollment Summary</h3>
                  <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                    <span className="text-sm font-medium">
                      {(() => {
                        const today = new Date();
                        const dd = String(today.getDate()).padStart(2, "0");
                        const mm = String(today.getMonth() + 1).padStart(2, "0"); 
                        const yyyy = today.getFullYear();
                        return `${dd}-${mm}-${yyyy}`;
                      })()}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                    <p className="text-sm font-medium opacity-80">Total Students</p>
                    <p className="text-2xl font-bold">
                      {selectedSemesterYear === 'all' 
                        ? sortedDegrees.reduce((sum, degree) => sum + degree.totalStudents, 0)
                        : sortedDegrees.reduce((sum, degree) => {
                            const degreeCount = Object.values(degree.semesters)
                              .filter(sem => sem.year === selectedSemesterYear)
                              .reduce((sum, sem) => sum + sem.count, 0);
                            return sum + degreeCount;
                          }, 0)
                      }
                    </p>
                  </div>
                  <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                    <p className="text-sm font-medium opacity-80">Programs</p>
                    <p className="text-2xl font-bold">
                      {selectedSemesterYear === 'all' 
                        ? sortedDegrees.length
                        : sortedDegrees.filter(degree => 
                            Object.values(degree.semesters).some(
                              sem => sem.year === selectedSemesterYear
                            )).length
                      }
                    </p>
                  </div>
                  <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                    <p className="text-sm font-medium opacity-80">Highest Enrollment</p>
                    <p className="text-2xl font-bold">
                      {sortedDegrees.length > 0
                        ? (selectedSemesterYear === 'all' 
                          ? sortedDegrees.reduce(
                              (max, deg) => (deg.totalStudents > max.totalStudents ? deg : max),
                              sortedDegrees[0])
                          : sortedDegrees
                              .map(deg => ({
                                name: deg.name,
                                count: Object.values(deg.semesters)
                                  .filter(sem => sem.year === selectedSemesterYear)
                                  .reduce((sum, sem) => sum + sem.count, 0)
                              }))
                              .reduce((max, curr) => curr.count > max.count ? curr : max, 
                                { name: "N/A", count: 0 })
                        ).name
                        : "N/A"}
                    </p>
                  </div>
                  <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                    <p className="text-sm font-medium opacity-80">
                      {selectedSemesterYear === 'all' ? "Max Semesters" : "Year"}
                    </p>
                    <p className="text-2xl font-bold">
                      {selectedSemesterYear === 'all'
                        ? (sortedDegrees.length > 0 ? Math.max(...sortedDegrees.map((d) => d.maxSemesters)) : 0)
                        : selectedSemesterYear}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4 sm:px-8">
            {loading ? (
              Array(3)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="border rounded-lg p-5 shadow">
                    <Skeleton className="h-10 w-32 mb-3" />
                    <div className="grid grid-cols-2 gap-2">
                      {Array(2)
                        .fill(0)
                        .map((_, j) => (
                          <div key={j} className="p-2">
                            <Skeleton className="h-6 w-24 mb-2" />
                            <Skeleton className="h-8 w-16" />
                          </div>
                        ))}
                    </div>
                  </div>
                ))
            ) : sortedDegrees.length > 0 ? (
              sortedDegrees.map((degreeInfo) => {
                const bgColors = [
                  "bg-purple-300",
                  "bg-blue-300",
                  "bg-indigo-300",
                  "bg-red-300",
                  "bg-yellow-300",
                  "bg-orange-300",
                  "bg-green-300",
                  "bg-teal-300",
                  "bg-cyan-300",
                ];
                const renderedCard = renderSemesterCard(degreeInfo, bgColors[Math.abs(degreeInfo.id) % bgColors.length]);
                return renderedCard; // Only render cards that match the selected year filter
              }).filter(Boolean) // Filter out null values (hidden cards)
            ) : (
              <div className="col-span-full text-center p-8 bg-gray-100 rounded-lg">
                <p className="text-gray-500">No semester data available</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
