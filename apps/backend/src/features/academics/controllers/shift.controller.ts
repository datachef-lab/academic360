import { Request, Response } from 'express';
import * as shiftService from '../services/shift.service';

export const getAllShifts = async (req: Request, res: Response) => {
  const shifts = await shiftService.getAllShifts();
  res.json(shifts);
};

export const getShiftById = async (req: Request, res: Response) => {
  const shift = await shiftService.getShiftById(Number(req.params.id));
  if (!shift) {res.status(404).json({ message: 'Shift not found' }); return };
  res.json(shift);
};

export const createShift = async (req: Request, res: Response) => {
  const newShift = await shiftService.createShift(req.body);
  res.status(201).json(newShift);
};

export const updateShift = async (req: Request, res: Response) => {
  const updated = await shiftService.updateShift(Number(req.params.id), req.body);
  if (!updated) {res.status(404).json({ message: 'Shift not found' });
  return 
}
  res.json(updated);
};

export const deleteShift = async (req: Request, res: Response) => {
  const deleted = await shiftService.deleteShift(Number(req.params.id));
  if (!deleted) {res.status(404).json({ message: 'Shift not found' });
  return ;
}
  res.status(204).send();
};
