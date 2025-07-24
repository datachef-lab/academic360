// import { Request, Response } from "express";
// import {
//   createAffiliationType as createAffiliationTypeService,
//   getAllAffiliationTypes as getAllAffiliationTypesService,
//   getAffiliationTypeById as getAffiliationTypeByIdService,
//   updateAffiliationType as updateAffiliationTypeService,
//   deleteAffiliationType as deleteAffiliationTypeService,
// } from "@/features/course-design/services/affiliation-type.service.js";

// export const createAffiliationType = async (req: Request, res: Response) => {
//   try {
//     const newAffiliationType = await createAffiliationTypeService(req.body);
//     res.status(201).json(newAffiliationType);
//   } catch (error: any) {
//     res.status(400).json({ error: error.message });
//   }
// };

// export const getAllAffiliationTypes = async (_req: Request, res: Response) => {
//   try {
//     const allAffiliationTypes = await getAllAffiliationTypesService();
//     res.json(allAffiliationTypes);
//   } catch (error: any) {
//     res.status(500).json({ error: error.message });
//   }
// };

// export const getAffiliationTypeById = async (req: Request, res: Response) => {
//   try {
//     const affiliationType = await getAffiliationTypeByIdService(req.params.id);
//     if (!affiliationType) {
//       return res.status(404).json({ error: "AffiliationType not found" });
//     }
//     res.json(affiliationType);
//   } catch (error: any) {
//     res.status(500).json({ error: error.message });
//   }
// };

// export const updateAffiliationType = async (req: Request, res: Response) => {
//   try {
//     const updatedAffiliationType = await updateAffiliationTypeService(req.params.id, req.body);
//     if (!updatedAffiliationType) {
//       return res.status(404).json({ error: "AffiliationType not found" });
//     }
//     res.json(updatedAffiliationType);
//   } catch (error: any) {
//     res.status(400).json({ error: error.message });
//   }
// };

// export const deleteAffiliationType = async (req: Request, res: Response) => {
//   try {
//     const deletedAffiliationType = await deleteAffiliationTypeService(req.params.id);
//     if (!deletedAffiliationType) {
//       return res.status(404).json({ error: "AffiliationType not found" });
//     }
//     res.json({ message: "AffiliationType deleted successfully" });
//   } catch (error: any) {
//     res.status(500).json({ error: error.message });
//   }
// };
