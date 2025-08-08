import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectItem, SelectTrigger, SelectContent, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card,  } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, } from "@/components/ui/dialog";
import { Paperclip, Image as ImageIcon, Link as LinkIcon, Megaphone, Bookmark, CalendarDays, Star } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { QueryObserverResult } from "@tanstack/react-query";

// Academic years for dropdown
const academicYears: string[] = [
//   "2022-2023",
//   "2023-2024",
//   "2024-2025",
];

type NoticeType = "EXAM" | "FEE" | "EVENT" | "HOLIDAY";
type AudienceType = string;
type AttachmentType = "file" | "image" | "link";
interface NoticeAttachment {
  type: AttachmentType;
  url: string;
  name?: string;
}
interface Notice {
  id: number;
  title: string;
  description: string;
  type: NoticeType;
  audience: AudienceType;
  startDate: string;
  endDate: string;
  academicYear: string;
  pinned: boolean;
  attachments?: NoticeAttachment[];
}

const typeColors: Record<NoticeType, string> = {
  EXAM: "bg-blue-100 text-blue-700",
  FEE: "bg-yellow-100 text-yellow-700",
  EVENT: "bg-purple-100 text-purple-700",
  HOLIDAY: "bg-green-100 text-green-700",
};

const initialNotices: Notice[] = [
//   {
//     id: 1,
//     title: "Spring Semester Final Exams",
//     description: "Final exams for the spring semester will be held from May 10 to May 20. Please check the schedule and prepare accordingly.",
//     type: "EXAM",
//     audience: "STUDENTS",
//     startDate: "2024-05-10",
//     endDate: "2024-05-20",
//     academicYear: "2023-2024",
//     pinned: false,
//     attachments: [
//       { type: "file", url: "/files/exam-schedule.pdf", name: "Exam Schedule.pdf" },
//     ],
//   },
//   {
//     id: 2,
//     title: "Tuition Payment Deadline",
//     description: "The last date to pay tuition fees is April 15. Late payments will incur a penalty.",
//     type: "FEE",
//     audience: "STUDENTS",
//     startDate: "2024-04-01",
//     endDate: "2024-04-15",
//     academicYear: "2023-2024",
//     pinned: false,
//     attachments: [
//       { type: "link", url: "https://payment.example.com", name: "Pay Online" },
//     ],
//   },
//   {
//     id: 3,
//     title: "Science Fair",
//     description: "Annual science fair for students and faculty. Submit your projects by March 1.",
//     type: "EVENT",
//     audience: "STUDENTS, FACULTY",
//     startDate: "2024-03-05",
//     endDate: "2024-03-05",
//     academicYear: "2023-2024",
//     pinned: true,
//     attachments: [
//       { type: "image", url: "/images/science-fair.jpg", name: "Poster" },
//     ],
//   },
//   {
//     id: 4,
//     title: "Summer Break Announcement",
//     description: "Summer break will be from July 1 to July 31. Enjoy your holidays!",
//     type: "HOLIDAY",
//     audience: "STUDENTS",
//     startDate: "2023-07-01",
//     endDate: "2023-07-31",
//     academicYear: "2022-2023",
//     pinned: false,
//   },
//   {
//     id: 5,
//     title: "Exam Schedule for Midterms",
//     description: "Midterm exams are scheduled from February 15 to February 25. Check the timetable for details.",
//     type: "EXAM",
//     audience: "STUDENTS",
//     startDate: "2023-02-15",
//     endDate: "2023-02-25",
//     academicYear: "2022-2023",
//     pinned: false,
//   },
];

function getStatus(notice: Notice): string {
  const today = new Date();
  const start = new Date(notice.startDate);
  const end = new Date(notice.endDate);
  if (today >= start && today <= end) return "Active";
  if (today > end) return "Expired";
  return "Scheduled";
}

const PAGE_SIZE = 4;

export default function NoticeMaster() {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [academicYearFilter, setAcademicYearFilter] = useState<string>("all");
  const [notices, setNotices] = useState<Notice[]>(initialNotices);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "EXAM" as NoticeType,
    audience: "STUDENTS",
    startDate: "",
    endDate: "",
    academicYear: academicYears[0],
    pinned: false,
    attachments: [] as NoticeAttachment[],
  });
  const [attachmentInput, setAttachmentInput] = useState({ type: "file" as AttachmentType, url: "", name: "" });
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
    totalElements: 0,
    totalPages: 1,
  });
  const setDataLength = useState(notices.length)[1];

  // Filtering logic
  const filtered = useMemo(() =>
    notices.filter((n) => {
      const matchesTab = tab === "all" ? true : tab === "pinned" ? n.pinned : false;
      const matchesSearch =
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.description.toLowerCase().includes(search.toLowerCase());
        const matchesType = typeFilter === "all" ? true : n.type === typeFilter;
        const matchesStatus = statusFilter === "all" ? true : getStatus(n) === statusFilter;
        const matchesYear = academicYearFilter === "all" ? true : n.academicYear === academicYearFilter;
      return matchesTab && matchesSearch && matchesType && matchesStatus && matchesYear;
    }), [notices, tab, search, typeFilter, statusFilter, academicYearFilter]
  );

  // Pagination logic
  const paged = useMemo(() =>
    filtered.slice(
      pagination.pageIndex * pagination.pageSize,
      (pagination.pageIndex + 1) * pagination.pageSize
    ), [filtered, pagination]
  );

  React.useEffect(() => {
    setPagination(p => ({
      ...p,
      totalElements: filtered.length,
      totalPages: Math.ceil(filtered.length / PAGE_SIZE) || 1,
      pageIndex: 0,
    }));
  }, [filtered.length]);

  function handleAddNotice() {
    setNotices([
      {
        id: Date.now(),
        ...form,
      },
      ...notices,
    ]);
    setShowDialog(false);
    setForm({
      title: "",
      description: "",
      type: "EXAM",
      audience: "STUDENTS",
      startDate: "",
      endDate: "",
      academicYear: academicYears[0],
      pinned: false,
      attachments: [],
    });
    setAttachmentInput({ type: "file", url: "", name: "" });
  }

  function handleAddAttachment() {
    if (!attachmentInput.url) return;
    setForm(f => ({ ...f, attachments: [...(f.attachments || []), { ...attachmentInput }] }));
    setAttachmentInput({ type: "file", url: "", name: "" });
  }

  function handleRemoveAttachment(idx: number) {
    setForm(f => ({ ...f, attachments: f.attachments?.filter((_, i) => i !== idx) || [] }));
  }

  // DataTable columns
  const columns = useMemo<ColumnDef<Notice>[]>(() => [
    {
      accessorKey: "title",
      header: () => <span className="font-semibold text-purple-700">Title</span>,
      cell: info => (
        <div>
          <div className="font-semibold text-base text-gray-900">{info.row.original.title}</div>
          <div className="text-xs text-gray-500 whitespace-pre-line">{info.row.original.description}</div>
        </div>
      ),
      size: 220,
    },
    {
      accessorKey: "type",
      header: () => <span className="font-semibold text-purple-700">Type</span>,
      cell: info => <Badge className={typeColors[info.getValue() as NoticeType]}>{info.getValue() as string}</Badge>,
      size: 80,
    },
    {
      accessorKey: "audience",
      header: () => <span className="font-semibold text-purple-700">Audience</span>,
      size: 120,
    },
    {
      accessorKey: "startDate",
      header: () => <span className="font-semibold text-purple-700">Start Date</span>,
      size: 100,
    },
    {
      accessorKey: "endDate",
      header: () => <span className="font-semibold text-purple-700">End Date</span>,
      size: 100,
    },
    {
      id: "status",
      header: () => <span className="font-semibold text-purple-700">Status</span>,
      cell: ({ row }) => (
        <Badge className={
          getStatus(row.original) === "Active"
            ? "bg-green-100 text-green-700"
            : getStatus(row.original) === "Expired"
              ? "bg-red-100 text-red-700"
              : "bg-gray-100 text-gray-700"
        }>
          {getStatus(row.original)}
        </Badge>
      ),
      size: 80,
    },
    {
      id: "pin",
      header: () => <span className="font-semibold text-purple-700">Pin</span>,
      cell: ({ row }) => (
        <Button
          variant={row.original.pinned ? "secondary" : "ghost"}
          size="icon"
          onClick={() => setNotices(ns => ns.map(x => x.id === row.original.id ? { ...x, pinned: !x.pinned } : x))}
        >
          {row.original.pinned ? <Bookmark className="text-yellow-500" /> : <Bookmark className="opacity-30" />}
        </Button>
      ),
      size: 60,
    },
    {
      id: "attachments",
      header: () => <span className="font-semibold text-purple-700">Attachments</span>,
      cell: ({ row }) => row.original.attachments && row.original.attachments.length > 0 ? (
        <div className="flex gap-2">
          {row.original.attachments.map((a, i) => (
            <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" title={a.name || a.url} className="inline-flex items-center">
              {a.type === "file" && <Paperclip className="w-4 h-4 mr-1" />}
              {a.type === "image" && <ImageIcon className="w-4 h-4 mr-1" />}
              {a.type === "link" && <LinkIcon className="w-4 h-4 mr-1" />}
              <span className="underline text-xs">{a.name || a.url}</span>
            </a>
          ))}
        </div>
      ) : null,
      size: 120,
    },
  ], [setNotices]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
      <div className=" p-4">
        {/* Header row: title left, controls right */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-purple-500" />
            <h1 className="text-3xl font-bold text-purple-700">Notice Management</h1>
          </div>
          <div className="flex flex-wrap gap-2 items-center justify-end">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[100px] bg-white shadow-sm"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="EXAM">EXAM</SelectItem>
                <SelectItem value="FEE">FEE</SelectItem>
                <SelectItem value="EVENT">EVENT</SelectItem>
                <SelectItem value="HOLIDAY">HOLIDAY</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[100px] bg-white shadow-sm"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Expired">Expired</SelectItem>
                <SelectItem value="Scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={academicYearFilter} onValueChange={setAcademicYearFilter}>
              <SelectTrigger className="w-[120px] bg-white shadow-sm"><SelectValue placeholder="Academic Year" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {academicYears.map(y => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>

          </div>
        </div>
        {/* Stats Cards - modern, colorful, icon-based */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <Card className="relative overflow-hidden shadow rounded-2xl p-4 flex flex-col justify-between min-h-[100px] bg-gradient-to-br from-purple-500 to-purple-400 text-white">
            <div className="flex items-center gap-3 z-10">
              <span className="rounded-xl bg-white/20 p-2"><Megaphone className="w-7 h-7 text-white" /></span>
              <span className="text-base font-semibold">Total</span>
            </div>
            <div className="text-3xl font-bold pl-2 z-10">{notices.length}</div>
            <div className="absolute right-3 bottom-2 opacity-10 text-white text-7xl pointer-events-none select-none">N</div>
          </Card>
          <Card className="relative overflow-hidden shadow rounded-2xl p-4 flex flex-col justify-between min-h-[100px] bg-gradient-to-br from-green-400 to-green-500 text-white">
            <div className="flex items-center gap-3 z-10">
              <span className="rounded-xl bg-white/20 p-2"><CalendarDays className="w-7 h-7 text-white" /></span>
              <span className="text-base font-semibold">Active</span>
            </div>
            <div className="text-3xl font-bold pl-2 z-10">{notices.filter(n => getStatus(n) === "Active").length}</div>
            <div className="absolute right-3 bottom-2 opacity-10 text-white text-7xl pointer-events-none select-none">A</div>
          </Card>
          <Card className="relative overflow-hidden shadow rounded-2xl p-4 flex flex-col justify-between min-h-[100px] bg-gradient-to-br from-yellow-400 to-yellow-500 text-white">
            <div className="flex items-center gap-3 z-10">
              <span className="rounded-xl bg-white/20 p-2"><Bookmark className="w-7 h-7 text-white" /></span>
              <span className="text-base font-semibold">Pinned</span>
            </div>
            <div className="text-3xl font-bold pl-2 z-10">{notices.filter(n => n.pinned).length}</div>
            <div className="absolute right-3 bottom-2 opacity-10 text-white text-7xl pointer-events-none select-none">P</div>
          </Card>
          <Card className="relative overflow-hidden shadow rounded-2xl p-4 flex flex-col justify-between min-h-[100px] bg-gradient-to-br from-red-400 to-red-500 text-white">
            <div className="flex items-center gap-3 z-10">
              <span className="rounded-xl bg-white/20 p-2"><Star className="w-7 h-7 text-white" /></span>
              <span className="text-base font-semibold">Expired</span>
            </div>
            <div className="text-3xl font-bold pl-2 z-10">{notices.filter(n => getStatus(n) === "Expired").length}</div>
            <div className="absolute right-3 bottom-2 opacity-10 text-white text-7xl pointer-events-none select-none">E</div>
          </Card>
        </div>
        {/* Tabs and Search Row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
          <Tabs value={tab} onValueChange={setTab} className="">
            <TabsList className="bg-white shadow-sm rounded-lg">
              <TabsTrigger value="all">All Notices</TabsTrigger>
              <TabsTrigger value="pinned">Pinned</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-3">
            <Input
              placeholder="Search notices by title or content..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-[240px] bg-white shadow-sm ml-auto"
            />
            <div className="flex flex-wrap gap-2 items-center justify-end">
              <Button className="bg-purple-700 hover:bg-purple-800" onClick={() => setShowDialog(true)}>
                Add Notice
              </Button>
            </div>
          </div>

        </div>
        {/* Filters Row */}

        {/* DataTable */}
        <div className="bg-white shadow-lg rounded-xl p-4">
          <DataTable<Notice, unknown>
            columns={columns}
            data={paged}
            pagination={pagination}
            isLoading={false}
            setPagination={setPagination}
            searchText={search}
            setSearchText={setSearch}
            setDataLength={setDataLength}
            refetch={async () => Promise.resolve({} as QueryObserverResult<Notice[] | undefined, Error>)}
            viewDataToolbar={false}
          />
        </div>
        {/* Add Notice Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-[90vw] p-0 h-[650px] flex overflow-hidden">
            {/* Left: Image */}
            <div className="hidden md:flex flex-col items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200 w-1/3 h-full min-h-[400px] max-h-[600px]">
              <img src="/notice.png" alt="Notice" className="object-cover h-full w-full" />
            </div>
            {/* Right: Form */}
            <div className="flex-1 pt-4 flex flex-col h-full">

              {/* Header with Title input and Academic Year dropdown */}
              <div className="pb-2 flex flex-col gap-2">
                <div className="flex flex-col md:flex-row md:items-end md:gap-4 gap-2">
                  <div className="flex-1 flex flex-col pb-2 gap-1">
                    {/* <label htmlFor="notice-title" className="text-sm font-medium text-gray-700">Title</label> */}
                    <Input id="notice-title" placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="text-lg w-2/3 font-semibold" />
                  </div>
                  {/* <div className="w-full md:w-60 flex flex-col gap-1">
                    <Select value={form.academicYear} onValueChange={v => setForm(f => ({ ...f, academicYear: v }))}>
                      <SelectTrigger id="notice-academic-year"><SelectValue placeholder="Academic Year" /></SelectTrigger>
                      <SelectContent>
                        {academicYears.map(y => (
                          <SelectItem key={y} value={y}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div> */}
                </div>
                {/* <div className="text-sm text-gray-500">Fill in the details to create a new notice</div> */}
              </div>
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-0">
                <form className="flex flex-col gap-6 p-6 h-[500px] overflow-auto bg-white rounded-2xl shadow border">
                  {/* Description */}
                  <div className="flex flex-col gap-1">
                    <label htmlFor="notice-description" className="text-sm font-medium text-gray-700">Description</label>
                    <Textarea id="notice-description" placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                  {/* Type, Start Date, End Date */}
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 flex flex-col gap-1">
                      <label htmlFor="notice-type" className="text-sm font-medium text-gray-700">Type</label>
                      <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as NoticeType }))}>
                        <SelectTrigger id="notice-type"><SelectValue placeholder="Type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EXAM">EXAM</SelectItem>
                          <SelectItem value="FEE">FEE</SelectItem>
                          <SelectItem value="EVENT">EVENT</SelectItem>
                          <SelectItem value="HOLIDAY">HOLIDAY</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                      <label htmlFor="notice-start-date" className="text-sm font-medium text-gray-700">Start Date</label>
                      <Input id="notice-start-date" type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                      <label htmlFor="notice-end-date" className="text-sm font-medium text-gray-700">End Date</label>
                      <Input id="notice-end-date" type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
                    </div>
                  </div>
                  {/* Audience and Pin */}
                  <div className="flex flex-col md:flex-row gap-4 items-start">
                    <div className="flex-1 flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-700">Audience</label>
                      <div className="flex flex-wrap gap-4">
                        {['STUDENTS', 'FACULTY', 'STAFF', 'PARENTS', 'ALL'].map(aud => (
                          <label key={aud} className="flex items-center gap-1 text-sm">
                            <input
                              type="checkbox"
                              checked={form.audience.split(',').includes(aud)}
                              onChange={e => {
                                let selected = form.audience ? form.audience.split(',') : [];
                                if (e.target.checked) {
                                  if (!selected.includes(aud)) selected.push(aud);
                                } else {
                                  selected = selected.filter(x => x !== aud);
                                }
                                setForm(f => ({ ...f, audience: selected.join(',') }));
                              }}
                            />
                            {aud.charAt(0) + aud.slice(1).toLowerCase()}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={form.pinned} onChange={e => setForm(f => ({ ...f, pinned: e.target.checked }))} />
                    Pin this notice
                  </label>
                  {/* Attachments */}
                  <div className="border-t pt-2 mt-2">
                    <div className="font-semibold text-sm mb-1">Attachments <span className='text-xs text-gray-500'>(Add multiple files, images, or links)</span></div>
                    <div className="flex gap-2 mb-2 flex-wrap">
                      <Select value={attachmentInput.type} onValueChange={v => setAttachmentInput(a => ({ ...a, type: v as AttachmentType }))}>
                        <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="file">File</SelectItem>
                          <SelectItem value="image">Image</SelectItem>
                          <SelectItem value="link">Link</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input placeholder="URL or path" value={attachmentInput.url} onChange={e => setAttachmentInput(a => ({ ...a, url: e.target.value }))} />
                      <Input placeholder="Name (optional)" value={attachmentInput.name} onChange={e => setAttachmentInput(a => ({ ...a, name: e.target.value }))} />
                      <Button type="button" onClick={handleAddAttachment}>Add</Button>
                    </div>
                    {form.attachments && form.attachments.length > 0 && (
                      <ul className="text-xs space-y-1">
                        {form.attachments.map((a, i) => (
                          <li key={i} className="flex items-center gap-2">
                            {a.type === "file" && <Paperclip className="w-3 h-3" />}
                            {a.type === "image" && <ImageIcon className="w-3 h-3" />}
                            {a.type === "link" && <LinkIcon className="w-3 h-3" />}
                            <span>{a.name || a.url}</span>
                            <Button type="button" size="icon" variant="ghost" className="ml-1" onClick={() => handleRemoveAttachment(i)}>
                              ×
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="text-xs text-gray-500 mt-1">You can add multiple attachments of any file format or link.</div>
                  </div>
                </form>
              </div>
              {/* Footer - sticky */}
              <div className="sticky bottom-0 left-0 w-full bg-white border-t p-4 flex justify-end z-10">
                <Button onClick={handleAddNotice} className="w-32 h-10 text-base font-semibold">Add</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
