// import { Request, Response } from "express";
// import {
//   getAddons,
//   getAddonById,
//   createAddon,
//   updateAddon,
//   deleteAddon,
// } from "../services/addon.service.js";
// import { handleError } from "@/utils/index.js";

// export const getAddonsHandler = async (req: Request, res: Response) => {
//   try {
//     const addons = await getAddons();
//     if (addons === null) {
//       return handleError(new Error("Error fetching addons"), res);
//     }
//     res.status(200).json(addons);
//   } catch (error) {
//     handleError(error, res);
//   }
// };

// export const getAddonByIdHandler = async (
//   req: Request,
//   res: Response,
// ): Promise<void> => {
//   try {
//     const id = parseInt(req.params.id);
//     const addon = await getAddonById(id);
//     if (addon === null) {
//       handleError(new Error("Error fetching addon"), res);
//       return;
//     }
//     if (!addon) {
//       res.status(404).json({ message: "Addon not found" });
//       return;
//     }
//     res.status(200).json(addon);
//   } catch (error) {
//     handleError(error, res);
//   }
// };

// export const createAddonHandler = async (req: Request, res: Response) => {
//   try {
//     const newAddon = await createAddon(req.body);
//     if (newAddon === null) {
//       handleError(new Error("Error creating addon"), res);
//       return;
//     }
//     res.status(201).json(newAddon);
//   } catch (error) {
//     handleError(error, res);
//   }
// };

// export const updateAddonHandler = async (req: Request, res: Response) => {
//   try {
//     const id = parseInt(req.params.id);
//     const updatedAddon = await updateAddon(id, req.body);
//     if (updatedAddon === null) {
//       handleError(new Error("Error updating addon"), res);
//       return;
//     }
//     if (!updatedAddon) {
//       res.status(404).json({ message: "Addon not found" });
//       return;
//     }
//     res.status(200).json(updatedAddon);
//   } catch (error) {
//     handleError(error, res);
//   }
// };

// export const deleteAddonHandler = async (req: Request, res: Response) => {
//   try {
//     const id = parseInt(req.params.id);
//     const deletedAddon = await deleteAddon(id);
//     if (deletedAddon === null) {
//       handleError(new Error("Error deleting addon"), res);
//       return;
//     }
//     if (!deletedAddon) {
//       res.status(404).json({ message: "Addon not found" });
//       return;
//     }
//     res.status(200).json(deletedAddon);
//   } catch (error) {
//     handleError(error, res);
//   }
// };

import { Request, Response } from "express";
import { AddOn } from "@repo/db/schemas";
import * as addonService from "../services/addon.service";
import { handleError } from "@/utils";
import { ApiResponse } from "@/utils/ApiResonse";

/**
 * Create a new addon
 */
export async function createAddonHandler(req: Request, res: Response) {
  try {
    const body = req.body as AddOn;
    const created = await addonService.createAddon(body);

    // If service unexpectedly returns null/undefined treat as internal error
    if (!created) {
      return res
        .status(500)
        .json(new ApiResponse(500, "ERROR", null, "Failed to create addon"));
    }

    return res
      .status(201)
      .json(new ApiResponse(201, "SUCCESS", created, "Addon created"));
  } catch (error) {
    return handleError(error, res);
  }
}

/**
 * Get all addons
 */
export async function getAllAddonsHandler(_req: Request, res: Response) {
  try {
    const addons = await addonService.getAllAddons();
    return res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", addons, "Addons fetched"));
  } catch (error) {
    return handleError(error, res);
  }
}

/**
 * Get addon by id
 */
export async function getAddonByIdHandler(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const addon = await addonService.getAddonById(id);

    if (!addon) {
      return res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "Addon not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", addon, "Addon fetched"));
  } catch (error) {
    return handleError(error, res);
  }
}

/**
 * Update addon by id
 */
export async function updateAddonHandler(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const body = req.body as Partial<AddOn>;
    const updated = await addonService.updateAddon(id, body);

    if (!updated) {
      return res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "Addon not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", updated, "Addon updated"));
  } catch (error) {
    return handleError(error, res);
  }
}

/**
 * Delete addon by id
 */
export async function deleteAddonHandler(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const deleted = await addonService.deleteAddon(id);

    if (!deleted) {
      return res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "Addon not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "DELETED", deleted, "Addon deleted"));
  } catch (error) {
    return handleError(error, res);
  }
}
