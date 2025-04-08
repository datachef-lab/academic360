import { Router } from 'express';
import documentScannerRouter from './documentScanner';

const router = Router();

// Register all document-related routes
router.use('/scanner', documentScannerRouter);

export default router; 