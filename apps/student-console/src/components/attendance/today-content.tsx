import { MockData } from "./data";
import { UpcomingClass } from "@/types/attendance";
import CurrentNextClassCard from "./current-next-class-card";
import UpcomingHolidaysWidget from "./upcoming-holidays-widget";
import TodaySchedule from "./today-schedule";

type TodayContentProps = {
  mockData: MockData;
  currentOrNextClass: UpcomingClass | undefined;
};

export default function TodayContent({
  mockData,
  currentOrNextClass,
}: TodayContentProps) {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Current/Next Class */}
          {currentOrNextClass && (
            <CurrentNextClassCard currentOrNextClass={currentOrNextClass} />
          )}

          {/* Today's Schedule */}
          <TodaySchedule />
        </div>

        {/* Holidays Widget */}
        <UpcomingHolidaysWidget mockData={mockData} />
      </div>
    </>
  );
}
