import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Calendar, Clock, MapPin } from "lucide-react";
import { Button } from "../ui/button";
import { MockData } from "./data";


type EventDialogProps = {
  mockData: MockData;
  showEventDetails: number | null;
  setShowEventDetails: React.Dispatch<React.SetStateAction<number | null>>;
};

export default function EventDialog({
  mockData,
  showEventDetails,
  setShowEventDetails,
}: EventDialogProps) {
  return (
    <Dialog
      open={showEventDetails !== null}
      onOpenChange={() => setShowEventDetails(null)}
    >
      <DialogContent className="max-w-2xl">
        {showEventDetails && (
          <>
            <DialogHeader>
              <DialogTitle>
                {
                  mockData.collegeEvents.find((e) => e.id === showEventDetails)
                    ?.title
                }
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  {new Date(
                    mockData.collegeEvents.find(
                      (e) => e.id === showEventDetails
                    )?.date || ""
                  ).toLocaleDateString()}
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  {
                    mockData.collegeEvents.find(
                      (e) => e.id === showEventDetails
                    )?.time
                  }
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  {
                    mockData.collegeEvents.find(
                      (e) => e.id === showEventDetails
                    )?.location
                  }
                </div>
              </div>
              <p className="text-gray-700">
                {
                  mockData.collegeEvents.find((e) => e.id === showEventDetails)
                    ?.description
                }
              </p>
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500">
                  Registration Deadline:{" "}
                  {new Date(
                    mockData.collegeEvents.find(
                      (e) => e.id === showEventDetails
                    )?.registrationDeadline || ""
                  ).toLocaleDateString()}
                </p>
              </div>
              <Button className="w-full mt-4">Register Now</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
