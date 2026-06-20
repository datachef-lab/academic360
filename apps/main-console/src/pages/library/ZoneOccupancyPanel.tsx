/**
 * Zone occupancy panel — a grid of zone cards (currentInside, peakToday) plus
 * a 24-hour bar chart per zone. Lives on `LibraryDashboard` as a new section.
 *
 * Inherits branch scope from `useActiveLibraryBranchId`; switching the
 * right-sidebar branch refetches the list of zones.
 */

import { useCallback, useEffect, useState } from "react";
import { Loader2, MapPin, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getZoneOccupancyList, type ZoneOccupancyRow } from "@/services/library-zones.service";
import { useActiveLibraryBranchId } from "@/features/library/use-library-branch";

export function ZoneOccupancyPanel() {
  const [activeBranchId] = useActiveLibraryBranchId();
  const [rows, setRows] = useState<ZoneOccupancyRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getZoneOccupancyList(activeBranchId ?? undefined);
      setRows(res.payload ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [activeBranchId]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200"
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-emerald-600" />
          <h2 className="text-sm font-semibold text-gray-800">Zone occupancy (today)</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={() => void fetchRows()}>
          <RefreshCw className={`mr-1 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {loading && rows.length === 0 ? (
        <div className="flex justify-center py-10 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="py-10 text-center text-sm text-gray-500">
          No zones configured for this branch. Add zones in Library → Masters → Zones.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {rows.map((z) => (
            <div
              key={z.zoneId ?? "x"}
              className="rounded-xl border border-gray-200 bg-gray-50/50 p-4"
            >
              <div className="mb-3 flex items-baseline justify-between">
                <h3 className="font-medium text-gray-800">{z.zoneName ?? "(unnamed)"}</h3>
                <span className="text-xs text-gray-500">
                  {z.recentGateEvents} gate event{z.recentGateEvents === 1 ? "" : "s"} today
                </span>
              </div>
              <div className="mb-3 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-md bg-white p-2 ring-1 ring-gray-200">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Currently inside</p>
                  <p className="text-2xl font-bold text-emerald-700">{z.currentInside}</p>
                </div>
                <div className="rounded-md bg-white p-2 ring-1 ring-gray-200">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Peak today</p>
                  <p className="text-2xl font-bold text-indigo-700">{z.peakToday}</p>
                </div>
              </div>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={z.byHour}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2ff" />
                    <XAxis dataKey="hour" stroke="#6b7280" fontSize={10} />
                    <YAxis stroke="#6b7280" fontSize={10} allowDecimals={false} width={24} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
