import { Request, Response } from "express";
import {
  getFeesHeads,
  getFeesHeadById,
  createFeesHead,
  updateFeesHead,
  deleteFeesHead,
} from "../services/fees-head.service.js";
import { handleError } from "@/utils/index.js";

export const getFeesHeadsHandler = async (req: Request, res: Response) => {
  try {
    const feesHeads = await getFeesHeads();
    if (feesHeads === null) {
      handleError(new Error("Error fetching fees heads"), res);
      return;
    }
    res.status(200).json(feesHeads);
  } catch (error) {
    handleError(error, res);
  }
};

export const getFeesHeadByIdHandler = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const feesHead = await getFeesHeadById(id);
    if (feesHead === null) {
      handleError(new Error("Error fetching fees head"), res);
      return;
    }
    if (!feesHead) {
      res.status(404).json({ message: "Fees head not found" });
      return;
    }
    res.status(200).json(feesHead);
  } catch (error) {
    handleError(error, res);
  }
};

export const createFeesHeadHandler = async (req: Request, res: Response) => {
  try {
    const newFeesHead = await createFeesHead(req.body);
    if (newFeesHead === null) {
      handleError(new Error("Error creating fees head"), res);
      return;
    }
    res.status(201).json(newFeesHead);
  } catch (error) {
    handleError(error, res);
  }
};

export const updateFeesHeadHandler = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const updatedFeesHead = await updateFeesHead(id, req.body);
    if (updatedFeesHead === null) {
      handleError(new Error("Error updating fees head"), res);
      return;
    }
    if (!updatedFeesHead) {
      res.status(404).json({ message: "Fees head not found" });
      return;
    }
    res.status(200).json(updatedFeesHead);
  } catch (error) {
    handleError(error, res);
  }
};

export const deleteFeesHeadHandler = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const deletedFeesHead = await deleteFeesHead(id);
    if (deletedFeesHead === null) {
      handleError(new Error("Error deleting fees head"), res);
      return;
    }
    if (!deletedFeesHead) {
      res.status(404).json({ message: "Fees head not found" });
      return;
    }
    res.status(200).json(deletedFeesHead);
  } catch (error) {
    handleError(error, res);
  }
};
