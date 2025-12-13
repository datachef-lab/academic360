import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { MisTable } from "../components/MisTable";
import { MisFiltersComponent } from "../components/MisFilters";
import { useMisSocket } from "../hooks/useMisSocket";
import { MisApiService } from "../services/mis-api.service";
import { MisFilters, MisTableData } from "../types/mis-types";
import { findSessionsByAcademicYear } from "@/services/session.service";
import { classService } from "@/services/class.service";
import { Session } from "@/types/academics/session";
import { Activity, Shield, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentAcademicYear } from "@/store/slices/academicYearSlice";
import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";

export default function RealTimeTrackerPage() {
  useRestrictTempUsers();
  const [filters, setFilters] = useState<MisFilters>({});
  const [currentData, setCurrentData] = useState<MisTableData | null>(null);
  const { user } = useAuth();
  const updateFiltersRef = useRef<((filters: MisFilters) => void) | null>(null);

  // Get current academic year from Redux
  const currentAcademicYear = useAppSelector(selectCurrentAcademicYear);

  // Fetch sessions based on current academic year
  const { data: sessions = [], isLoading: isLoadingSessions } = useQuery(
    ["sessions", currentAcademicYear?.id || "no-year"],
    () =>
      currentAcademicYear?.id
        ? findSessionsByAcademicYear(currentAcademicYear.id)
        : Promise.resolve({
            httpStatusCode: 200,
            httpStatus: "SUCCESS",
            payload: [],
            message: "No academic year selected",
          }),
    {
      select: (response) => response.payload || [],
      enabled: !!currentAcademicYear,
    },
  );

  // Fetch classes and find semester 1
  const { data: classes = [], isLoading: isLoadingClasses } = useQuery(
    ["classes"],
    () => classService.findAllClasses(),
    {
      select: (response) => response.payload || [],
    },
  );

  // Find semester 1 class
  const semester1Class = classes.find((cls) => cls.name === "SEMESTER I");

  // Set default filters when semester 1 class is found and session is available
  useEffect(() => {
    const newFilters: MisFilters = {};

    // Set default class to semester 1
    if (semester1Class && !filters.classId) {
      newFilters.classId = semester1Class.id;
    }

    // Set default session from current academic year
    if (Array.isArray(sessions) && sessions.length > 0 && !filters.sessionId) {
      // Find current session or first session
      const currentSession =
        (sessions as Session[]).find((s: Session) => s.isCurrentSession) || (sessions as Session[])[0];
      if (currentSession && currentSession.id) {
        newFilters.sessionId = currentSession.id;
      }
    }

    // Update filters if we have changes
    if (Object.keys(newFilters).length > 0) {
      setFilters((prev) => ({
        ...prev,
        ...newFilters,
      }));
    }
  }, [semester1Class, sessions, filters.classId, filters.sessionId]);

  // Set session when academic year changes
  useEffect(() => {
    if (currentAcademicYear?.id && Array.isArray(sessions) && sessions.length > 0 && !filters.sessionId) {
      // Find current session or first session for this academic year
      const currentSession =
        (sessions as Session[]).find((s: Session) => s.isCurrentSession) || (sessions as Session[])[0];
      if (currentSession && currentSession.id) {
        setFilters((prev) => ({
          ...prev,
          sessionId: currentSession.id,
        }));
      }
    }
  }, [currentAcademicYear?.id, sessions, filters.sessionId]);

  // Initial data fetch
  const {
    data: initialData,
    isLoading: isLoadingInitial,
    error: apiError,
  } = useQuery({
    queryKey: ["mis-data", filters],
    queryFn: () => MisApiService.getMisTableData(filters),
    enabled: true,
    retry: false, // Don't retry on auth errors
  });

  // Real-time socket connection
  const {
    isConnected,
    isLoading: isSocketLoading,
    data: socketData,
    lastUpdate,
    updateFilters,
  } = useMisSocket({
    userId: user?.id?.toString(), // Use actual user ID from auth context
    filters,
    onUpdate: (data) => {
      setCurrentData(data);
      toast.success("Real-time data updated", {
        description: `Updated ${data.data.length} program courses`,
      });
    },
    onError: (error) => {
      toast.error("Connection error", {
        description: error,
      });
    },
  });

  // Update current data when socket data changes
  useEffect(() => {
    if (socketData) {
      setCurrentData(socketData);
    } else if (initialData) {
      setCurrentData(initialData);
    }
  }, [socketData, initialData]);

  // Store updateFilters function in ref
  useEffect(() => {
    updateFiltersRef.current = updateFilters;
  }, [updateFilters]);

  // Update socket filters when local filters change
  useEffect(() => {
    if (updateFiltersRef.current) {
      updateFiltersRef.current(filters);
    }
  }, [filters]);

  const handleFiltersChange = (newFilters: MisFilters) => {
    setFilters(newFilters);
  };

  const isLoading = isLoadingInitial || isSocketLoading;

  // Handle API errors
  useEffect(() => {
    if (apiError) {
      console.error("API Error:", apiError);
      const errorMessage = (apiError as Error)?.message || String(apiError);
      if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
        toast.error("Authentication required", {
          description: "Please log in to access real-time data",
        });
      } else {
        toast.error("Failed to load data", {
          description: errorMessage || "An error occurred",
        });
      }
    }
  }, [apiError]);

  // Show authentication message if user is not logged in
  if (!user) {
    return (
      <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Activity className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-600 mb-2">Authentication Required</h2>
            <p className="text-sm sm:text-base text-gray-500">Please log in to access the real-time tracker.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Section - Filters and System Status */}
      <div className="flex-shrink-0 border-b bg-gray-50">
        <div className="p-3 sm:p-4">
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
            {/* Filters Panel */}
            <div className="flex-1">
              <MisFiltersComponent
                filters={filters}
                onFiltersChange={handleFiltersChange}
                sessions={Array.isArray(sessions) ? sessions : []}
                classes={classes}
                isLoadingSessions={isLoadingSessions}
                isLoadingClasses={isLoadingClasses}
              />
            </div>

            {/* System Status Card */}
            <div className="lg:w-80 flex-shrink-0">
              <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                  System Status
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between p-2 sm:p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                      <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                      <span className="text-xs font-medium text-blue-800">Admin/Staff Online</span>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-blue-800">
                      {isConnected && (user?.type === "ADMIN" || user?.type === "STAFF") ? "1" : "0"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 sm:p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                      <span className="text-xs font-medium text-green-800">Students Online</span>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-green-800">
                      {isConnected && user?.type === "STUDENT" ? "1" : "0"}
                    </span>
                  </div>
                  {lastUpdate && (
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-xs font-medium text-gray-700">Last Update</span>
                      <span className="text-xs font-medium text-gray-600">
                        {new Date(lastUpdate).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Table */}
      <div className="flex-1 min-w-0">
        {/* Subject Selection Table */}
        <div>
          {currentData && <MisTable data={currentData} isLoading={isLoading} />}

          {/* Loading State */}
          {!currentData && isLoading && (
            <div className="flex items-center justify-center min-h-[400px] p-4">
              <div className="text-center">
                <Activity className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-sm sm:text-base text-gray-600">Loading real-time data...</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!currentData && !isLoading && !apiError && (
            <div className="flex items-center justify-center min-h-[400px] p-4">
              <div className="text-center">
                <Activity className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-600 mb-2">No Data Available</h3>
                <p className="text-xs sm:text-sm text-gray-500">Real-time data will appear here once available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Real-time Indicator */}
      {isConnected && (
        <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-50">
          <div className="flex items-center gap-2 bg-red-600 text-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg shadow-lg">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse" />
            <span className="text-xs sm:text-sm font-medium">Live Updates</span>
          </div>
        </div>
      )}
    </div>
  );
}
