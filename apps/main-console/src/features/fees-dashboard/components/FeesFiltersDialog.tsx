import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FeesFiltersDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: () => void;
  onReset: () => void;
};

export function FeesFiltersDialog({
  open,
  onOpenChange,
  onApply,
  onReset,
}: FeesFiltersDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Dashboard filters</DialogTitle>
          <DialogDescription className="text-base">
            Segment analytics by academic year, program, semester, and student attributes.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { id: "ay", label: "Academic Year", options: ["2025-26", "2024-25", "2023-24"] },
            { id: "program", label: "Program", options: ["All Programs", "UG", "PG"] },
            {
              id: "course",
              label: "Course",
              options: ["All Courses", "B.Com (H)", "BBA (H)", "BCA"],
            },
            { id: "semester", label: "Semester", options: ["All", "Sem I", "Sem IV", "Sem VI"] },
            { id: "shift", label: "Shift", options: ["All", "Morning", "Day", "Evening"] },
            {
              id: "category",
              label: "Category",
              options: ["All", "General", "SC", "ST", "OBC", "EWS"],
            },
            { id: "religion", label: "Religion", options: ["All"] },
            { id: "gender", label: "Gender", options: ["All", "Male", "Female", "Other"] },
            {
              id: "payStatus",
              label: "Payment Status",
              options: ["All", "Paid", "Partial", "Unpaid"],
            },
            { id: "payMode", label: "Payment Mode", options: ["All", "Online", "Cash", "Cheque"] },
            {
              id: "txnStatus",
              label: "Transaction Status",
              options: ["All", "Success", "Failed", "Pending"],
            },
          ].map((field) => (
            <div key={field.id} className="space-y-2">
              <Label className="text-sm font-medium">{field.label}</Label>
              <Select defaultValue={field.options[0]}>
                <SelectTrigger className="h-10 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map((opt) => (
                    <SelectItem key={opt} value={opt} className="text-base">
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
          <div className="space-y-2 sm:col-span-2">
            <Label className="text-sm font-medium">Date range</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" className="h-10 text-base" />
              <Input type="date" className="h-10 text-base" />
            </div>
          </div>
          <div className="space-y-2 sm:col-span-2 lg:col-span-3">
            <Label className="text-sm font-medium">Search student (PRN / name)</Label>
            <Input placeholder="PRN, UID, or student name…" className="h-10 text-base" />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" className="text-base" onClick={onReset}>
            Reset
          </Button>
          <Button
            className="text-base"
            onClick={() => {
              onApply();
              onOpenChange(false);
            }}
          >
            Apply filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
