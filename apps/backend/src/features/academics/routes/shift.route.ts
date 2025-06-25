import { Router } from 'express';
import * as shiftController from '../controllers/shift.controller';

const router = Router();

router.get('/', shiftController.getAllShifts);
router.get('/:id', shiftController.getShiftById);
router.post('/', shiftController.createShift);
router.put('/:id', shiftController.updateShift);
router.delete('/:id', shiftController.deleteShift);

export default router; 