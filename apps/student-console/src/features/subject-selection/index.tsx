import React from "react";
import Instructions from "./components/instructions";
import { Card, CardTitle, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import SubjectSelectionForm from "./components/subject-selection-form";

export default function SubjectSelection() {
  return (
    <div className="p-4 flex gap-3 w-screen h-screen">
      <div className="w-1/3 h-full border py-4 bg-white">
        <Instructions />
      </div>
      <div style={{ width: "66%" }} className="w-[66%] h-full">
        <Card className="w-full bg-white shadow-md rounded-xl">
          <CardHeader>
            <div className="flex items-center gap-6">
              {/* Student Image */}
              <img
                src="https://74.207.233.48:8443/hrclIRP/studentimages/Student_Image_0101255656.jpg"
                height={120}
                width={120}
                className="rounded-lg border shadow-sm object-cover"
                alt="Student"
              />

              {/* Student Info */}
              <div className="flex w-full justify-between">
                {/* Left Column */}
                <div className="flex flex-col space-y-3 w-1/2">
                  <div className="flex">
                    <p className="w-1/2 text-gray-500 font-medium">Student Name:</p>
                    <p className="w-1/2 font-semibold text-gray-800">Dipanwita Sarkar</p>
                  </div>
                  <div className="flex">
                    <p className="w-1/2 text-gray-500 font-medium">Roll Number:</p>
                    <p className="w-1/2 font-semibold text-gray-800">251000</p>
                  </div>
                </div>

                {/* Right Column */}
                <div className="flex flex-col space-y-3 w-1/2">
                  <div className="flex">
                    <p className="w-1/2 text-gray-500 font-medium">UID:</p>
                    <p className="w-1/2 font-semibold text-gray-800">0101255656</p>
                  </div>
                  <div className="flex">
                    <p className="w-1/2 text-gray-500 font-medium">Course:</p>
                    <p className="w-1/2 font-semibold text-gray-800">B.A. English (H) (Day)</p>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
        <SubjectSelectionForm />
      </div>
    </div>
  );
}
