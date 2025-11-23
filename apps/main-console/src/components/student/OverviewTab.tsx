import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export default function OverviewTab() {
  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card className="shadow-sm border">
          <CardHeader className="p-3 sm:p-4">
            <CardTitle className="text-sm sm:text-base">Overview</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 text-xs sm:text-sm text-muted-foreground">
            No data available.
          </CardContent>
        </Card>
        <Card className="shadow-sm border">
          <CardHeader className="p-3 sm:p-4">
            <CardTitle className="text-sm sm:text-base">Attendance</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 text-xs sm:text-sm text-muted-foreground">
            No data available.
          </CardContent>
        </Card>
        <Card className="shadow-sm border">
          <CardHeader className="p-3 sm:p-4">
            <CardTitle className="text-sm sm:text-base">Fee Details</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 text-xs sm:text-sm text-muted-foreground">
            No data available.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
