import { Request, Response } from "express";
import {
  getFeesComponents,
  getFeesComponentById,
  createFeesComponent,
  updateFeesComponent,
  deleteFeesComponent,
} from "../services/feesComponent.service.js";
import { handleError } from "@/utils/index.js";

export const getFeesComponentsHandler = async (req: Request, res: Response) => {
  try {
    const feesComponents = await getFeesComponents();
    if (feesComponents === null) {
      handleError(new Error("Error fetching fees components"), res);
      return;
    }
    res.status(200).json(feesComponents);
  } catch (error) {
    handleError(error, res);
  }
};

export const getFeesComponentByIdHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const id = parseInt(req.params.id);
    const feesComponent = await getFeesComponentById(id);
    if (feesComponent === null) {
      handleError(new Error("Error fetching fees component"), res);
      return;
    }
    if (!feesComponent) {
      res.status(404).json({ message: "Fees component not found" });
      return;
    }
    res.status(200).json(feesComponent);
  } catch (error) {
    handleError(error, res);
  }
};

export const createFeesComponentHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const newFeesComponent = await createFeesComponent(req.body);
    if (newFeesComponent === null) {
      handleError(new Error("Error creating fees component"), res);
      return;
    }
    res.status(201).json(newFeesComponent);
  } catch (error) {
    handleError(error, res);
  }
};

export const updateFeesComponentHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const id = parseInt(req.params.id);
    const updatedFeesComponent = await updateFeesComponent(id, req.body);
    if (updatedFeesComponent === null) {
      handleError(new Error("Error updating fees component"), res);
      return;
    }
    if (!updatedFeesComponent) {
      res.status(404).json({ message: "Fees component not found" });
      return;
    }
    res.status(200).json(updatedFeesComponent);
  } catch (error) {
    handleError(error, res);
  }
};

export const deleteFeesComponentHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const id = parseInt(req.params.id);
    const deletedFeesComponent = await deleteFeesComponent(id);
    if (deletedFeesComponent === null) {
      handleError(new Error("Error deleting fees component"), res);
      return;
    }
    if (!deletedFeesComponent) {
      res.status(404).json({ message: "Fees component not found" });
      return;
    }
    res.status(200).json(deletedFeesComponent);
  } catch (error) {
    handleError(error, res);
  }
};
