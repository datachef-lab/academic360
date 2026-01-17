// import { Router } from "express";
// import {
//   createAddonHandler,
//   deleteAddonHandler,
//   getAddonByIdHandler,
//   getAddonsHandler,
//   updateAddonHandler,
// } from "../controllers/addon.controller.js";
// // import { getAddonsHandler, getAddonByIdHandler, createAddonHandler, updateAddonHandler, deleteAddonHandler } from "../controllers/addon.controller.js";

// const addonRouter = Router();

// addonRouter.get("/", getAddonsHandler);
// addonRouter.get("/:id", getAddonByIdHandler);
// addonRouter.post("/", createAddonHandler);
// addonRouter.put("/:id", updateAddonHandler);
// addonRouter.delete("/:id", deleteAddonHandler);

// export default addonRouter;

import { Request, Response, NextFunction, Router } from "express";
import {
  createAddonHandler,
  deleteAddonHandler,
  getAddonByIdHandler,
  getAllAddonsHandler,
  updateAddonHandler,
} from "../controllers/addon.controller.js";

const router = Router();

// Utility to wrap async route handlers
function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.get("/", asyncHandler(getAllAddonsHandler));

router.get("/:id", asyncHandler(getAddonByIdHandler));

router.post("/", asyncHandler(createAddonHandler));

router.put("/:id", asyncHandler(updateAddonHandler));

router.delete("/:id", asyncHandler(deleteAddonHandler));

export default router;
