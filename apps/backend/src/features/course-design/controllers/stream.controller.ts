import { Request, Response } from "express";
import {
  createStream as createStreamService,
  getAllStreams as getAllStreamsService,
  getStreamById as getStreamByIdService,
  updateStream as updateStreamService,
  deleteStream as deleteStreamService,
} from "../services/stream.service";

export const createStream = async (req: Request, res: Response) => {
  try {
    const newStream = await createStreamService(req.body);
    res.status(201).json(newStream);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllStreams = async (_req: Request, res: Response) => {
  try {
    const allStreams = await getAllStreamsService();
    res.json(allStreams);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getStreamById = async (req: Request, res: Response) => {
  try {
    const stream = await getStreamByIdService(req.params.id);
    if (!stream) {
      return res.status(404).json({ error: "Stream not found" });
    }
    res.json(stream);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateStream = async (req: Request, res: Response) => {
  try {
    const updatedStream = await updateStreamService(req.params.id, req.body);
    if (!updatedStream) {
      return res.status(404).json({ error: "Stream not found" });
    }
    res.json(updatedStream);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteStream = async (req: Request, res: Response) => {
  try {
    const deletedStream = await deleteStreamService(req.params.id);
    if (!deletedStream) {
      return res.status(404).json({ error: "Stream not found" });
    }
    res.json({ message: "Stream deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
