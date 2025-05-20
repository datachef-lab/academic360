import { Request, Response } from "express";
import { getStudentStats, getSemesterStats, getEnrollmentAnalytics, getPassingPercentage } from "@/features/user/services/stats.service.js";
import { ApiResponse } from "@/utils/ApiResonse.js";

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

export const getEnrollmentAnalyticsData = async (req: Request, res: Response) => {
  try {
    const analytics = await getEnrollmentAnalytics();
    
    res.status(200).json(new ApiResponse(
      200, 
      "SUCCESS", 
      analytics, 
      "Enrollment analytics data retrieved successfully"
    ));
  } catch (error) {
    console.error("Error in getEnrollmentAnalyticsData controller:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve enrollment analytics data",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

export const getPassingPercentageStats = async (req: Request, res: Response) => {
  try {
    const passingStats = await getPassingPercentage();
    
    res.status(200).json(new ApiResponse(
      200, 
      "SUCCESS", 
      passingStats, 
      "Passing percentage statistics retrieved successfully"
    ));
  } catch (error) {
    console.error("Error in getPassingPercentageStats controller:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve passing percentage statistics",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}; 