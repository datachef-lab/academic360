import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExamDto, ExamPapersWithStats, ExamSubjectDto } from "@/dtos";
import { FaEdit } from "react-icons/fa";

export default function ExamPaperRow({
  exam,
  examPapersWithStat,
  onEdit,
}: {
  exam: ExamDto;
  examPapersWithStat: ExamPapersWithStats;
  onEdit: (examSubject: ExamSubjectDto) => void;
}) {
  const formatExamTimeRange = (examSubjects: ExamSubjectDto[]): string => {
    if (!examSubjects || examSubjects.length === 0) return "-";

    const times = examSubjects.map((es) => ({
      start: new Date(es.startTime),
      end: new Date(es.endTime),
    }));

    const minStart = new Date(Math.min(...times.map((t) => t.start.getTime())));
    const maxEnd = new Date(Math.max(...times.map((t) => t.end.getTime())));

    const formatTime = (date: Date): string => {
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";

      hours = hours % 12 || 12;
      return `${hours}:${minutes} ${ampm}`;
    };

    // ✅ Check if all subjects have SAME start AND SAME end
    const allSameTime = times.every(
      (t) => t.start.getTime() === minStart.getTime() && t.end.getTime() === times[0]!.end.getTime(),
    );

    if (allSameTime) {
      // ✅ minStart & times[0] are now guaranteed
      return `${formatTime(minStart)} - ${formatTime(times[0]!.end)}`;
    }

    return `${formatTime(minStart)} - ${formatTime(maxEnd)}`;
  };

  const formatExamDateRange = (examSubjects: ExamSubjectDto[]) => {
    if (!examSubjects || examSubjects.length === 0) return "-";

    // Extract and parse dates
    const dates = examSubjects.map((es) => ({
      start: new Date(es.startTime),
      end: new Date(es.endTime),
    }));

    // Find min start and max end
    const minStart = new Date(Math.min(...dates.map((d) => d.start.getTime())));
    const maxEnd = new Date(Math.max(...dates.map((d) => d.end.getTime())));

    // Format helper: dd/MM/yyyy
    const formatDate = (date: Date): string => {
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    // Check if ALL subjects are on the exact same day (compare date parts only)
    const allSameDay = dates.every((d) => {
      return (
        d.start.getDate() === minStart.getDate() &&
        d.start.getMonth() === minStart.getMonth() &&
        d.start.getFullYear() === minStart.getFullYear() &&
        d.end.getDate() === minStart.getDate() &&
        d.end.getMonth() === minStart.getMonth() &&
        d.end.getFullYear() === minStart.getFullYear()
      );
    });

    if (allSameDay) {
      return formatDate(minStart); // Show only one date
    }

    return `${formatDate(minStart)} - ${formatDate(maxEnd)}`;
  };

  return (
    <div className="flex border-b hover:bg-gray-50 group" style={{ minWidth: "950px" }}>
      <div className="flex-shrink-0 p-3 border-r flex items-center justify-center" style={{ width: "12.5%" }}>
        <p>
          <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-700 bg-emerald-50">
            {
              exam.examSubjectTypes.find((ele) => ele.subjectType.id === examPapersWithStat.paper.subjectTypeId)
                ?.subjectType.code
            }
          </Badge>
        </p>
      </div>
      <div className="flex-shrink-0 p-3 border-r flex flex-col" style={{ width: "18.5%" }}>
        <div className="mt-1 flex flex-col gap-1">
          <p className="text-xs">
            {examPapersWithStat.paper.name}
            {!examPapersWithStat.paper.isOptional && <span className="text-red-500">*</span>}
          </p>
          <p>
            <Badge variant="outline" className="text-xs border-indigo-300 text-indigo-700 bg-indigo-50">
              {exam.examSubjects.find((ele) => ele.id === examPapersWithStat.examSubjectId)?.subject.name}
            </Badge>
          </p>
        </div>
      </div>

      <div className="flex-shrink-0 p-3 border-r flex flex-col" style={{ width: "12.5%" }}>
        <div className="mt-1 flex flex-col gap-1">
          <p className="text-xs">{examPapersWithStat.paper.code}</p>
        </div>
      </div>

      <div className="flex-shrink-0 p-3 border-r flex flex-col" style={{ width: "12.5%" }}>
        <div className="mt-1 flex flex-col gap-1">
          <p className="text-xs">
            {formatExamDateRange([exam.examSubjects.find((ele) => ele.id === examPapersWithStat.examSubjectId)!])}
          </p>
        </div>
      </div>

      <div className="flex-shrink-0 p-3 border-r flex flex-col" style={{ width: "12.5%" }}>
        <div className="mt-1 flex flex-col gap-1">
          <p className="text-xs">
            {formatExamTimeRange([exam.examSubjects.find((ele) => ele.id === examPapersWithStat.examSubjectId)!])}
          </p>
        </div>
      </div>

      <div className="flex-shrink-0 p-3 border-r flex flex-col" style={{ width: "12.5%" }}>
        <div className="mt-1 flex flex-col gap-1">
          <p className="text-xs">{examPapersWithStat.studentCount}</p>
        </div>
      </div>

      <div className="flex-shrink-0 p-3 border-r flex flex-col" style={{ width: "12.5%" }}>
        <div className="mt-1 flex flex-col gap-1">
          <p className="text-xs"></p>
        </div>
      </div>

      <div className="flex flex-col gap-2 items-center justify-center" style={{ width: "6.5%" }}>
        <div className="flex">
          <Button
            variant="outline"
            onClick={() => {
              const examSubject = exam.examSubjects.find((es) => es.id === examPapersWithStat.examSubjectId);
              if (examSubject) onEdit(examSubject);
            }}
            //   className="h-5 w-5 p-0"
          >
            <FaEdit className="h-4 w-[139.41px]" />
          </Button>
        </div>
      </div>
    </div>
  );
}
