import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { ExamSubjectDto } from "@/dtos";
import { useEffect, useState } from "react";

export function EditExamSubjectDialog({
  open,
  onClose,
  examSubject,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  examSubject: ExamSubjectDto | null;
  onSave: (updated: ExamSubjectDto) => Promise<void>;
}) {
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (examSubject) {
      setStartTime(toDatetimeLocal(examSubject.startTime));
      setEndTime(toDatetimeLocal(examSubject.endTime));
    }
  }, [examSubject]);

  const validateDateRange = (start: string, end: string): boolean => {
    if (!start || !end) return false;

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      setError("Invalid date or time");
      return false;
    }

    if (startDate > endDate) {
      setError("Start date & time cannot be greater than end date & time");
      return false;
    }

    setError(null);
    return true;
  };

  const toDatetimeLocal = (value: Date | string): string => {
    const date = value instanceof Date ? value : new Date(value);

    if (isNaN(date.getTime())) return "";

    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  if (!examSubject) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Exam Schedule</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Start Time</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => {
                const value = e.target.value;
                setStartTime(value);
                validateDateRange(value, endTime);
              }}
              className="w-full border rounded px-2 py-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">End Time</label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => {
                const value = e.target.value;
                setEndTime(value);
                validateDateRange(startTime, value);
              }}
              className="w-full border rounded px-2 py-1"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              if (!validateDateRange(startTime, endTime)) return;

              await onSave({
                ...examSubject,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
              });
              onClose();
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
