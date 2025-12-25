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
