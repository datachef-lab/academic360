import { Users } from "lucide-react";
import React from "react";
import { Button } from "../ui/button";

export default function BatchesMissingCard({
  refetch,
}: {
  refetch: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-[80vh] bg-white rounded-xl p-8 shadow-sm">
      <div className="flex flex-col items-center gap-4 max-w-md text-center">
        <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center">
          <Users className="h-10 w-10 text-amber-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900">
          No course enrollment found
        </h3>
        <p className="text-gray-600">
          We couldn&apos;t find any course enrollment information for your
          account. If you believe this is an error, please contact the
          administration.
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
