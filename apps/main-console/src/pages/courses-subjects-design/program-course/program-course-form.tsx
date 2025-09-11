import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { ProgramCourse, Stream, Course, CourseType, CourseLevel, Affiliation, RegulationType } from "@repo/db";
import {
  getStreams,
  getCourses,
  getCourseTypes,
  getCourseLevels,
  getAffiliations,
  getRegulationTypes,
} from "@/services/course-design.api";

const programCourseSchema = z.object({
  streamId: z.number().nullable(),
  courseId: z.number().nullable(),
  courseTypeId: z.number().nullable(),
  courseLevelId: z.number().nullable(),
  duration: z.number().min(1, "Duration must be at least 1 year"),
  totalSemesters: z.number().min(1, "Total semesters must be at least 1"),
  affiliationId: z.number().nullable(),
  regulationTypeId: z.number().nullable(),
  name: z.string().nullable(),
  shortName: z.string().nullable(),
  isActive: z.boolean().default(true),
});

type ProgramCourseFormValues = z.infer<typeof programCourseSchema>;

interface ProgramCourseFormProps {
  initialData?: ProgramCourse | null;
  onSubmit: (data: Omit<ProgramCourse, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProgramCourseForm({ initialData, onSubmit, onCancel, isLoading = false }: ProgramCourseFormProps) {
  const isEdit = !!initialData;

  // State for dropdown options
  const [streams, setStreams] = useState<Stream[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseTypes, setCourseTypes] = useState<CourseType[]>([]);
  const [courseLevels, setCourseLevels] = useState<CourseLevel[]>([]);
  const [affiliations, setAffiliations] = useState<Affiliation[]>([]);
  const [regulationTypes, setRegulationTypes] = useState<RegulationType[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Fetch dropdown options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoadingOptions(true);
        const [streamsData, coursesData, courseTypesData, courseLevelsData, affiliationsData, regulationTypesData] =
          await Promise.all([
            getStreams(),
            getCourses(),
            getCourseTypes(),
            getCourseLevels(),
            getAffiliations(),
            getRegulationTypes(),
          ]);

        setStreams((streamsData as Stream[]) || []);
        setCourses((coursesData as Course[]) || []);
        setCourseTypes((courseTypesData as CourseType[]) || []);
        setCourseLevels((courseLevelsData as CourseLevel[]) || []);
        setAffiliations((affiliationsData as Affiliation[]) || []);
        setRegulationTypes((regulationTypesData as RegulationType[]) || []);
      } catch (error) {
        console.error("Error fetching dropdown options:", error);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, []);

  const form = useForm<ProgramCourseFormValues>({
    resolver: zodResolver(programCourseSchema),
    defaultValues: {
      streamId: initialData?.streamId || null,
      courseId: initialData?.courseId || null,
      courseTypeId: initialData?.courseTypeId || null,
      courseLevelId: initialData?.courseLevelId || null,
      duration: initialData?.duration || 3,
      totalSemesters: initialData?.totalSemesters || 6,
      affiliationId: initialData?.affiliationId || null,
      regulationTypeId: initialData?.regulationTypeId || null,
      name: initialData?.name || "",
      shortName: initialData?.shortName || "",
      isActive: initialData?.isActive ?? true,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        streamId: initialData.streamId,
        courseId: initialData.courseId,
        courseTypeId: initialData.courseTypeId,
        courseLevelId: initialData.courseLevelId,
        duration: initialData.duration,
        totalSemesters: initialData.totalSemesters,
        affiliationId: initialData.affiliationId,
        regulationTypeId: initialData.regulationTypeId,
        name: initialData.name || "",
        shortName: initialData.shortName || "",
        isActive: initialData.isActive ?? true,
      });
    } else {
      form.reset({
        streamId: null,
        courseId: null,
        courseTypeId: null,
        courseLevelId: null,
        duration: 3,
        totalSemesters: 6,
        affiliationId: null,
        regulationTypeId: null,
        name: "",
        shortName: "",
        isActive: true,
      });
    }
  }, [initialData, form]);

  // Auto-compose name from course + (courseType.shortName) whenever selection changes
  useEffect(() => {
    const selectedCourse = courses.find((c) => c.id === form.getValues("courseId"));
    const selectedCourseType = courseTypes.find((ct) => ct.id === form.getValues("courseTypeId"));
    const courseName = selectedCourse?.name?.trim() || "";
    const courseTypeShort =
      (selectedCourseType as CourseType)?.shortName ||
      (selectedCourseType as CourseType)?.code ||
      selectedCourseType?.name ||
      "";
    const composed = courseTypeShort ? `${courseName} (${courseTypeShort})`.trim() : courseName;
    if (composed && form.getValues("name") !== composed) {
      form.setValue("name", composed, { shouldDirty: true });
    }
    // Keep shortName optional; do not auto-fill. Let users type if they want.
  }, [courses, courseTypes, form.watch("courseId"), form.watch("courseTypeId")]);

  const handleSubmit = (data: ProgramCourseFormValues) => {
    onSubmit({
      streamId: data.streamId,
      courseId: data.courseId,
      name: data.name?.trim() || null,
      courseTypeId: data.courseTypeId,
      courseLevelId: data.courseLevelId,
      duration: data.duration,
      totalSemesters: data.totalSemesters,
      affiliationId: data.affiliationId,
      regulationTypeId: data.regulationTypeId,
      shortName: data.shortName?.trim() || null,
      isActive: data.isActive,
    });
  };

  if (loadingOptions) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">Loading form options...</div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="streamId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stream</FormLabel>
                <Select onValueChange={(value) => field.onChange(Number(value))} value={String(field.value)}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stream" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {streams.map((stream) => (
                      <SelectItem key={stream.id} value={String(stream.id)}>
                        {stream.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="courseId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Course</FormLabel>
                <Select onValueChange={(value) => field.onChange(Number(value))} value={String(field.value)}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={String(course.id)}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="courseTypeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Course Type</FormLabel>
                <Select onValueChange={(value) => field.onChange(Number(value))} value={String(field.value)}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select course type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {courseTypes.map((courseType) => (
                      <SelectItem key={courseType.id} value={String(courseType.id)}>
                        {courseType.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="courseLevelId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Course Level</FormLabel>
                <Select onValueChange={(value) => field.onChange(Number(value))} value={String(field.value)}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {courseLevels.map((courseLevel) => (
                      <SelectItem key={courseLevel.id} value={String(courseLevel.id)}>
                        {courseLevel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (years)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Enter duration"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="totalSemesters"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Semesters</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Enter total semesters"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="affiliationId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Affiliated To</FormLabel>
                <Select onValueChange={(value) => field.onChange(Number(value))} value={String(field.value)}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select affiliation" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {affiliations.map((affiliation) => (
                      <SelectItem key={affiliation.id} value={String(affiliation.id)}>
                        {affiliation.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="regulationTypeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Regulation Type</FormLabel>
                <Select onValueChange={(value) => field.onChange(Number(value))} value={String(field.value)}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select regulation" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {regulationTypes.map((regulationType) => (
                      <SelectItem key={regulationType.id} value={String(regulationType.id)}>
                        {regulationType.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Auto-composed name" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="shortName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Short Name (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Leave empty if not needed" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="isActive"
          render={() => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Controller
                  name="isActive"
                  control={form.control}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isLoading} />
                  )}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Active</FormLabel>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : isEdit ? "Update Program Course" : "Create Program Course"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
