import { Router } from 'express';
import { verifyJWT } from '@/middlewares/verifyJWT.js';
import {
  getAvailableAffiliationsHandler,
  getAcademicYearsByAffiliationHandler,
  getRegulationTypesByAffiliationAndAcademicYearHandler,
  getSubjectsByAffiliationAcademicYearAndRegulationHandler,
} from '../controllers/cascading-dropdowns.controller.js';

const router = Router();

// Apply JWT middleware
router.use(verifyJWT);

// Get available affiliations
router.get('/affiliations', getAvailableAffiliationsHandler);

// Get academic years by affiliation
router.get('/academic-years/:affiliationId', getAcademicYearsByAffiliationHandler);

// Get regulation types by affiliation and academic year
router.get('/regulation-types/:affiliationId/:academicYearId', getRegulationTypesByAffiliationAndAcademicYearHandler);

// Get subjects by affiliation, academic year, and regulation type
router.get('/subjects/:affiliationId/:academicYearId/:regulationTypeId', getSubjectsByAffiliationAcademicYearAndRegulationHandler);

export default router; 