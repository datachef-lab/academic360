import { Request, Response } from 'express';
import { 
  getAcademicYearsByAffiliation, 
  getRegulationTypesByAffiliationAndAcademicYear, 
  getSubjectsByAffiliationAcademicYearAndRegulation,
  getAvailableAffiliations 
} from '../services/cascading-dropdowns.service.js';

// Get available affiliations
export const getAvailableAffiliationsHandler = async (req: Request, res: Response) => {
  try {
    const affiliations = await getAvailableAffiliations();
    res.json({
      success: true,
      data: affiliations,
    });
  } catch (error) {
    console.error('Error in getAvailableAffiliationsHandler:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available affiliations',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get academic years by affiliation
export const getAcademicYearsByAffiliationHandler = async (req: Request, res: Response) => {
  try {
    const { affiliationId } = req.params;
    
    if (!affiliationId) {
      res.status(400).json({
        success: false,
        message: 'Affiliation ID is required',
      });
      return 
    }

    const academicYears = await getAcademicYearsByAffiliation(Number(affiliationId));
    res.json({
      success: true,
      data: academicYears,
    });
  } catch (error) {
    console.error('Error in getAcademicYearsByAffiliationHandler:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch academic years',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get regulation types by affiliation and academic year
export const getRegulationTypesByAffiliationAndAcademicYearHandler = async (req: Request, res: Response) => {
  try {
    const { affiliationId, academicYearId } = req.params;
    
    if (!affiliationId || !academicYearId) {
      res.status(400).json({
        success: false,
        message: 'Affiliation ID and Academic Year ID are required',
      });
      return 
    }

    const regulationTypes = await getRegulationTypesByAffiliationAndAcademicYear(
      Number(affiliationId), 
      Number(academicYearId)
    );
    res.json({
      success: true,
      data: regulationTypes,
    });
  } catch (error) {
    console.error('Error in getRegulationTypesByAffiliationAndAcademicYearHandler:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch regulation types',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get subjects by affiliation, academic year, and regulation type
export const getSubjectsByAffiliationAcademicYearAndRegulationHandler = async (req: Request, res: Response) => {
  try {
    const { affiliationId, academicYearId, regulationTypeId } = req.params;
    
    if (!affiliationId || !academicYearId || !regulationTypeId) {
      res.status(400).json({
        success: false,
        message: 'Affiliation ID, Academic Year ID, and Regulation Type ID are required',
      });
      return 
    }

    const subjects = await getSubjectsByAffiliationAcademicYearAndRegulation(
      Number(affiliationId), 
      Number(academicYearId), 
      Number(regulationTypeId)
    );
    res.json({
      success: true,
      data: subjects,
    });
  } catch (error) {
    console.error('Error in getSubjectsByAffiliationAcademicYearAndRegulationHandler:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subjects',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}; 