import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export default function OverviewTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <Card className="shadow-sm border">
          <CardHeader>
            <CardTitle className="text-sm">Overview</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">No data available.</CardContent>
        </Card>
        <Card className="shadow-sm border">
          <CardHeader>
            <CardTitle className="text-sm">Attendance</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">No data available.</CardContent>
        </Card>
        <Card className="shadow-sm border">
          <CardHeader>
            <CardTitle className="text-sm">Fee Details</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">No data available.</CardContent>
        </Card>
      </div>
    </div>
  );
}
