import express, { RequestHandler } from "express";
import { verifyJWT } from '@/middlewares/verifyJWT';
import { scanDocumentsController } from '../controllers/documentScanner.controller';

const router = express.Router();

// Apply JWT verification middleware
router.use(verifyJWT);

router.get('/scan/:rollNo', scanDocumentsController as RequestHandler);

export default router; 