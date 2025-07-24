import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getCourse } from '@/services/course-api';
import { getAllSubjects } from '@/services/subject-metadata';
import { Course } from '@/types/course-design';
import { SubjectMetadata } from '@/types/academics/subject-metadata';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FaBook, FaUpload, FaDownload } from 'react-icons/fa';
// import { Select } from '@/components/ui/select';

const PAGE_SIZE = 10;

export default function CoursePage() {
    const { courseId } = useParams<{ courseId: string }>();
    const [course, setCourse] = useState<Course | null>(null);
    const [subjects, setSubjects] = useState<SubjectMetadata[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState<{ open: boolean, subject: SubjectMetadata | null }>({ open: false, subject: null });
    const [currentPage, setCurrentPage] = useState(1);

    // Mock/fetch available classes (replace with API if available)
    const [availableClasses, setAvailableClasses] = useState<{ id: number, name: string }[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<number | 'all'>('all');

    useEffect(() => {
        if (!courseId) return;
        setLoading(true);
        Promise.all([
            getCourse(Number(courseId)),
            getAllSubjects()
        ])
            .then(([courseRes, subjectsRes]) => {
                setCourse(courseRes.payload);
                // Filter subjects by degree and programmeType
                const filtered = subjectsRes.payload.filter(
                    (s) =>
                        s.degree?.id === courseRes.payload.degree?.id &&
                        s.programmeType === courseRes.payload.programmeType
                );
                setSubjects(filtered);
                setError(null);
            })
            .catch(() => {
                setError('Failed to fetch course or subjects');
                setCourse(null);
                setSubjects([]);
            })
            .finally(() => setLoading(false));
    }, [courseId]);

    useEffect(() => {
        // TODO: Replace with API call if available
        // Collect unique classes from subjects
        const uniqueClasses: { id: number, name: string }[] = [];
        subjects.forEach(s => {
            if (s.class && typeof s.class.id === 'number' && !uniqueClasses.some(c => c.id === s.class!.id)) {
                uniqueClasses.push({ id: s.class.id, name: s.class.name });
            }
        });
        setAvailableClasses(uniqueClasses);
    }, [subjects]);

    // Filter subjects by selected class
    const filteredSubjects = selectedClassId === 'all'
        ? subjects
        : subjects.filter(s => s.class?.id === selectedClassId);

    // Add placeholder handlers for upload/download
    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        // TODO: Implement upload logic
        const file = e.target.files?.[0];
        if (file) {
            alert(`Selected file: ${file.name}`);
        }
    };
    const handleDownload = () => {
        // TODO: Implement download/export logic
        alert('Download triggered!');
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="text-red-500">{error}</div>;
    if (!course) return <div>No course found.</div>;

    return (
        <div className="px-4 py-2">
            {/* Enhanced Course Header (No Color) */}
            <div className="mb-6 rounded-xl shadow-lg bg-white p-6 m-2 flex items-center gap-6 border">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-200 text-3xl shadow-md">
                    <FaBook />
                </div>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold mb-5">{course.name}</h1>
                    <div className="grid grid-cols-5 gap-4 text-base">
                        <div>
                            <div className="font-semibold">Degree</div>
                            <div>{course.degree?.name || '-'}</div>
                        </div>
                        <div>
                            <div className="font-semibold">Programme Type</div>
                            <div>{course.programmeType || '-'}</div>
                        </div>
                        <div>
                            <div className="font-semibold">Short Name</div>
                            <div>{course.shortName || '-'}</div>
                        </div>
                        <div>
                            <div className="font-semibold">Code Prefix</div>
                            <div>{course.codePrefix || '-'}</div>
                        </div>
                        <div>
                            <div className="font-semibold">University Code</div>
                            <div>{course.universityCode || '-'}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Class Dropdown and Button Row */}
            <div className="mb-4 flex justify-between items-center gap-2">
                {/* Class Dropdown */}
                <div className="min-w-[200px]">
                    <label htmlFor="class-select" className="block text-sm font-medium mb-1"></label>
                    <select
                        id="class-select"
                        className="border rounded px-2 py-1 w-full"
                        value={selectedClassId === 'all' ? 'all' : String(selectedClassId)}
                        onChange={e => setSelectedClassId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    >
                        <option value="all">All Classes</option>
                        {availableClasses.map(cls => (
                            <option key={cls.id} value={cls.id}>{cls.name}</option>
                        ))}
                    </select>
                </div>
                {/* Button Row */}
                <div className="flex justify-end gap-2 flex-1">
                    <input
                        id="subject-upload-input"
                        type="file"
                        accept=".xlsx,.csv"
                        className="hidden"
                        onChange={handleUpload}
                    />
                    <Button
                        variant={"secondary"}
                        className="border flex items-center gap-2"
                        onClick={() => document.getElementById('subject-upload-input')?.click()}
                    >
                        <FaUpload className="text-base" /> Upload
                    </Button>
                    <Button
                        variant={"secondary"}
                        className="border flex items-center gap-2"
                        onClick={handleDownload}
                    >
                        <FaDownload className="text-base" /> Download
                    </Button>
                    <Button
                        onClick={() => setShowAddModal(true)}
                        variant={"secondary"}
                        className='border'
                    >
                        + Add Subject
                    </Button>
                </div>
            </div>

            {/* Subjects Table with Scroll and Pagination */}
            <div className="rounded-xl border bg-white shadow-lg overflow-x-auto max-w-full">
                <Table className="min-w-[1800px] text-sm">
                    <TableHeader className="sticky top-0 z-10 bg-white border-b">
                        <TableRow>
                            <TableHead>Subject Name</TableHead>
                            <TableHead>Degree</TableHead>
                            <TableHead>Programme Type</TableHead>
                            <TableHead>Framework</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead>Specialization</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Subject Type</TableHead>
                            <TableHead>IRP Name</TableHead>
                            <TableHead>IRP Code</TableHead>
                            <TableHead>Marksheet Code</TableHead>
                            <TableHead>Optional</TableHead>
                            <TableHead>Credit</TableHead>
                            <TableHead>Theory Credit</TableHead>
                            <TableHead>Full Marks Theory</TableHead>
                            <TableHead>Practical Credit</TableHead>
                            <TableHead>Full Marks Practical</TableHead>
                            <TableHead>Internal Credit</TableHead>
                            <TableHead>Full Marks Internal</TableHead>
                            <TableHead>Project Credit</TableHead>
                            <TableHead>Full Marks Project</TableHead>
                            <TableHead>Viva Credit</TableHead>
                            <TableHead>Full Marks Viva</TableHead>
                            <TableHead>Full Marks</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead>Updated At</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredSubjects.length > 0 ? (
                            filteredSubjects.map((subject, idx) => (
                                <TableRow key={subject.id} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                    <TableCell className="max-w-[180px] truncate" title={subject.name}>{subject.name}</TableCell>
                                    <TableCell>{subject.degree?.name || '-'}</TableCell>
                                    <TableCell>{subject.programmeType || '-'}</TableCell>
                                    <TableCell>{subject.framework || '-'}</TableCell>
                                    <TableCell>{subject.class?.name || '-'}</TableCell>
                                    <TableCell>{subject.specialization?.name || '-'}</TableCell>
                                    <TableCell>{subject.category || '-'}</TableCell>
                                    <TableCell>{subject.subjectType?.name || '-'}</TableCell>
                                    <TableCell className="max-w-[120px] truncate" title={subject.irpName || ''}>{subject.irpName || '-'}</TableCell>
                                    <TableCell>{subject.irpCode || '-'}</TableCell>
                                    <TableCell>{subject.marksheetCode || '-'}</TableCell>
                                    <TableCell>{subject.isOptional ? 'Yes' : 'No'}</TableCell>
                                    <TableCell>{subject.credit}</TableCell>
                                    <TableCell>{subject.theoryCredit}</TableCell>
                                    <TableCell>{subject.fullMarksTheory}</TableCell>
                                    <TableCell>{subject.practicalCredit}</TableCell>
                                    <TableCell>{subject.fullMarksPractical}</TableCell>
                                    <TableCell>{subject.internalCredit ?? '-'}</TableCell>
                                    <TableCell>{subject.fullMarksInternal ?? '-'}</TableCell>
                                    <TableCell>{subject.projectCredit ?? '-'}</TableCell>
                                    <TableCell>{subject.fullMarksProject ?? '-'}</TableCell>
                                    <TableCell>{subject.vivalCredit ?? '-'}</TableCell>
                                    <TableCell>{subject.fullMarksViva ?? '-'}</TableCell>
                                    <TableCell>{subject.fullMarks ?? '-'}</TableCell>
                                    <TableCell>{subject.createdAt ? new Date(subject.createdAt).toLocaleDateString() : '-'}</TableCell>
                                    <TableCell>{subject.updatedAt ? new Date(subject.updatedAt).toLocaleDateString() : '-'}</TableCell>
                                    <TableCell>
                                        <Button size="sm" variant="outline" onClick={() => setShowEditModal({ open: true, subject })}>Edit</Button>
                                        <Button size="sm" variant="destructive" className="ml-2">Delete</Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={27} className="text-center py-8 text-gray-500">No subjects found for this course.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            {/* Pagination Controls */}
            {filteredSubjects.length > PAGE_SIZE && (
                <div className="flex justify-end items-center gap-2 mt-4">
                    <Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>&laquo;</Button>
                    <Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>&lsaquo;</Button>
                    <span className="px-2">Page {currentPage} of {Math.ceil(filteredSubjects.length / PAGE_SIZE)}</span>
                    <Button size="sm" variant="outline" disabled={currentPage === Math.ceil(filteredSubjects.length / PAGE_SIZE)} onClick={() => setCurrentPage(currentPage + 1)}>&rsaquo;</Button>
                </div>
            )}

            {/* Add/Edit Subject Modal Stubs */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded shadow-lg min-w-[300px]">
                        <h2 className="text-lg font-bold mb-4">Add Subject</h2>
                        {/* Add Subject Form Goes Here */}
                        <Button onClick={() => setShowAddModal(false)} className="mt-4">Close</Button>
                    </div>
                </div>
            )}
            {showEditModal.open && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded shadow-lg min-w-[300px]">
                        <h2 className="text-lg font-bold mb-4">Edit Subject</h2>
                        {/* Edit Subject Form Goes Here, pre-fill with showEditModal.subject */}
                        <Button onClick={() => setShowEditModal({ open: false, subject: null })} className="mt-4">Close</Button>
                    </div>
                </div>
            )}
        </div>
    );
}
