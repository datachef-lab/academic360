import { Calendar } from "lucide-react";
import { MockData } from "./data";
import UpcomingHolidaysWidget from "./upcoming-holidays-widget";
import EventCard from "./event-card";

type EventContentProps = {
  mockData: MockData;
};

export default function EventContent({ mockData }: EventContentProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-indigo-100 shadow-md">
          <h2 className="text-xl font-bold text-indigo-800 mb-4 flex items-center">
            <Calendar className="mr-2 h-5 w-5 text-indigo-600" />
            Upcoming College Events
          </h2>
          <div className="space-y-4">
            {mockData.collegeEvents.map((event, index) => (
              <EventCard
                key={`event-${index}`}
                event={event}
                mockData={mockData}
              />
            ))}
          </div>
        </div>
      </div>

      <UpcomingHolidaysWidget mockData={mockData} />
    </div>
  );
}
