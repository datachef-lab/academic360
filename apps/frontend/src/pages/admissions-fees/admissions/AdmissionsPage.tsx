import  { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Calendar, CheckCircle, FileText, IndianRupee } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import * as admissionsApi from "@/services/admissions.service";
import { getAllCourses } from "@/services/course-api";
import { AcademicYear } from "@/types/academics/academic-year";

interface Admission {
  id?: number;
  admissionYear: { id: number; year: string };
  academicYearId: number;
  totalApplications: number;
  totalPayments: number;
  totalDrafts: number;
  startDate: string;
  lastDate: string;
  isClosed: boolean;
  courses: Course[];
}

interface Course {
  id?: number;
  name: string;
  courseId?: number;
  disabled?: boolean;
  isClosed?: boolean;
}

interface Stat {
  title: string;
  value: number;
  icon: React.ReactNode;
  bg: string;
  text: string;
}

interface MappedCourse {
  courseId: number;
  name: string;
  enabled: boolean;
  closed: boolean;
}

interface AdmissionDisplay {
  id?: number;
  year: string;
  academicYear: { id: number; year: string };
  totalApplications: number;
  total_applications: number;
  paymentsDone: number;
  payments_done: number;
  paymentsPercent: number;
  payments_percent: number;
  drafts: number;
  drafts_count: number;
  draftsPercent: number;
  drafts_percent: number;
  startDate: string;
  lastDate: string;
  isClosed: boolean;
  courses: Course[];
}

export default function AdmissionsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [configureOpen, setConfigureOpen] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);
  const [createForm, setCreateForm] = useState({
    academicYear: null as AcademicYear | null,
    startDate: "",
    endDate: "",
    selectedCourses: [] as Course[],
  });
  const [configureForm, setConfigureForm] = useState({
    academicYear: null as AcademicYear | null,
    startDate: "",
    endDate: "",
    mappedCourses: [] as MappedCourse[],
    addCourses: [] as Course[],
  });
  const [stats, setStats] = useState<Stat[]>([]);
  const [admissions, setAdmissions] = useState<AdmissionDisplay[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on mount
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      
      let statsSummary = null;
      let admissionsList: Admission[] = [];
      let academicYearsRes = null;
      let coursesRes = null;
      
      try {
        // Try to fetch stats summary
        try {
          statsSummary = await admissionsApi.fetchStatsSummary();
        } catch (err) {
          console.error('Failed to fetch stats summary:', err);
        }
        
        // Try to fetch admissions list
        try {
          admissionsList = await admissionsApi.fetchAdmissions();
        } catch (err) {
          console.error('Failed to fetch admissions:', err);
        }
        
        // Try to fetch academic years
        try {
          academicYearsRes = await admissionsApi.fetchAcademicYears();
        } catch (err) {
          console.error('Failed to fetch academic years:', err);
        }
        
        // Try to fetch courses
        try {
          coursesRes = await getAllCourses();
        } catch (err) {
          console.error('Failed to fetch courses:', err);
        }
        
        console.log('API Responses:', {
          statsSummary,
          admissionsList,
          academicYearsRes,
          coursesRes
        });
        
        // Map stats to expected format
        setStats([
          {
            title: "Total Years",
            value: statsSummary?.admissionYearCount || 0,
            icon: <Calendar className="w-6 h-6 text-blue-400" />,
            bg: "bg-blue-50",
            text: "text-blue-700",
          },
          {
            title: "Total Applications",
            value: statsSummary?.totalApplications || 0,
            icon: <CheckCircle className="w-6 h-6 text-green-400" />,
            bg: "bg-green-50",
            text: "text-green-700",
          },
          {
            title: "Total Payments",
            value: statsSummary?.totalPayments || 0,
            icon: <IndianRupee className="w-6 h-6 text-purple-400" />,
            bg: "bg-purple-50",
            text: "text-purple-700",
          },
          {
            title: "Total Drafts",
            value: statsSummary?.totalDrafts || 0,
            icon: <FileText className="w-6 h-6 text-yellow-400" />,
            bg: "bg-yellow-50",
            text: "text-yellow-700",
          },
        ]);
        
        // Map admissions to expected format - add null check
        const mappedAdmissions: AdmissionDisplay[] = (admissionsList || []).map((adm: Admission) => ({
          id: adm.id,
          year: adm.admissionYear.year,
          academicYear: { id: adm.academicYearId, year: adm.admissionYear.year },
          totalApplications: adm.totalApplications || 0,
          total_applications: adm.totalApplications || 0,
          paymentsDone: adm.totalPayments || 0,
          payments_done: adm.totalPayments || 0,
          paymentsPercent: adm.totalPayments && adm.totalApplications ? Math.round((adm.totalPayments / adm.totalApplications) * 100) : 0,
          payments_percent: adm.totalPayments && adm.totalApplications ? Math.round((adm.totalPayments / adm.totalApplications) * 100) : 0,
          drafts: adm.totalDrafts || 0,
          drafts_count: adm.totalDrafts || 0,
          draftsPercent: adm.totalDrafts && adm.totalApplications ? Math.round((adm.totalDrafts / adm.totalApplications) * 100) : 0,
          drafts_percent: adm.totalDrafts && adm.totalApplications ? Math.round((adm.totalDrafts / adm.totalApplications) * 100) : 0,
          startDate: adm.startDate,
          lastDate: adm.lastDate,
          isClosed: adm.isClosed,
          courses: adm.courses || [],
        }));
        
        setAdmissions(mappedAdmissions);
        console.log('Setting academicYears:', academicYearsRes);
        console.log('academicYears type:', typeof academicYearsRes);
        console.log('academicYears isArray:', Array.isArray(academicYearsRes));
        setAcademicYears(Array.isArray(academicYearsRes?.payload) ? academicYearsRes.payload : 
                        Array.isArray(academicYearsRes) ? academicYearsRes : []);
        setCourses(Array.isArray(coursesRes?.payload) ? coursesRes.payload : coursesRes?.payload || []);
        
        // If no data was fetched successfully, show error
        if (!statsSummary && admissionsList.length === 0 && !academicYearsRes && !coursesRes) {
          setError("Failed to load admissions data. Please check if the backend server is running.");
        }
      } catch (err: unknown) {
        console.error('Error fetching admissions data:', err);
        setError("Failed to load admissions data.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Handlers for Create Admission
  const handleCreateCourseToggle = (course: Course) => {
    setCreateForm((prev) => ({
      ...prev,
      selectedCourses: prev.selectedCourses.some((c) => c.id === course.id)
        ? prev.selectedCourses.filter((c) => c.id !== course.id)
        : [...prev.selectedCourses, course],
    }));
  };

  // Handlers for Configure Admission
  const handleConfigureCourseToggle = (idx: number, field: "enabled" | "closed") => {
    setConfigureForm((prev) => ({
      ...prev,
      mappedCourses: prev.mappedCourses.map((c, i) =>
        i === idx ? { ...c, [field]: !c[field] } : c
      ),
    }));
  };
  const handleConfigureAddCourse = (course: Course) => {
    if (course.id === undefined) return;
    setConfigureForm((prev) => ({
      ...prev,
      mappedCourses: [...prev.mappedCourses, { courseId: course.id!, name: course.name, enabled: true, closed: false }],
      addCourses: prev.addCourses.filter((c) => c.id !== course.id),
    }));
  };

  // Open Configure Modal with data
  const openConfigure = (adm: AdmissionDisplay) => {
    const admissionData: Admission = {
      id: adm.id || 0,
      admissionYear: adm.academicYear,
      academicYearId: adm.academicYear.id,
      totalApplications: adm.totalApplications,
      totalPayments: adm.paymentsDone,
      totalDrafts: adm.drafts,
      startDate: adm.startDate,
      lastDate: adm.lastDate,
      isClosed: adm.isClosed,
      courses: adm.courses,
    };
    setSelectedAdmission(admissionData);
    setConfigureForm({
      academicYear: { 
        id: adm.academicYear.id, 
        year: adm.academicYear.year,
        isCurrentYear: false,
        session: { 
          id: 1, 
          name: "Default", 
          from: new Date(), 
          to: new Date(), 
          isCurrentSession: false, 
          codePrefix: "DEF", 
          sequence: 1, 
          disabled: false 
        }
      },
      startDate: adm.startDate,
      endDate: adm.lastDate,
      mappedCourses: (adm.courses || []).map((c: Course) => ({ 
        courseId: c.id || 0, 
        name: c.name, 
        enabled: !c.disabled, 
        closed: c.isClosed || false 
      })),
      addCourses: courses.filter((c: Course) => !(adm.courses || []).some((mc: Course) => mc.id === c.id)),
    });
    setConfigureOpen(true);
  };

  // Create Admission API
  const handleCreateAdmission = async () => {
    try {
      setLoading(true);
      await admissionsApi.createAdmission({
        academicYear: createForm.academicYear as AcademicYear,
        startDate: createForm.startDate,
        lastDate: createForm.endDate,
        courses: createForm.selectedCourses.map((c) => ({ 
          courseId: c.id || 0, 
          disabled: false, 
          isClosed: false, 
          remarks: null,
          admissionId: 0 // This will be set by the backend
        })),
      });
      setCreateOpen(false);
      // Refresh admissions
      const admissionsList = await admissionsApi.fetchAdmissions();
      setAdmissions(admissionsList);
    } catch {
      setError("Failed to create admission.");
    } finally {
      setLoading(false);
    }
  };

  // Update Admission API
  const handleUpdateAdmission = async () => {
    if (!selectedAdmission) return;
    try {
      setLoading(true);
      await admissionsApi.updateAdmission(Number(selectedAdmission.id), {
        ...selectedAdmission,
        academicYear: configureForm.academicYear as AcademicYear,
        startDate: configureForm.startDate,
        lastDate: configureForm.endDate,
        courses: configureForm.mappedCourses.map((c) => ({ 
          courseId: c.courseId, 
          disabled: !c.enabled, 
          isClosed: c.closed, 
          remarks: null,
          admissionId: 0 // This will be set by the backend
        })),
      });
      setConfigureOpen(false);
      // Refresh admissions
      const admissionsList = await admissionsApi.fetchAdmissions();
      setAdmissions(admissionsList);
    } catch {
      setError("Failed to update admission.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Admissions Data</h1>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#3B22A1] hover:bg-[#2a1977] text-white font-semibold">
              + Create Admission
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl min-w-[60vw] rounded-2xl bg-white p-8">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold mb-1">Start Admission Process For</DialogTitle>
              <DialogDescription className="text-gray-500 mb-4">Fill in the details to create a new admission year.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Admission Year</label>
                  <select
                    className="w-full border rounded px-2 py-2"
                    value={createForm.academicYear?.id || ""}
                    onChange={e => {
                      const year = academicYears.find((y: AcademicYear) => y.id === Number(e.target.value));
                      setCreateForm(prev => ({ ...prev, academicYear: year || null }));
                    }}
                  >
                    <option value="">Select Year</option>
                    {Array.isArray(academicYears) ? academicYears.map((y: AcademicYear) => (
                      <option key={y.id} value={y.id}>{y.year}</option>
                    )) : (
                      <option value="" disabled>Loading academic years...</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <Input
                    type="date"
                    value={createForm.startDate}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <Input
                    type="date"
                    value={createForm.endDate}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Select Courses</label>
                <div className="max-h-48 overflow-y-auto border rounded bg-gray-50 p-2">
                  {Array.isArray(courses) ? courses.map((course: Course) => (
                    <div key={course.id} className="flex items-center gap-2 mb-1">
                      <Checkbox
                        checked={createForm.selectedCourses.some((c) => c.id === course.id)}
                        onCheckedChange={() => handleCreateCourseToggle(course)}
                        id={String(course.id)}
                      />
                      <label htmlFor={String(course.id)} className="text-sm cursor-pointer">{course.name}</label>
                    </div>
                  )) : (
                    <div className="text-sm text-gray-500">Loading courses...</div>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Selected: {createForm.selectedCourses.length} courses
                </div>
              </div>
            </div>
            <DialogFooter className="flex justify-between mt-8">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button className="bg-[#3B22A1] text-white" onClick={handleCreateAdmission}>Create Admission</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Array.isArray(stats) ? stats.map((stat, idx) => (
          <Card key={idx} className={`${stat.bg} ${stat.text} flex flex-row items-center`}>
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div>{stat.icon}</div>
              <CardTitle className="text-base font-medium">{stat.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center">
              <span className="text-2xl font-bold">{stat.value}</span>
            </CardContent>
          </Card>
        )) : (
          <div className="col-span-4 text-center text-gray-500">Loading stats...</div>
        )}
      </div>

      {/* Search */}
      <div className="mb-4">
        <Input placeholder="Search by year..." className="max-w-xs" />
      </div>

      {/* Admissions Table */}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SR NO</TableHead>
              <TableHead>ADMISSION YEAR</TableHead>
              <TableHead>TOTAL APPLICATIONS</TableHead>
              <TableHead>PAYMENTS DONE</TableHead>
              <TableHead>DRAFTS</TableHead>
              <TableHead>ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.isArray(admissions) ? admissions.map((adm: AdmissionDisplay, idx: number) => (
              <TableRow key={adm.id || adm.year}>
                <TableCell>{idx + 1}</TableCell>
                <TableCell>{adm.year || adm.academicYear?.year}</TableCell>
                <TableCell>{adm.totalApplications || 0}</TableCell>
                <TableCell>
                  {adm.paymentsDone || 0} ({adm.paymentsPercent || 0}%)
                </TableCell>
                <TableCell>
                  {adm.drafts || 0} ({adm.draftsPercent || 0}%)
                </TableCell>
                <TableCell>
                  <Button size="sm" className="bg-[#3B22A1] text-white mr-2">View Details</Button>
                  <Dialog open={configureOpen && selectedAdmission?.id === adm.id} onOpenChange={(open) => { setConfigureOpen(open); if (!open) setSelectedAdmission(null); }}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" onClick={() => openConfigure(adm)}>Configure</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl min-w-[80vw] min-h-[90vh] overflow-y-auto rounded-2xl bg-white p-8">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-bold mb-1">Configure Admission</DialogTitle>
                        <DialogDescription className="text-gray-500 mb-4">Manage mapped and additional courses for this admission year.</DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Admission Year</label>
                            <Input value={configureForm.academicYear?.year || ""} readOnly />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Start Date</label>
                            <Input type="date" value={configureForm.startDate} onChange={e => setConfigureForm(f => ({ ...f, startDate: e.target.value }))} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">End Date</label>
                            <Input type="date" value={configureForm.endDate} onChange={e => setConfigureForm(f => ({ ...f, endDate: e.target.value }))} />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Mapped Courses ({configureForm.mappedCourses.length})</label>
                            <div className="max-h-[50vh] overflow-y-auto border rounded bg-gray-50 p-2">
                              {Array.isArray(configureForm.mappedCourses) ? configureForm.mappedCourses.map((c, i) => (
                                <div key={c.courseId} className="flex items-center gap-2 mb-1">
                                  <span className="flex-1 text-sm">{c.name}</span>
                                  <label className="flex items-center gap-1 text-xs">
                                    <Checkbox checked={c.enabled} onCheckedChange={() => handleConfigureCourseToggle(i, "enabled")}/> Enabled
                                  </label>
                                  <label className="flex items-center gap-1 text-xs">
                                    <Checkbox checked={c.closed} onCheckedChange={() => handleConfigureCourseToggle(i, "closed")}/> Closed
                                  </label>
                                </div>
                              )) : (
                                <div className="text-sm text-gray-500">No mapped courses</div>
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Add Courses ({configureForm.addCourses.length})</label>
                            <div className="max-h-48 overflow-y-auto border rounded bg-gray-50 p-2">
                              {Array.isArray(configureForm.addCourses) ? configureForm.addCourses.map((c: Course) => (
                                <div key={c.id} className="flex items-center gap-2 mb-1">
                                  <span className="flex-1 text-sm">{c.name}</span>
                                  <Button size="sm" variant="secondary" onClick={() => handleConfigureAddCourse(c)}>Add</Button>
                                </div>
                              )) : (
                                <div className="text-sm text-gray-500">No additional courses</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <DialogFooter className="flex justify-between mt-8">
                        <Button variant="outline" onClick={() => setConfigureOpen(false)}>Cancel</Button>
                        <Button className="bg-[#3B22A1] text-white" onClick={handleUpdateAdmission}>Save Admission</Button>
                        <Button variant="destructive">Close Admission</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500">Loading admissions...</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
