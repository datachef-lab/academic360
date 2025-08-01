import { verifyJWT } from '@/middlewares';
import express from 'express';
import { createSessionHandler, getAllSessionsHandler } from '../controllers/session.controller';

const router = express.Router();

// Apply JWT verification middleware to all routes
router.use(verifyJWT);

router.get('/', getAllSessionsHandler);
router.post('/', createSessionHandler);


export default router;
