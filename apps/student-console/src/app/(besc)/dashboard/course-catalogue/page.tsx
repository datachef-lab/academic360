"use client";

import React, { useState, useEffect } from "react";
import { useStudent } from "@/providers/student-provider";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { DbCourseMaterial } from "@/types/academics/course-material";
import {
  Download,
  ExternalLink,
  Book,
  BookOpen,
  GraduationCap,
  School,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CourseCataloguePage() {
  const { batches, loading, accessControl } = useStudent();
  const router = useRouter();
  const [selectedBatch, setSelectedBatch] = useState<number | null>(null);
  const [materialLinks, setMaterialLinks] = useState<DbCourseMaterial[]>([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState<boolean>(false);

  useEffect(() => {
    if (!accessControl?.access_course) {
      router.back();
    }
  }, [accessControl, router]);

  // Fetch materials for all subjects in a batch with a single API call
  const fetchBatchMaterials = async (
    batchSubjects: Array<{ subjectId?: number }>
  ) => {
    if (!batchSubjects || batchSubjects.length === 0) return;

    try {
      setIsLoadingMaterials(true);

      // Extract all subject IDs from the batch
      const subjectIds = batchSubjects
        .filter((subject) => subject.subjectId)
        .map((subject) => subject.subjectId!);

      if (subjectIds.length === 0) return;

      // Create URL with all subject IDs as query parameters
      const queryParams = new URLSearchParams();
      subjectIds.forEach((id) =>
        queryParams.append("subjectIds", id.toString())
      );

      console.log(
        `Fetching materials for ${subjectIds.length} subjects with a single API call`
      );
      const response = await fetch(
        `/api/batch-course-materials?${queryParams.toString()}`
      );

      if (!response.ok) {
        throw new Error(
          `API returned ${response.status}: ${await response.text()}`
        );
      }

      const materials = await response.json();
      console.log(
        `Successfully fetched ${materials.length} materials for all subjects`
      );
      setMaterialLinks(materials);
    } catch (error) {
      console.error("Error fetching batch materials:", error);
    } finally {
      setIsLoadingMaterials(false);
    }
  };

  // Use the batch API when selecting a batch
  useEffect(() => {
    if (selectedBatch !== null && batches[selectedBatch]?.papers) {
      const currentBatchPapers = batches[selectedBatch].papers;
      fetchBatchMaterials(currentBatchPapers);
    }
  }, [selectedBatch, batches]);

  // Add useEffect for escape key handling
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedBatch !== null) {
        setSelectedBatch(null);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [selectedBatch]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-indigo-50/20 to-purple-50/20 p-6 space-y-6">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const handleCardClick = (index: number) => {
    if (selectedBatch === index) {
      setSelectedBatch(null);
    } else {
      setSelectedBatch(index);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-indigo-50/20 to-purple-50/20">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 text-white py-10 px-6 mb-8 rounded-b-3xl shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-blue-400 mix-blend-overlay blur-2xl"></div>
          <div className="absolute right-40 top-20 w-32 h-32 rounded-full bg-purple-400 mix-blend-overlay blur-xl"></div>
          <div className="absolute left-20 bottom-10 w-48 h-48 rounded-full bg-indigo-300 mix-blend-overlay blur-2xl"></div>
          <div className="absolute inset-0 bg-[url('/illustrations/dots-pattern.svg')] opacity-5"></div>
        </div>
        <div className="max-w-7xl mx-auto relative">
          <div className="flex items-center">
            <div className="mr-5 bg-white/10 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-white/10">
              <GraduationCap size={36} className="text-white drop-shadow-md" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white drop-shadow-md">
                Course Catalogue
              </h1>
              <p className="text-blue-50 text-lg drop-shadow max-w-2xl">
                Explore your academic journey and access course materials
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-12">
        {batches.length === 0 ? (
          <div className="text-center py-12 bg-white/60 backdrop-blur-sm rounded-2xl border border-indigo-100 shadow-lg">
            <School className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-lg text-gray-600">
              No academic information available
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {selectedBatch !== null ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="w-full"
                  key="selected-batch"
                >
                  <Card
                    className="w-full bg-white/80 backdrop-blur-sm border-indigo-100 shadow-lg hover:shadow-xl transition-all relative"
                    onClick={() => setSelectedBatch(null)}
                  >
                    <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 rounded-t-lg"></div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBatch(null);
                      }}
                      className="absolute right-4 top-4 p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                      aria-label="Close details"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-2xl font-bold text-gray-800 flex items-center">
                            <BookOpen className="w-8 h-8 mr-3 text-indigo-600" />
                            {batches[selectedBatch].coursename}
                          </CardTitle>
                          <p className="text-lg text-gray-600 ml-11">
                            {batches[selectedBatch].classname} (
                            {batches[selectedBatch].sectionName})
                          </p>
                        </div>
                        <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-1 text-sm">
                          {batches[selectedBatch].sessionName}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4 relative">
                        {/* Loading indicator */}
                        {isLoadingMaterials && (
                          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
                            <div className="flex flex-col items-center">
                              <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-300 border-t-indigo-600 mb-2"></div>
                              <p className="text-sm text-indigo-600">
                                Loading course materials...
                              </p>
                            </div>
                          </div>
                        )}

                        <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                          <Book className="w-5 h-5 mr-2 text-indigo-600" />
                          Subjects & Papers
                        </h3>
                        {batches[selectedBatch].papers &&
                        batches[selectedBatch].papers.length > 0 ? (
                          <div
                            className="rounded-xl border border-indigo-100 overflow-hidden bg-white"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-indigo-100">
                                  <TableHead className="w-[25%] text-indigo-900 font-semibold">
                                    Subject
                                  </TableHead>
                                  <TableHead className="w-[25%] text-indigo-900 font-semibold">
                                    Paper
                                  </TableHead>
                                  <TableHead className="w-[20%] text-indigo-900 font-semibold">
                                    Type
                                  </TableHead>
                                  <TableHead className="w-[30%] text-indigo-900 font-semibold">
                                    Materials
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {batches[selectedBatch].papers.map(
                                  (paper, index) => (
                                    <TableRow
                                      key={index}
                                      className="hover:bg-gray-50/50"
                                    >
                                      <TableCell className="font-medium text-gray-900">
                                        {paper.subjectname}
                                      </TableCell>
                                      <TableCell className="text-gray-700">
                                        {paper.paperName}
                                      </TableCell>
                                      <TableCell>
                                        <Badge
                                          variant="outline"
                                          className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs"
                                        >
                                          {paper.subjecttypename}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                        {paper.subjectId &&
                                          materialLinks
                                            .filter(
                                              (m) =>
                                                m.subject_id_fk ===
                                                paper.subjectId
                                            )
                                            .map((material, idx) => (
                                              <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{
                                                  delay: idx * 0.1,
                                                }}
                                                className="flex items-center gap-2 mb-1"
                                              >
                                                {material.type === "file" ? (
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 px-3 text-blue-700 hover:text-blue-800 hover:bg-blue-50 transition-colors"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      window.open(
                                                        `/api/download?filePath=${encodeURIComponent(
                                                          material.file_path ||
                                                            ""
                                                        )}`,
                                                        "_blank"
                                                      );
                                                    }}
                                                  >
                                                    <Download className="h-3.5 w-3.5 mr-1.5" />
                                                    {material.title}
                                                  </Button>
                                                ) : (
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 px-3 text-purple-700 hover:text-purple-800 hover:bg-purple-50 transition-colors"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      window.open(
                                                        material.url,
                                                        "_blank"
                                                      );
                                                    }}
                                                  >
                                                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                                                    {material.title}
                                                  </Button>
                                                )}
                                              </motion.div>
                                            ))}
                                      </TableCell>
                                    </TableRow>
                                  )
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <div className="text-center py-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-300">
                            <Book className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                            <p className="text-gray-600">
                              No papers available for this batch
                            </p>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 text-center mt-6">
                        Press ESC or click anywhere to close
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  key="batch-grid"
                >
                  {batches.map((batch, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        className="cursor-pointer bg-white hover:bg-white/95 shadow-md hover:shadow-xl transition-all overflow-hidden group rounded-xl"
                        onClick={() => handleCardClick(index)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600">
                              <BookOpen className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-1">
                                {batch.coursename}
                              </h3>
                              <p className="text-sm text-gray-500 mb-3 line-clamp-1">
                                {batch.classname} ({batch.sectionName})
                              </p>
                              <Badge className="bg-blue-100 hover:bg-blue-200 text-blue-700 border-0 transition-colors">
                                {batch.sessionName}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
