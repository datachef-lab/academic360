import { Router } from "express";
import { 
    getFeesStructuresHandler, 
    getFeesStructureByIdHandler, 
    createFeesStructureHandler, 
    updateFeesStructureHandler, 
    deleteFeesStructureHandler,
    getAcademicYearsFromFeesStructuresHandler,
    getCoursesFromFeesStructuresHandler,
    getFeesStructuresByAcademicYearIdAndCourseIdHandler,
    getFeesDesignAbstractLevelHandler
} from "../controllers/fees-structure.controller.js";

const feesStructureRouter = Router();

// Base CRUD routes
feesStructureRouter.get("/", getFeesStructuresHandler);
feesStructureRouter.get("/:id", getFeesStructureByIdHandler);
feesStructureRouter.post("/", createFeesStructureHandler);
feesStructureRouter.put("/:id", updateFeesStructureHandler);
feesStructureRouter.delete("/:id", deleteFeesStructureHandler);

// Additional routes
feesStructureRouter.get("/academic-years/all", getAcademicYearsFromFeesStructuresHandler);
feesStructureRouter.get("/courses/:academicYearId", getCoursesFromFeesStructuresHandler);
feesStructureRouter.get("/by-academic-year-and-course/:academicYearId/:courseId", getFeesStructuresByAcademicYearIdAndCourseIdHandler);
feesStructureRouter.get("/design-abstract-level", getFeesDesignAbstractLevelHandler);

export default feesStructureRouter;
