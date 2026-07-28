import { verifyJWT } from "@/middlewares/index.js";
import { Router, Request, Response, NextFunction } from "express";
import {
  createDeclarationMasterHandler,
  createFieldHandler,
  createOptionHandler,
  createStatementHandler,
  deleteDeclarationMasterHandler,
  deleteFieldHandler,
  deleteOptionHandler,
  deleteStatementHandler,
  getDeclarationMasterByIdHandler,
  getDeclarationMastersHandler,
  getFieldsHandler,
  getOptionsHandler,
  getStatementsHandler,
  previewDeclarationMasterDraftHandler,
  previewDeclarationMasterHandler,
  updateDeclarationMasterHandler,
  updateFieldHandler,
  updateOptionHandler,
  updateStatementHandler,
} from "../controllers/declaration-master.controller.js";

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

router.use(verifyJWT);

// Children first — otherwise "/statements" would match "/:id".
router.get("/statements", asyncHandler(getStatementsHandler));
router.post("/statements", asyncHandler(createStatementHandler));
router.put("/statements/:id", asyncHandler(updateStatementHandler));
router.delete("/statements/:id", asyncHandler(deleteStatementHandler));

router.get("/statement-fields", asyncHandler(getFieldsHandler));
router.post("/statement-fields", asyncHandler(createFieldHandler));
router.put("/statement-fields/:id", asyncHandler(updateFieldHandler));
router.delete("/statement-fields/:id", asyncHandler(deleteFieldHandler));

router.get("/statement-field-options", asyncHandler(getOptionsHandler));
router.post("/statement-field-options", asyncHandler(createOptionHandler));
router.put("/statement-field-options/:id", asyncHandler(updateOptionHandler));
router.delete(
  "/statement-field-options/:id",
  asyncHandler(deleteOptionHandler),
);

// Static path first: "preview" would otherwise be read as an ":id".
router.post("/preview", asyncHandler(previewDeclarationMasterDraftHandler));

router.get("/", asyncHandler(getDeclarationMastersHandler));
// Before "/:id" so the preview suffix isn't swallowed by the catch-all.
router.get("/:id/preview", asyncHandler(previewDeclarationMasterHandler));
router.get("/:id", asyncHandler(getDeclarationMasterByIdHandler));
router.post("/", asyncHandler(createDeclarationMasterHandler));
router.put("/:id", asyncHandler(updateDeclarationMasterHandler));
router.delete("/:id", asyncHandler(deleteDeclarationMasterHandler));

export default router;
