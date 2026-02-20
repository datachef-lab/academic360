import { Router } from "express";
import feeSlabRouter from "./fee-slab.route.js";
import feeGroupRouter from "./fee-group.route.js";
import feeCategoryRouter from "./fee-category.route.js";
import feeHeadRouter from "./fee-head.route.js";
import feeStructureComponentRouter from "./fee-structure-component.routes.js";
import feeStructureInstallmentRouter from "./instalment.route.js";
import feeStudentMappingRouter from "./fee-student-mapping.route.js";
import feeGroupPromotionMappingRouter from "./fee-group-promotion-mapping.route.js";
import feeCategoryPromotionMappingRouter from "./fee-category-promotion-mapping.route.js";
import receiptTypeRouter from "./receipt-type.route.js";
import addonRouter from "./addon.route.js";

const router = Router();

// Fee Slabs (formerly concession slabs)
router.use("/slabs", feeSlabRouter);

// Fee Groups
router.use("/groups", feeGroupRouter);

// Fee Categories
router.use("/categories", feeCategoryRouter);

// Fee Heads
router.use("/heads", feeHeadRouter);

// Fee Structure Components
router.use("/structure-components", feeStructureComponentRouter);

// Fee Structure Installments
router.use("/structure-installments", feeStructureInstallmentRouter);

// Fee Student Mappings
router.use("/student-mappings", feeStudentMappingRouter);

// Fee Group Promotion Mappings
router.use("/group-promotion-mappings", feeGroupPromotionMappingRouter);

// Fee Category Promotion Mappings (used for CU exam form submission tracking)
router.use(
  "/fee-category-promotion-mappings",
  feeCategoryPromotionMappingRouter,
);

// Receipt Types
router.use("/receipt-types", receiptTypeRouter);

// Addons
router.use("/addons", addonRouter);

export default router;
