import { db } from "@/db/index.js";
import { academicIdentifierModel } from "@/features/user/models/academicIdentifier.model.js";
import { streamModel } from "@/features/academics/models/stream.model.js";
import { studentModel } from "@/features/user/models/student.model.js";
import { degreeModel } from "@/features/resources/models/degree.model.js";
import { marksheetModel } from "@/features/academics/models/marksheet.model.js";
import { count, eq, sql, and, countDistinct } from "drizzle-orm";

export const getStudentStats = async () => {
  try {
    // Get total students count regardless of status
    const [totalStudentsResult] = await db
      .select({ count: count() })
      .from(studentModel);

    const totalStudents = totalStudentsResult?.count || 0;

    // First, get all distinct degree names to see what's actually in the database
    const allDegrees = await db
      .select({ name: degreeModel.name })
      .from(degreeModel);
    
    console.log("All degrees in database:", allDegrees.map(d => d.name));

    // Query for each degree type - using left joins to include all records
    const degreeStudentCounts = await db
      .select({
        degreeName: degreeModel.name,
        studentCount: count(),
      })
      .from(studentModel)
      .leftJoin(academicIdentifierModel, eq(academicIdentifierModel.studentId, studentModel.id))
      .leftJoin(streamModel, eq(academicIdentifierModel.streamId, streamModel.id))
      .leftJoin(degreeModel, eq(streamModel.degreeId, degreeModel.id))
      .groupBy(degreeModel.name);

    console.log("Student counts by degree:", degreeStudentCounts);

    // Get years data for each degree
    const yearsByDegree = await db
      .select({
        degreeName: degreeModel.name,
        year: marksheetModel.year,
        studentCount: countDistinct(studentModel.id),
      })
      .from(marksheetModel)
      .leftJoin(studentModel, eq(marksheetModel.studentId, studentModel.id))
      .leftJoin(academicIdentifierModel, eq(academicIdentifierModel.studentId, studentModel.id))
      .leftJoin(streamModel, eq(academicIdentifierModel.streamId, streamModel.id))
      .leftJoin(degreeModel, eq(streamModel.degreeId, degreeModel.id))
      .where(sql`${marksheetModel.year} IS NOT NULL`)
      .groupBy(degreeModel.name, marksheetModel.year)
      .orderBy(degreeModel.name, marksheetModel.year);

    console.log("Years by degree:", yearsByDegree);

    // Convert to a map for easier frontend consumption
    const stats = {
      totalStudents,
      courseStats: {} as Record<string, { count: number, years: Record<number, number> }>,
    };

    // Format the response with specific degrees
    const degreeCounts: Record<string, { count: number, years: Record<number, number> }> = {};
    degreeStudentCounts.forEach((item) => {
      if (item.degreeName) {
        // Normalize degree names (uppercase and remove periods)
        const normalizedName = item.degreeName.toUpperCase().replace(/\./g, '');
        if (!degreeCounts[normalizedName]) {
          degreeCounts[normalizedName] = { count: 0, years: {} };
        }
        degreeCounts[normalizedName].count += Number(item.studentCount);
        
        // Also keep the original name mapping
        if (!degreeCounts[item.degreeName]) {
          degreeCounts[item.degreeName] = { count: 0, years: {} };
        }
        degreeCounts[item.degreeName].count = Number(item.studentCount);
      }
    });

    // Add year data to each degree
    yearsByDegree.forEach((item) => {
      if (item.degreeName && item.year) {
        // Normalize degree name
        const normalizedName = item.degreeName.toUpperCase().replace(/\./g, '');
        
        if (degreeCounts[normalizedName]) {
          degreeCounts[normalizedName].years[item.year] = Number(item.studentCount);
        }
        
        if (degreeCounts[item.degreeName]) {
          degreeCounts[item.degreeName].years[item.year] = Number(item.studentCount);
        }
      }
    });

    console.log("Normalized degree counts:", degreeCounts);

    // Check for common variations of degree names
    const degreeVariations = {
      "BA": ["BA", "B.A", "B.A.", "BACHELOR OF ARTS"],
      "BCOM": ["BCOM", "B.COM", "B.COM.", "BACHELOR OF COMMERCE"],
      "BSC": ["BSC", "B.SC", "B.SC.", "BACHELOR OF SCIENCE"],
      "BBA": ["BBA", "B.B.A", "B.B.A.", "BACHELOR OF BUSINESS ADMINISTRATION"],
      "MA": ["MA", "M.A", "M.A.", "MASTER OF ARTS"],
      "MCOM": ["MCOM", "M.COM", "M.COM.", "MASTER OF COMMERCE"]
    };

    // Set the desired course stats with real values or 0 if not found
    stats.courseStats = {
      "BA": { count: 0, years: {} },
      "B.COM": { count: 0, years: {} },
      "B.SC": { count: 0, years: {} },
      "BBA": { count: 0, years: {} },
      "M.A": { count: 0, years: {} },
      "M.COM": { count: 0, years: {} },
    };

    // Check all variations for each degree
    for (const [displayName, variations] of Object.entries(degreeVariations)) {
      for (const variation of variations) {
        if (degreeCounts[variation]) {
          const outputKey = displayName === "BA" ? "BA" : 
                           displayName === "BCOM" ? "B.COM" :
                           displayName === "BSC" ? "B.SC" :
                           displayName === "BBA" ? "BBA" :
                           displayName === "MA" ? "M.A" :
                           "M.COM";
                           
          stats.courseStats[outputKey].count += degreeCounts[variation].count;
          
          // Merge years data
          for (const [year, count] of Object.entries(degreeCounts[variation].years)) {
            const yearKey = Number(year);
            stats.courseStats[outputKey].years[yearKey] = (stats.courseStats[outputKey].years[yearKey] || 0) + Number(count);
          }
          
          break; // Use the first match we find
        }
      }
    }

    console.log("Final stats:", stats);
    return stats;
  } catch (error) {
    console.error("Error fetching student statistics:", error);
    throw error;
  }
};

export const getSemesterStats = async () => {
  try {
    // Get a direct count of students per semester and year from marksheets
    const semesterData = await db
      .select({
        semester: marksheetModel.semester,
        year: marksheetModel.year,
        studentCount: countDistinct(marksheetModel.studentId),
      })
      .from(marksheetModel)
      .groupBy(marksheetModel.semester, marksheetModel.year)
      .orderBy(marksheetModel.semester);

    console.log("Semester data:", semesterData);

    // Get a more accurate count of students by degree
    const degreeData = await db
      .select({
        degreeName: degreeModel.name,
        degreeId: degreeModel.id,
        studentCount: countDistinct(studentModel.id),
      })
      .from(degreeModel)
      .leftJoin(streamModel, eq(streamModel.degreeId, degreeModel.id))
      .leftJoin(academicIdentifierModel, eq(academicIdentifierModel.streamId, streamModel.id))
      .leftJoin(studentModel, eq(studentModel.id, academicIdentifierModel.studentId))
      .leftJoin(marksheetModel, eq(marksheetModel.studentId, studentModel.id))
      .where(sql`${marksheetModel.id} IS NOT NULL`)
      .groupBy(degreeModel.name, degreeModel.id);

    console.log("Degree data:", degreeData);

    // Organize the results by degree
    interface DegreeInfo {
      id: number;
      name: string;
      totalStudents: number;
      maxSemesters: number;
      semesters: Record<number, { count: number, year?: number }>;
    }

    // Calculate max semester
    const maxSemester = semesterData.length > 0 
      ? Math.max(...semesterData.map(s => s.semester || 0)) 
      : 6;

    // Construct the result
    const degrees: DegreeInfo[] = degreeData
      .filter(d => d.degreeName && d.degreeId)
      .map(degree => ({
        id: degree.degreeId,
        name: degree.degreeName || "Unknown",
        totalStudents: Number(degree.studentCount) || 0,
        maxSemesters: maxSemester,
        semesters: {}
      }));

    // Initialize all semesters with 0
    degrees.forEach(degree => {
      for (let i = 1; i <= maxSemester; i++) {
        degree.semesters[i] = { count: 0 };
      }
    });

    // If we have no degrees yet, create at least one based on direct semester data
    if (degrees.length === 0 && semesterData.length > 0) {
      // Get total distinct student count across all semesters
      const [totalResult] = await db
        .select({
          totalCount: countDistinct(marksheetModel.studentId)
        })
        .from(marksheetModel);

      const defaultDegree: DegreeInfo = {
        id: 1,
        name: "All Programs",
        totalStudents: Number(totalResult?.totalCount || 0),
        maxSemesters: maxSemester,
        semesters: {}
      };
      
      // Initialize semesters
      for (let i = 1; i <= maxSemester; i++) {
        defaultDegree.semesters[i] = { count: 0 };
      }
      
      degrees.push(defaultDegree);
    }

    // Get detailed semester counts per degree where possible
    try {
      const semestersByDegree = await db
        .select({
          degreeName: degreeModel.name,
          semester: marksheetModel.semester,
          year: marksheetModel.year,
          studentCount: countDistinct(marksheetModel.studentId),
        })
        .from(marksheetModel)
        .leftJoin(studentModel, eq(marksheetModel.studentId, studentModel.id))
        .leftJoin(academicIdentifierModel, eq(academicIdentifierModel.studentId, studentModel.id))
        .leftJoin(streamModel, eq(academicIdentifierModel.streamId, streamModel.id))
        .leftJoin(degreeModel, eq(streamModel.degreeId, degreeModel.id))
        .groupBy(degreeModel.name, marksheetModel.semester, marksheetModel.year)
        .orderBy(degreeModel.name, marksheetModel.semester);

      console.log("Semesters by degree:", semestersByDegree);

      // Update the semester counts where we have degree information
      semestersByDegree.forEach(stat => {
        if (stat.degreeName && stat.semester) {
          const degree = degrees.find(d => d.name === stat.degreeName);
          if (degree) {
            degree.semesters[stat.semester] = { 
              count: Number(stat.studentCount),
              year: stat.year 
            };
          }
        }
      });

      // Recalculate total students based on distinct student count across all semesters
      for (const degree of degrees) {
        // For each degree, get the actual total count of distinct students across all semesters
        const [totalResult] = await db
          .select({
            totalCount: countDistinct(marksheetModel.studentId)
          })
          .from(marksheetModel)
          .leftJoin(studentModel, eq(marksheetModel.studentId, studentModel.id))
          .leftJoin(academicIdentifierModel, eq(academicIdentifierModel.studentId, studentModel.id))
          .leftJoin(streamModel, eq(academicIdentifierModel.streamId, streamModel.id))
          .leftJoin(degreeModel, eq(streamModel.degreeId, degreeModel.id))
          .where(eq(degreeModel.name, degree.name));
        
        if (totalResult?.totalCount) {
          degree.totalStudents = Number(totalResult.totalCount);
        }
      }
    } catch (err) {
      console.error("Error getting detailed semester counts:", err);
    }

    // If we have only a generic "All Programs" degree, distribute the semester data
    if (degrees.length === 1 && degrees[0].name === "All Programs") {
      semesterData.forEach(stat => {
        if (stat.semester) {
          degrees[0].semesters[stat.semester] = { 
            count: Number(stat.studentCount),
            year: stat.year
          };
        }
      });
    }

    const result = { degrees };
    console.log("Final semester stats:", result);
    return result;
  } catch (error) {
    console.error("Error fetching semester statistics:", error);
    throw error;
  }
}; 