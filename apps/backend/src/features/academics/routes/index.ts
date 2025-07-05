// import streamRouter from "@/features/academics/routes/stream.route.js"
import express from "express";
import subjectMetadataRouter from "@/features/academics/routes/subjectMetadata.route.js";
import subjectRouter from "@/features/academics/routes/subject.route.js";
import documentRouter from "@/features/academics/routes/document.route.js";
import marksheetRouter from "@/features/academics/routes/marksheet.route.js";
import batchRouter from "@/features/academics/routes/batch.route.js";
import batchPaperRouter from "@/features/academics/routes/batchPaper.route.js";
import studentPaperRouter from "@/features/academics/routes/studentPaper.route.js";
import courseRouter from "@/features/academics/routes/course.route.js";
import academicYearRouter from "@/features/academics/routes/academic-year.route.js";
import shiftRouter from "@/features/academics/routes/shift.route.js";
import classRouter from "@/features/academics/routes/class.route.js";
import sectionRoutes from "@/features/academics/routes/section.route.js";
export {
  // streamRouter,
  classRouter,
  subjectMetadataRouter,
  subjectRouter,
  documentRouter,
  marksheetRouter,
  academicYearRouter,
  batchRouter,
  batchPaperRouter,
  studentPaperRouter,
  courseRouter,
  shiftRouter,
  sectionRoutes
};
