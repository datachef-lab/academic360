import { FaGraduationCap } from "react-icons/fa";
import { useEffect, useState } from "react";
import axios from "axios";

interface StreamStat {
  streamName: string;
  count: number;
}

interface DashboardStats {
  totalStudents: number;
  streamStats: StreamStat[];
}

export default function Cards() {
  const [stats, setStats] = useState<DashboardStats>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Try to use environment variable first, then fall back to hardcoded URL
        const API_URL = import.meta.env.VITE_API_URL;
        console.log("Using API URL:", API_URL);
        
        const response = await axios.get(
          `${API_URL}/api/stats/dashboard`
        );
        console.log('API Response:', response.data);
        
        // The API returns data in { httpStatusCode, payload, httpStatus, message } format
        if (response.data && response.data.payload) {
          setStats(response.data.payload);
          setError(false);
        } else {
          console.error("Invalid response format:", response.data);
          setError(true);
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Map stats to required format
  const getStreamCount = (name: string) => {
    if (!stats || !stats.streamStats) return 0;
    
    const stream = stats.streamStats.find(
      (s) => s.streamName.toUpperCase() === name.toUpperCase()
    );
    return stream ? stream.count : 0;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 mt-8 sm:grid-cols-4 w-full sm:px-8">
        <div className="flex p-5 items-center bg-gray-200 border overflow-hidden shadow rounded-lg">
          <div className="p-5 animate-pulse bg-gray-300 h-16 w-16 rounded-lg"></div>
          <div className="px-4 w-full">
            <div className="h-4 bg-gray-300 rounded w-3/4 animate-pulse"></div>
            <div className="h-8 bg-gray-300 rounded w-1/2 mt-2 animate-pulse"></div>
          </div>
        </div>
        <div className="flex p-5 items-center bg-gray-200 border overflow-hidden shadow rounded-lg">
          <div className="p-5 animate-pulse bg-gray-300 h-16 w-16 rounded-lg"></div>
          <div className="px-4 w-full">
            <div className="h-4 bg-gray-300 rounded w-3/4 animate-pulse"></div>
            <div className="h-8 bg-gray-300 rounded w-1/2 mt-2 animate-pulse"></div>
          </div>
        </div>
        <div className="flex p-5 items-center bg-gray-200 border overflow-hidden shadow rounded-lg">
          <div className="p-5 animate-pulse bg-gray-300 h-16 w-16 rounded-lg"></div>
          <div className="px-4 w-full">
            <div className="h-4 bg-gray-300 rounded w-3/4 animate-pulse"></div>
            <div className="h-8 bg-gray-300 rounded w-1/2 mt-2 animate-pulse"></div>
          </div>
        </div>
        <div className="flex p-5 items-center bg-gray-200 border overflow-hidden shadow rounded-lg">
          <div className="p-5 animate-pulse bg-gray-300 h-16 w-16 rounded-lg"></div>
          <div className="px-4 w-full">
            <div className="h-4 bg-gray-300 rounded w-3/4 animate-pulse"></div>
            <div className="h-8 bg-gray-300 rounded w-1/2 mt-2 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    console.log("Using fallback data due to API error");
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 px-4 mt-8 sm:grid-cols-4 w-full sm:px-8">
        <div className="flex p-5 items-center bg-green-300 border overflow-hidden shadow rounded-lg">
          <div className="p-5 bg-white text-4xl dark:text-black rounded-lg">
            <FaGraduationCap />
          </div>
          <div className="px-4 text-gray-700 ">
            <h3 className="text-sm tracking-wider font-medium text-center">
              TOTAL_STUDENTS
            </h3>
            <p className="text-3xl font-medium text-center">{stats?.totalStudents || 0}</p>
          </div>
        </div>
        <div className="flex p-5 items-center bg-purple-300 border overflow-hidden shadow rounded-lg">
          <div className="p-5 bg-white text-4xl dark:text-black rounded-lg">
            <FaGraduationCap />
          </div>
          <div className="px-4 text-gray-700 ">
            <h3 className="text-sm tracking-wider font-medium text-center">
              BA
            </h3>
            <p className="text-3xl font-medium text-center">{getStreamCount("BA")}</p>
          </div>
        </div>
        <div className="flex p-5 items-center bg-blue-400 border overflow-hidden shadow rounded-lg">
          <div className="p-5 bg-white text-4xl dark:text-black rounded-lg">
            <FaGraduationCap />
          </div>
          <div className="px-4 text-gray-700 ">
            <h3 className="text-sm tracking-wider font-medium text-center">
              B.COM
            </h3>
            <p className="text-3xl font-medium text-center">{getStreamCount("B.COM")}</p>
          </div>
        </div>
        <div className="flex items-center p-5 bg-indigo-400 border overflow-hidden shadow rounded-lg">
          <div className="p-5 bg-white text-4xl dark:text-black rounded-lg">
            <FaGraduationCap />
          </div>
          <div className="px-4 text-gray-700 ">
            <h3 className="text-sm tracking-wider font-medium text-center">
              B.SC
            </h3>
            <p className="text-3xl font-medium text-center">{getStreamCount("B.SC")}</p>
          </div>
        </div>
        <div className="flex p-5 items-center bg-red-400 border overflow-hidden shadow rounded-lg">
          <div className="p-5 bg-white text-4xl dark:text-black rounded-lg">
            <FaGraduationCap />
          </div>
          <div className="px-4 text-gray-700 ">
            <h3 className="text-sm tracking-wider font-medium text-center">
              BBA
            </h3>
            <p className="text-3xl font-medium text-center">{getStreamCount("BBA")}</p>
          </div>
        </div>
        <div className="flex items-center p-5 bg-yellow-400 border overflow-hidden shadow rounded-lg">
          <div className="p-5 bg-white text-4xl dark:text-black rounded-lg">
            <FaGraduationCap />
          </div>
          <div className="px-4 text-gray-700 ">
            <h3 className="text-sm tracking-wider font-medium text-center">
              M.A
            </h3>
            <p className="text-3xl font-medium text-center">{getStreamCount("MA")}</p>
          </div>
        </div>
        <div className="flex p-5 items-center bg-orange-400 border overflow-hidden shadow rounded-lg">
          <div className="p-5 text-4xl bg-white dark:text-black rounded-lg">
            <FaGraduationCap />
          </div>
          <div className="px-4 text-gray-700 ">
            <h3 className="text-sm tracking-wider font-medium text-center">
              M.COM
            </h3>
            <p className="text-3xl font-medium text-center">{getStreamCount("M.COM")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
