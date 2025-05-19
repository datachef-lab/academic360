import { Request, Response } from "express";
import { getStudentStats, getSemesterStats } from "@/features/user/services/stats.service.js";

export const getStats = async (req: Request, res: Response) => {
  try {
    const stats = await getStudentStats();
    
    res.status(200).json({
      success: true,
      message: "Student statistics retrieved successfully",
      payload: stats,
    });
  } catch (error) {
    console.error("Error in getStats controller:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve student statistics",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

export const getSemesterStatistics = async (req: Request, res: Response) => {
  try {
    const stats = await getSemesterStats();
    
    res.status(200).json({
      success: true,
      message: "Semester-wise student statistics retrieved successfully",
      payload: stats,
    });
  } catch (error) {
    console.error("Error in getSemesterStatistics controller:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve semester-wise student statistics",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}; 