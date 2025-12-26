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

/**
 * Create a new addon
 */
export async function createAddonHandler(req: Request, res: Response) {
  try {
    const body = req.body as AddOn;
    const result = await addonService.createAddon(body);

    if (!result.success) {
      return res.status(500).json(result);
    }

    return res.status(201).json(result);
  } catch (error) {
    return handleError(error, res);
  }
}

/**
 * Get all addons
 */
export async function getAllAddonsHandler(_req: Request, res: Response) {
  try {
    const result = await addonService.getAllAddons();

    if (!result.success) {
      return res.status(500).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
}

/**
 * Get addon by id
 */
export async function getAddonByIdHandler(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });
    }

    const result = await addonService.getAddonById(id);

    if (!result.success) {
      const isNotFound = result.message.includes("not found");
      return res.status(isNotFound ? 404 : 500).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
}

/**
 * Update addon by id
 */
export async function updateAddonHandler(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });
    }

    const body = req.body as Partial<AddOn>;
    const result = await addonService.updateAddon(id, body);

    if (!result.success) {
      const isNotFound = result.message.includes("not found");
      return res.status(isNotFound ? 404 : 500).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
}

/**
 * Delete addon by id
 */
export async function deleteAddonHandler(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });
    }

    const result = await addonService.deleteAddon(id);

    if (!result.success) {
      const isNotFound = result.message.includes("not found");
      return res.status(isNotFound ? 404 : 500).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
}
