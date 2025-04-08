import { Request, Response } from "express";
import { scanDocumentsByRollNo } from "../services/documentScanner";

export const scanDocumentsController = async (req: Request, res: Response) => {
  try {
    const { rollNo } = req.params;
    
    if (!rollNo || typeof rollNo !== 'string') {
      return res.status(400).json({ 
        error: 'Valid roll number is required',
        details: 'Roll number must be a non-empty string'
      });
    }

    // Validate roll number format if needed
    if (!/^[A-Za-z0-9]+$/.test(rollNo)) {
      return res.status(400).json({
        error: 'Invalid roll number format',
        details: 'Roll number should contain only alphanumeric characters'
      });
    }

    const documents = await scanDocumentsByRollNo(rollNo);
    
    if (documents.length === 0) {
      return res.status(404).json({
        message: 'No documents found for the given roll number',
        rollNo
      });
    }

    res.json({
      success: true,
      count: documents.length,
      documents
    });
  } catch (error) {
    console.error('Error in document scanning route:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('DOCUMENT_BASE_PATH')) {
        return res.status(500).json({
          error: 'Configuration error',
          details: error.message
        });
      }
      if (error.message.includes('directory does not exist')) {
        return res.status(500).json({
          error: 'Document directory not found',
          details: error.message
        });
      }
    }
    
    res.status(500).json({
      error: 'Internal server error',
      details: 'Failed to scan documents'
    });
  }
}; 