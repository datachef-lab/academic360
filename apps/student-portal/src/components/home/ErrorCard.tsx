import { X } from "lucide-react";
import React from "react";
import { Button } from "../ui/button";

type ErrorCardProps = {
  error: string;
  refetch: () => void;
};

export default function ErrorCard({ error, refetch }: ErrorCardProps) {
  return (
    <div className="flex flex-col items-center justify-center h-[80vh] bg-white rounded-xl p-8 shadow-sm">
      <div className="flex flex-col items-center gap-4 max-w-md text-center">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
          <X className="h-10 w-10 text-red-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900">
          Something went wrong
        </h3>
        <p className="text-gray-600">{error}</p>
        <Button
          className="mt-4 bg-purple-600 hover:bg-purple-700 text-white"
          onClick={() => refetch()}
        >
          Try Again
        </Button>
      </div>
    </div>
  );
}
