import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { ApiError } from "@/utils/ApiError.js";
import {
  Transport,
  transportTypeEnum,
} from "@/features/resources/models/transport.model.js";
import {
  findAllTransports,
  findTransportById,
  createTransport as createTransportService,
  updateTransport as updateTransportService,
  deleteTransport as deleteTransportService,
  findTransportsByMode,
  findTransportByVehicleNumber,
} from "@/features/resources/services/transport.service.js";

// Create a new transport
export const createNewTransport = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { routeName, mode, vehicleNumber, driverName, providerDetails } =
      req.body;

    // Basic validation
    if (!mode || !transportTypeEnum.enumValues.includes(mode)) {
      res
        .status(400)
        .json(
          new ApiError(
            400,
            "Valid mode is required (BUS, TRAIN, METRO, AUTO, TAXI, CYCLE, WALKING, OTHER)",
          ),
        );
      return;
    }

    // Check if vehicle number already exists (if provided)
    if (vehicleNumber) {
      const existingVehicle = await findTransportByVehicleNumber(vehicleNumber);
      if (existingVehicle) {
        res
          .status(409)
          .json(new ApiError(409, "Vehicle number already exists"));
        return;
      }
    }

    const transportData = {
      routeName: routeName || null,
      mode: mode as
        | "BUS"
        | "TRAIN"
        | "METRO"
        | "AUTO"
        | "TAXI"
        | "CYCLE"
        | "WALKING"
        | "OTHER",
      vehicleNumber: vehicleNumber || null,
      driverName: driverName || null,
      providerDetails: providerDetails || null,
    };

    const newTransport = await createTransportService(transportData);

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          newTransport,
          "Transport created successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get all transports
export const getAllTransport = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const transports = await findAllTransports();

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          transports,
          "All transports fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get transports by mode
export const getTransportsByMode = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { mode } = req.params;

    if (!mode || !transportTypeEnum.enumValues.includes(mode as any)) {
      res
        .status(400)
        .json(
          new ApiError(
            400,
            "Valid mode is required (BUS, TRAIN, METRO, AUTO, TAXI, CYCLE, WALKING, OTHER)",
          ),
        );
      return;
    }

    const transports = await findTransportsByMode(
      mode as
        | "BUS"
        | "TRAIN"
        | "METRO"
        | "AUTO"
        | "TAXI"
        | "CYCLE"
        | "WALKING"
        | "OTHER",
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          transports,
          "Transports fetched successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get transport by ID
export const getTransportById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      res.status(400).json(new ApiError(400, "Valid ID is required"));
      return;
    }

    const transport = await findTransportById(Number(id));

    if (!transport) {
      res.status(404).json(new ApiError(404, "Transport not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          transport,
          "Transport fetched successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Update transport
export const updateTransport = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { routeName, mode, vehicleNumber, driverName, providerDetails } =
      req.body;

    if (!id || isNaN(Number(id))) {
      res.status(400).json(new ApiError(400, "Valid ID is required"));
      return;
    }

    // Check if transport exists
    const existingTransport = await findTransportById(Number(id));
    if (!existingTransport) {
      res.status(404).json(new ApiError(404, "Transport not found"));
      return;
    }

    // Validate mode if provided
    if (mode && !transportTypeEnum.enumValues.includes(mode)) {
      res
        .status(400)
        .json(
          new ApiError(
            400,
            "Valid mode is required (BUS, TRAIN, METRO, AUTO, TAXI, CYCLE, WALKING, OTHER)",
          ),
        );
      return;
    }

    // If vehicle number is being updated, check for duplicates
    if (vehicleNumber && vehicleNumber !== existingTransport.vehicleNumber) {
      const duplicateVehicle =
        await findTransportByVehicleNumber(vehicleNumber);
      if (duplicateVehicle) {
        res
          .status(409)
          .json(new ApiError(409, "Vehicle number already exists"));
        return;
      }
    }

    const updateData: Partial<
      Omit<Transport, "id" | "createdAt" | "updatedAt">
    > = {};

    if (routeName !== undefined) updateData.routeName = routeName;
    if (mode !== undefined)
      updateData.mode = mode as
        | "BUS"
        | "TRAIN"
        | "METRO"
        | "AUTO"
        | "TAXI"
        | "CYCLE"
        | "WALKING"
        | "OTHER";
    if (vehicleNumber !== undefined) updateData.vehicleNumber = vehicleNumber;
    if (driverName !== undefined) updateData.driverName = driverName;
    if (providerDetails !== undefined)
      updateData.providerDetails = providerDetails;

    const updatedTransport = await updateTransportService(
      Number(id),
      updateData,
    );

    if (!updatedTransport) {
      res.status(404).json(new ApiError(404, "Transport not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updatedTransport,
          "Transport updated successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Delete transport
export const deleteTransport = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      res.status(400).json(new ApiError(400, "Valid ID is required"));
      return;
    }

    // Check if transport exists
    const existingTransport = await findTransportById(Number(id));
    if (!existingTransport) {
      res.status(404).json(new ApiError(404, "Transport not found"));
      return;
    }

    const deletedTransport = await deleteTransportService(Number(id));

    if (!deletedTransport) {
      res.status(404).json(new ApiError(404, "Transport not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          deletedTransport,
          "Transport deleted successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
