import { Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import {
  createRoom as createRoomService,
  deleteRoomSafe as deleteRoomSafeService,
  findRoomById,
  getAllRooms as getAllRoomsService,
  updateRoom as updateRoomService,
} from "../services/room.service.js";

export const createRoom = async (req: Request, res: Response) => {
  try {
    const created = await createRoomService(req.body);
    res
      .status(201)
      .json(
        new ApiResponse(201, "SUCCESS", created, "Room created successfully."),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json(new ApiResponse(400, "ERROR", null, message));
  }
};

export const getAllRooms = async (_req: Request, res: Response) => {
  try {
    const rooms = await getAllRoomsService();
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", rooms, "Rooms fetched."));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json(new ApiResponse(500, "ERROR", null, message));
  }
};

export const getRoomById = async (req: Request, res: Response) => {
  try {
    const room = await findRoomById(Number(req.params.id));
    if (!room) {
      return res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "Room not found."));
    }
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", room, "Room fetched successfully."),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json(new ApiResponse(500, "ERROR", null, message));
  }
};

export const updateRoom = async (req: Request, res: Response) => {
  try {
    const updated = await updateRoomService(Number(req.params.id), req.body);
    if (!updated) {
      return res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "Room not found."));
    }
    res
      .status(200)
      .json(
        new ApiResponse(200, "UPDATED", updated, "Room updated successfully."),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json(new ApiResponse(400, "ERROR", null, message));
  }
};

export const deleteRoom = async (req: Request, res: Response) => {
  try {
    const result = await deleteRoomSafeService(Number(req.params.id));

    if (result === null) {
      return res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "Room not found."));
    }

    if (result.success === false) {
      return res
        .status(400)
        .json(new ApiResponse(400, "ERROR", result.records, result.message));
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, "DELETED", null, result.message ?? "Deleted."),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json(new ApiResponse(500, "ERROR", null, message));
  }
};
