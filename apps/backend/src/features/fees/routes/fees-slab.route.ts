import { Router } from 'express';
import {
  getAllFeesSlabs,
  getFeesSlabById,
  createFeesSlab,
  updateFeesSlab,
  deleteFeesSlab,
  checkSlabsExistForAcademicYear
} from '../controllers/fees-slab.controller';

const router = Router();

// Add the check-exist route
router.get('/check-exist/:academicYearId', async (req, res) => {
  try {
    const academicYearId = parseInt(req.params.academicYearId);
    if (isNaN(academicYearId)) {
      res.status(400).json({ message: "Invalid academic year ID" });
      return;
    }
    const result = await checkSlabsExistForAcademicYear(academicYearId);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Error checking slabs existence" });
  }
});

router.get('/', getAllFeesSlabs);
router.get('/:id', getFeesSlabById);
router.post('/', createFeesSlab);
router.put('/:id', updateFeesSlab);
router.delete('/:id', deleteFeesSlab);

export default router;
