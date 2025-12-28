import { Router } from "express";
import * as feesStructureController from "../controllers/fees-structure.controller.js";

const router = Router();

router.post("/", feesStructureController.createFeeStructure);
router.get("/", feesStructureController.getAllFeeStructures);
router.get("/:id", feesStructureController.getFeeStructureById);
router.put("/:id", feesStructureController.updateFeeStructure);
router.delete("/:id", feesStructureController.deleteFeeStructure);

export default router;
// import { Router } from "express";
// import {
//   getFeesStructuresHandler,
//   getFeesStructureByIdHandler,
//   createFeesStructureHandler,
//   updateFeesStructureHandler,
//   deleteFeesStructureHandler,
//   getAcademicYearsFromFeesStructuresHandler,
//   getCoursesFromFeesStructuresHandler,
//   getFeesStructuresByAcademicYearIdAndCourseIdHandler,
//   checkFeesStructureExistsHandler,
// } from "../controllers/fees-structure.controller.js";

// const feesStructureRouter = Router();

// // Base CRUD routes
// feesStructureRouter.get("/", getFeesStructuresHandler);
// feesStructureRouter.get("/:id", getFeesStructureByIdHandler);
// feesStructureRouter.post("/", createFeesStructureHandler);
// feesStructureRouter.put("/:id", updateFeesStructureHandler);
// feesStructureRouter.delete("/:id", deleteFeesStructureHandler);

// // Additional routes
// feesStructureRouter.get(
//   "/academic-years/all",
//   getAcademicYearsFromFeesStructuresHandler,
// );
// feesStructureRouter.get(
//   "/courses/:academicYearId",
//   getCoursesFromFeesStructuresHandler,
// );
// feesStructureRouter.get(
//   "/by-academic-year-and-course/:academicYearId/:courseId",
//   getFeesStructuresByAcademicYearIdAndCourseIdHandler,
// );
// // feesStructureRouter.get("/design-abstract-level", getFeesDesignAbstractLevelHandler);
// feesStructureRouter.post("/exists", checkFeesStructureExistsHandler);

// export default feesStructureRouter;
