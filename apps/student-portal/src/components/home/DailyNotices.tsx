"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { FileText } from "lucide-react";
import { useRouter } from "next/navigation";


const dailyNotices = [
  // {
  //   id: 1,
  //   title: "Prelim payment due",
  //   description:
  //     "Next semester fee payment is due by May 15. Please visit the fees section to complete your payment and avoid late fees.",
  //   link: "/dashboard/enrollment-fees",
  // },
  {
    id: 2,
    title: "Exam schedule",
    description:
      "Check the exams section for your personal schedule and room assignments.",
    link: "/dashboard/exams",
  },
  {
    id: 3,
    title: "Course Catalogue",
    description:
      "Registration for next semester courses opens on May 20. Review available courses and plan your schedule in advance.",
    link: "/dashboard/course-catalogue",
  },
  {
    id: 4,
    title: "College Website",
    description:
      "The college website has been updated with the latest academic calendar and campus news. Visit for more details.",
    link: "https://www.thebges.edu.in/category/noticeboard/",
    external: true,
  },
];

export default function DailyNotices() {
  const router = useRouter();

  return (
    <Card className="border-0 shadow-md rounded-2xl overflow-hidden bg-white">
      <CardHeader className="pt-3 pb-2 px-5 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold text-black">
          Daily Notice
        </CardTitle>
        <Button
          variant="link"
          size="sm"
          className="text-[#925FE2] hover:text-purple-800 h-auto p-0 text-sm font-medium"
        >
          See all
        </Button>
      </CardHeader>
      <CardContent className="px-5 pt-1 pb-3 space-y-3">
        {dailyNotices.slice(0, 4).map((notice) => (
          <div
            key={notice.id}
            className="border-b border-gray-100 pb-3 last:border-0 last:pb-0 group hover:bg-gray-50 rounded-lg transition-all cursor-pointer -mx-2 px-2"
            onClick={() => {
              if (notice.external) {
                window.open(notice.link, "_blank", "noopener,noreferrer");
              } else if (notice.link) {
                router.push(notice.link);
              }
            }}
          >
            <h4 className="font-semibold text-sm text-black mb-1 group-hover:text-purple-700 transition-colors">
              {notice.title}
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
              {notice.description}
            </p>
            {notice.external && (
              <div className="flex items-center gap-1 mt-1.5 text-xs text-purple-600">
                <FileText className="h-3 w-3" />
                <span>External link</span>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
