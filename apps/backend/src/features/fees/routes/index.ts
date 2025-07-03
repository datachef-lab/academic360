import { Router } from "express";
import feesStructureRouter from "./fees-structure.route.js";
import feesSlabYearMappingRouter from "./fees-slab-mapping.route.js";
import feesComponentRouter from "./feesComponent.route.js";
import feesSlabRouter from "./fees-slab.route.js";
import instalmentRouter from "./instalment.route.js";

const router = Router();

router.use("/structure", feesStructureRouter);
router.use("/slab-year-mappings", feesSlabYearMappingRouter);
router.use("/components", feesComponentRouter);
router.use("/slabs", feesSlabRouter);
router.use("/instalments", instalmentRouter);

export default router; 