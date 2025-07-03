import { Request, Response, NextFunction } from "express";
import { ApiResponse, handleError } from "@/utils/index.js";
import * as studyMaterialService from "../services/study-material.service.js";
import type { RequestHandler } from "express";

export const createStudyMaterial: RequestHandler = async (req, res, next) => {
  try {
    const material = await studyMaterialService.createStudyMaterial(req.body);
    res.status(201).json(new ApiResponse(201, "SUCCESS", material, "Study material created successfully"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAllStudyMaterials: RequestHandler = async (req, res, next) => {
  try {
    const materials = await studyMaterialService.getAllStudyMaterials();
    res.status(200).json(new ApiResponse(200, "SUCCESS", materials, "Study materials fetched successfully"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getStudyMaterialById: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const material = await studyMaterialService.getStudyMaterialById(id);
    if (!material) {
      res.status(404).json(new ApiResponse(404, "FAIL", null, "Study material not found"));
      return;
    }
    res.status(200).json(new ApiResponse(200, "SUCCESS", material, "Study material fetched successfully"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateStudyMaterial: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const material = await studyMaterialService.updateStudyMaterial(id, req.body);
    if (!material) {
      res.status(404).json(new ApiResponse(404, "FAIL", null, "Study material not found"));
      return;
    }
    res.status(200).json(new ApiResponse(200, "SUCCESS", material, "Study material updated successfully"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteStudyMaterial: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const deleted = await studyMaterialService.deleteStudyMaterial(id);
    if (!deleted) {
      res.status(404).json(new ApiResponse(404, "FAIL", null, "Study material not found"));
      return;
    }
    res.status(200).json(new ApiResponse(200, "SUCCESS", null, "Study material deleted successfully"));
  } catch (error) {
    handleError(error, res, next);
  }
};
