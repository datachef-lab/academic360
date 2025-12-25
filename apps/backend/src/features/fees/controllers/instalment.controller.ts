// import { Request, Response } from "express";
// import * as instalmentService from "../services/fee-structure-installment.service.js";

// export const createInstalment = async (
//   req: Request,
//   res: Response,
// ): Promise<void> => {
//   try {
//     const instalment = await instalmentService.createInstalment(req.body);
//     if (!instalment) {
//       res.status(400).json({ message: "Failed to create instalment" });
//       return;
//     }
//     res.status(201).json(instalment);
//   } catch (error) {
//     res.status(500).json({ message: "Internal server error", error });
//   }
// };

// export const getInstalmentById = async (
//   req: Request,
//   res: Response,
// ): Promise<void> => {
//   try {
//     const id = Number(req.params.id);
//     const instalment = await instalmentService.getInstalmentById(id);
//     if (!instalment) {
//       res.status(404).json({ message: "Instalment not found" });
//       return;
//     }
//     res.json(instalment);
//   } catch (error) {
//     res.status(500).json({ message: "Internal server error", error });
//   }
// };

// export const getInstalmentsByFeesStructureId = async (
//   req: Request,
//   res: Response,
// ): Promise<void> => {
//   try {
//     const feesStructureId = Number(req.params.feesStructureId);
//     const instalments =
//       await instalmentService.getInstalmentsByFeesStructureId(feesStructureId);
//     res.json(instalments);
//   } catch (error) {
//     res.status(500).json({ message: "Internal server error", error });
//   }
// };

// export const updateInstalment = async (
//   req: Request,
//   res: Response,
// ): Promise<void> => {
//   try {
//     const id = Number(req.params.id);
//     const updated = await instalmentService.updateInstalment(id, req.body);
//     if (!updated) {
//       res
//         .status(404)
//         .json({ message: "Instalment not found or update failed" });
//       return;
//     }
//     res.json(updated);
//   } catch (error) {
//     res.status(500).json({ message: "Internal server error", error });
//   }
// };

// export const deleteInstalment = async (
//   req: Request,
//   res: Response,
// ): Promise<void> => {
//   try {
//     const id = Number(req.params.id);
//     const deleted = await instalmentService.deleteInstalment(id);
//     if (!deleted) {
//       res
//         .status(404)
//         .json({ message: "Instalment not found or delete failed" });
//       return;
//     }
//     res.json(deleted);
//   } catch (error) {
//     res.status(500).json({ message: "Internal server error", error });
//   }
// };
