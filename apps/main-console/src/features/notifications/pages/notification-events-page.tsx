import { CalendarClock, Search, Filter, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NotificationEventsPage() {
  return (
    <div className="p-2 sm:p-4">
      <Card className="border-none">
        <CardHeader className="sticky top-0 z-30 mb-3 flex flex-col items-start gap-4 rounded-md border bg-background p-4">
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <CalendarClock className="mr-2 h-6 w-6 flex-shrink-0 rounded-md border border-slate-400 p-1 sm:h-8 sm:w-8" />
                <span className="truncate">Notification Events</span>
              </CardTitle>
              <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Named notification events — created or manually triggered campaigns.
              </div>
            </div>
            <div className="flex flex-nowrap items-center gap-2 overflow-x-auto">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input disabled placeholder="Search events..." className="w-52 pl-8" />
              </div>
              <Button variant="outline" disabled className="flex-shrink-0">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
              <Button variant="outline" disabled className="flex-shrink-0">
                <Download className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Download</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-gray-300 bg-white p-14 text-center">
            <span className="rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
              Under construction
            </span>
            <h2 className="text-lg font-semibold text-gray-900">Coming soon</h2>
            <p className="max-w-md text-sm text-gray-500">
              Creating and manually triggering notification events (bulk campaigns with recipient
              lists and per-field values) will be configured here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
