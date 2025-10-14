import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { MisStats } from "../types/mis-types";

interface MisStatsCardProps {
  stats: MisStats;
  isLoading?: boolean;
}

export function MisStatsCard({ stats, isLoading }: MisStatsCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Real-time Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatLastUpdated = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m ago`;
    } else {
      return date.toLocaleTimeString();
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-4 w-4" />
          Real-time Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Completion Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Subject Selection Progress</span>
            <Badge variant="secondary" className="text-xs">
              {stats.completionPercentage}%
            </Badge>
          </div>
          <Progress value={stats.completionPercentage} className="h-1.5" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded">
              <Users className="h-3 w-3 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Total Admitted</p>
              <p className="text-sm font-semibold">{stats.totalAdmitted.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-green-100 rounded">
              <CheckCircle className="h-3 w-3 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Selection Done</p>
              <p className="text-sm font-semibold">{stats.totalSubjectSelectionDone.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          <span>Last updated: {formatLastUpdated(stats.lastUpdated)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
