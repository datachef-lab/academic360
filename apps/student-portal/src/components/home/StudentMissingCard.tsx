import React from "react";
import { Button } from "../ui/button";
import { X } from "lucide-react";

export default function StudentMissingCard({
  refetch,
}: {
  refetch: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-[80vh] bg-white rounded-xl p-8 shadow-sm">
      <div className="flex flex-col items-center gap-4 max-w-md text-center">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
          <X className="h-10 w-10 text-red-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900">
          Unable to load student data
        </h3>
        <p className="text-gray-600">
          We couldn&apos;t retrieve your student information. Please try
          refreshing the page or contact support if the problem persists.
        </p>
        <Button
          className="mt-4 bg-purple-600 hover:bg-purple-700 text-white"
          onClick={() => refetch()}
        >
          Refresh Data
        </Button>
      </div>
    </div>
  );
}
