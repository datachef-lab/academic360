import { db } from "@/db";
import {
  academicYearModel,
  promotionModel,
  sessionModel,
  studentModel,
} from "@repo/db/schemas";
import { eq } from "drizzle-orm";

export async function defaultSetDateOfJoining() {
  const promotions = await db
    .select()
    .from(promotionModel)
    .leftJoin(studentModel, eq(promotionModel.studentId, studentModel.id))
    .leftJoin(sessionModel, eq(promotionModel.sessionId, sessionModel.id))
    .leftJoin(
      academicYearModel,
      eq(sessionModel.academicYearId, academicYearModel.id),
    );

  for (const promotion of promotions) {
    // console.log("processing promotion doj, for uid: ", promotion.students?.uid);
    const studentId = promotion.promotions.studentId;
    const dateOfJoining = promotion.promotions.dateOfJoining;
    if (dateOfJoining) {
      await db
        .update(studentModel)
        .set({
          dateOfJoining: dateOfJoining,
        })
        .where(eq(studentModel.id, studentId));
      if (promotion.academic_years?.year == "2025-26") {
        await db
          .update(promotionModel)
          .set({
            startDate: dateOfJoining,
          })
          .where(eq(promotionModel.id, promotion.promotions.id));
      }
    } else {
      console.log(`No date of joining found for student ${studentId}`);
    }
  }
}
