import { Calendar, Clock, MapPin } from "lucide-react";
import React from "react";
import { Badge } from "../ui/badge";
import EventDialog from "./event-dialog";
import { MockData } from "./data";

type EventCardProps = {
  mockData: MockData;
  event: {
    id: number;
    title: string;
    date: string;
    time: string;
    location: string;
    type: string;
    description: string;
    registrationDeadline: string;
  };
};

export default function EventCard({ event, mockData }: EventCardProps) {
  const [showEventDetails, setShowEventDetails] = React.useState<number | null>(
    null
  );

  return (
    <>
      <div
        className="bg-white border border-indigo-100 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer flex items-start gap-4"
        onClick={() => setShowEventDetails(event.id)}
      >
        <div className="flex-shrink-0 p-3 bg-indigo-50 rounded-lg text-indigo-600 shadow-sm">
          <Calendar size={20} />
        </div>
        <div className="flex-grow flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-indigo-800 mb-1">
              {event.title}
            </h3>
            <p className="text-sm text-gray-600">{event.description}</p>
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-3">
              <Badge
                variant="outline"
                className="bg-indigo-100 text-indigo-800 border-indigo-300"
              >
                {event.type}
              </Badge>
              <span className="text-sm text-gray-500 flex items-center">
                <Calendar className="w-4 h-4 mr-1 text-indigo-500" />
                {new Date(event.date).toLocaleDateString()}
              </span>
              <span className="text-sm text-gray-500 flex items-center">
                <Clock className="w-4 h-4 mr-1 text-indigo-500" />
                {event.time}
              </span>
              <span className="text-sm text-gray-500 flex items-center">
                <MapPin className="w-4 h-4 mr-1 text-indigo-500" />
                {event.location}
              </span>
            </div>
          </div>
          {/* Keeping registration status badge as it is relevant */}
          <Badge
            className={`${
              new Date(event.registrationDeadline) > new Date()
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {new Date(event.registrationDeadline) > new Date()
              ? "Registration Open"
              : "Registration Closed"}
          </Badge>
        </div>
      </div>

      <EventDialog
        mockData={mockData}
        showEventDetails={showEventDetails}
        setShowEventDetails={setShowEventDetails}
      />
    </>
  );
}
