import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Session } from "@/types/academics/session";
import { AcademicYear } from "@/types/academics/academic-year";
import { createSession, updateSession } from "@/services/session.service";

interface SessionFormProps {
  session?: Session;
  academicYears: AcademicYear[];
  onSuccess: () => void;
  onCancel: () => void;
}

interface SessionFormData {
  academicYearId: number | null;
  name: string;
  from: string;
  to: string;
  isCurrentSession: boolean;
  codePrefix: string;
}

export const SessionForm: React.FC<SessionFormProps> = ({ session, academicYears, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState<SessionFormData>({
    academicYearId: null,
    name: "",
    from: "",
    to: "",
    isCurrentSession: false,
    codePrefix: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<SessionFormData>>({});

  // Initialize form data when editing
  useEffect(() => {
    if (session) {
      setFormData({
        academicYearId: session.academicYearId,
        name: session.name,
        from:
          session.from instanceof Date
            ? session.from.toISOString().split("T")[0]
            : session.from.toString().split("T")[0],
        to: session.to instanceof Date ? session.to.toISOString().split("T")[0] : session.to.toString().split("T")[0],
        isCurrentSession: session.isCurrentSession,
        codePrefix: session.codePrefix || "",
      });
    }
  }, [session]);

  const validateForm = (): boolean => {
    const newErrors: Partial<SessionFormData> = {};

    if (!formData.academicYearId) {
      newErrors.academicYearId = null;
    }

    if (!formData.name.trim()) {
      newErrors.name = "Session name is required";
    }

    if (!formData.from) {
      newErrors.from = "Start date is required";
    }

    if (!formData.to) {
      newErrors.to = "End date is required";
    }

    if (formData.from && formData.to && new Date(formData.from) >= new Date(formData.to)) {
      newErrors.to = "End date must be after start date";
    }

    if (!formData.codePrefix.trim()) {
      newErrors.codePrefix = "Code prefix is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const sessionData = {
        academicYearId: formData.academicYearId!,
        name: formData.name.trim(),
        from: new Date(formData.from),
        to: new Date(formData.to),
        isCurrentSession: formData.isCurrentSession,
        codePrefix: formData.codePrefix.trim(),
      };

      if (session?.id) {
        await updateSession(session.id, sessionData);
        toast.success("Session updated successfully");
      } else {
        await createSession(sessionData);
        toast.success("Session created successfully");
      }

      onSuccess();
    } catch (error) {
      toast.error(session ? "Failed to update session" : "Failed to create session");
      console.error("Session form error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof SessionFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Generate suggested code prefix based on academic year and session name
  const generateCodePrefix = () => {
    if (formData.academicYearId && formData.name) {
      const academicYear = academicYears.find((year) => year.id === formData.academicYearId);
      if (academicYear) {
        const yearShort = academicYear.year.slice(-2);
        const sessionShort = formData.name.slice(0, 2).toUpperCase();
        const suggested = `${yearShort}${sessionShort}`;
        handleInputChange("codePrefix", suggested);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Academic Year */}
        <div className="space-y-2">
          <Label htmlFor="academicYear">Academic Year *</Label>
          <Select
            value={formData.academicYearId?.toString() || ""}
            onValueChange={(value) => handleInputChange("academicYearId", parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select academic year" />
            </SelectTrigger>
            <SelectContent>
              {academicYears.map((year) => (
                <SelectItem key={year.id} value={year.id!.toString()}>
                  {year.year} {year.isCurrentYear && "(Current)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.academicYearId && <p className="text-sm text-red-600">Academic year is required</p>}
        </div>

        {/* Session Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Session Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="e.g., EVEN, ODD, SUMMER"
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
        </div>

        {/* From Date */}
        <div className="space-y-2">
          <Label htmlFor="from">Start Date *</Label>
          <Input
            id="from"
            type="date"
            value={formData.from}
            onChange={(e) => handleInputChange("from", e.target.value)}
            className={errors.from ? "border-red-500" : ""}
          />
          {errors.from && <p className="text-sm text-red-600">{errors.from}</p>}
        </div>

        {/* To Date */}
        <div className="space-y-2">
          <Label htmlFor="to">End Date *</Label>
          <Input
            id="to"
            type="date"
            value={formData.to}
            onChange={(e) => handleInputChange("to", e.target.value)}
            className={errors.to ? "border-red-500" : ""}
          />
          {errors.to && <p className="text-sm text-red-600">{errors.to}</p>}
        </div>

        {/* Code Prefix */}
        <div className="space-y-2">
          <Label htmlFor="codePrefix">Code Prefix *</Label>
          <div className="flex gap-2">
            <Input
              id="codePrefix"
              value={formData.codePrefix}
              onChange={(e) => handleInputChange("codePrefix", e.target.value)}
              placeholder="e.g., 25EV, 25OD"
              className={errors.codePrefix ? "border-red-500" : ""}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={generateCodePrefix}
              disabled={!formData.academicYearId || !formData.name}
            >
              Generate
            </Button>
          </div>
          {errors.codePrefix && <p className="text-sm text-red-600">{errors.codePrefix}</p>}
          <p className="text-xs text-gray-500">
            Unique identifier for session tagging (e.g., 25EV for 2025 Even semester)
          </p>
        </div>

        {/* Is Current Session */}
        <div className="space-y-2">
          <Label htmlFor="isCurrentSession">Active Session</Label>
          <div className="flex items-center space-x-2">
            <Switch
              id="isCurrentSession"
              checked={formData.isCurrentSession}
              onCheckedChange={(checked) => handleInputChange("isCurrentSession", checked)}
            />
            <Label htmlFor="isCurrentSession" className="text-sm text-gray-600">
              Mark as currently active session
            </Label>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : session ? "Update Session" : "Create Session"}
        </Button>
      </DialogFooter>
    </form>
  );
};
