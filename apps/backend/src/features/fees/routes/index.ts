import { Router } from "express";
import feesStructureRouter from "./fees-structure.route";
import feesSlabYearMappingRouter from "./fees-slab-year-mapping.route";
import feesDesignAbstractLevelRouter from "./fees-design-abstract-level.route";
import feesComponentRouter from "./feesComponent.route";
import feesSlabRouter from "./fees-slab.route";

const router = Router();

router.use("/structure", feesStructureRouter);
router.use("/slab-year-mappings", feesSlabYearMappingRouter);
router.use("/design-abstract-level", feesDesignAbstractLevelRouter);
router.use("/components", feesComponentRouter);
router.use("/slabs", feesSlabRouter);

export default router; 