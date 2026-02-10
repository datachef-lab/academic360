import { db } from "@/db";
import { UserStatusMappingDto, UserStatusMasterDto } from "@repo/db/dtos";
import {
  academicYearModel,
  promotionModel,
  sessionModel,
  studentModel,
  StudentT,
  userModel,
  userStatusMappingModel,
  userStatusMasterDomainModel,
  userStatusMasterFrequencyModel,
  userStatusMasterFrequencyTypeEnum,
  userStatusMasterLevelModel,
  userStatusMasterModel,
  UserT,
} from "@repo/db/schemas";
import { and, count, eq, ilike, ne, desc } from "drizzle-orm";
import { classModel } from "@repo/db/schemas/models/academics";
import { programCourseModel } from "@repo/db/schemas/models/course-design";
import { defaultUserStatusesMastersDtos } from "../default-user-statuses-data";

export async function loadDefaultUserStatusMaster() {
  for (let i = 0; i < defaultUserStatusesMastersDtos.length; i++) {
    const { levels, frequencies, domains, ...rest } =
      defaultUserStatusesMastersDtos[i];

    let [foundUserStatusMaster] = await db
      .select()
      .from(userStatusMasterModel)
      .where(ilike(userStatusMasterModel.tag, rest.tag));

    if (!foundUserStatusMaster) {
      [foundUserStatusMaster] = await db
        .insert(userStatusMasterModel)
        .values(rest)
        .returning();
    }

    for (let j = 0; j < levels.length; j++) {
      const [foundLevel] = await db
        .select()
        .from(userStatusMasterLevelModel)
        .where(
          and(
            eq(
              userStatusMasterLevelModel.userStatusMasterId,
              foundUserStatusMaster.id,
            ),
            eq(userStatusMasterLevelModel.level, levels[j].level),
          ),
        );

      if (!foundLevel) {
        await db.insert(userStatusMasterLevelModel).values({
          ...levels[j],
          userStatusMasterId: foundUserStatusMaster.id!,
        });
      }
    }

    for (let j = 0; j < domains.length; j++) {
      const [foundDomain] = await db
        .select()
        .from(userStatusMasterDomainModel)
        .where(
          and(
            eq(
              userStatusMasterDomainModel.userStatusMasterId,
              foundUserStatusMaster.id,
            ),
            eq(userStatusMasterDomainModel.domain, domains[j].domain),
          ),
        );

      if (!foundDomain) {
        await db.insert(userStatusMasterDomainModel).values({
          ...domains[j],
          userStatusMasterId: foundUserStatusMaster.id!,
        });
      }
    }

    for (let j = 0; j < frequencies.length; j++) {
      const [foundFrequency] = await db
        .select()
        .from(userStatusMasterFrequencyModel)
        .where(
          and(
            eq(
              userStatusMasterFrequencyModel.userStatusMasterId,
              foundUserStatusMaster.id,
            ),
            eq(
              userStatusMasterFrequencyModel.frequency,
              frequencies[j].frequency,
            ),
          ),
        );

      if (!foundFrequency) {
        await db.insert(userStatusMasterFrequencyModel).values({
          ...frequencies[j],
          userStatusMasterId: foundUserStatusMaster.id!,
        });
      }
    }
  }
}

export async function mapUserStatuses() {
  const BATCH_SIZE = 500;
  const [{ totalCount }] = await db
    .select({ totalCount: count() })
    .from(studentModel);
  const batches = Math.ceil(totalCount / 500);

  const academicYears = await db.select().from(academicYearModel);

  const userStatusMasters = await db.select().from(userStatusMasterModel);

  const userStatusMasterDtos: UserStatusMasterDto[] = [];

  const [foundByUser] = await db
    .select()
    .from(userModel)
    .where(eq(userModel.email, "test@gmail.com"));

  if (!foundByUser) return;

  for (let i = 0; i < userStatusMasters.length; i++) {
    const levels = await db
      .select()
      .from(userStatusMasterLevelModel)
      .where(
        eq(
          userStatusMasterLevelModel.userStatusMasterId,
          userStatusMasters[i].id,
        ),
      );

    const domains = await db
      .select()
      .from(userStatusMasterDomainModel)
      .where(
        eq(
          userStatusMasterDomainModel.userStatusMasterId,
          userStatusMasters[i].id,
        ),
      );

    const frequencies = await db
      .select()
      .from(userStatusMasterFrequencyModel)
      .where(
        eq(
          userStatusMasterFrequencyModel.userStatusMasterId,
          userStatusMasters[i].id,
        ),
      );

    userStatusMasterDtos.push({
      ...userStatusMasters[i],
      levels,
      domains,
      frequencies,
    });
  }

  for (let i = 0; i < batches; i++) {
    const result = await db
      .select()
      .from(studentModel)
      .limit(BATCH_SIZE)
      .offset(i * BATCH_SIZE);

    for (let a = 0; a < academicYears.length; a++) {
      for (let j = 0; j < result.length; j++) {
        const [
          {
            academic_years: ay,
            promotions: promotion,
            sessions: session,
            students: student,
            users: user,
          },
        ] = await db
          .select()
          .from(studentModel)
          .leftJoin(userModel, eq(userModel.id, studentModel.userId))
          .leftJoin(
            promotionModel,
            eq(promotionModel.studentId, studentModel.id),
          )
          .leftJoin(sessionModel, eq(sessionModel.id, promotionModel.sessionId))
          .leftJoin(
            academicYearModel,
            eq(academicYearModel.id, sessionModel.academicYearId),
          )
          .where(eq(studentModel.id, result[j].id));

        const userStatusMaster = await getUserStatusMaster(
          user!,
          student,
          userStatusMasterDtos,
        );

        await createUserStatusMapping({
          byUserId: foundByUser.id!,
          sessionId: session!.id!,
          userId: user!.id!,
          userStatusMaster,
          promotionId: promotion!.id!,
          studentId: student.id,
          remarks:
            student.leavingReason ||
            student.cancelledAdmissionReason ||
            user?.suspendedReason,
          suspendedTillDate: user?.suspendedTillDate,
        });
      }
    }
  }
}

async function getUserStatusMaster(
  user: UserT,
  student: StudentT,
  userStatusMasterDtos: UserStatusMasterDto[],
): Promise<UserStatusMasterDto> {
  let tag: string = "Dropped Out";

  if (user?.isSuspended) tag = "Suspended";
  if (student?.hasCancelledAdmission) tag = "Cancelled Admission";
  if (student?.takenTransferCertificate)
    tag = "Taken Transfer Certificate (TC)";

  if (student?.alumni && !student?.active) tag = "Alumni";
  if (!student?.active && (student?.leavingDate || student?.leavingReason))
    tag = "Dropped Out";
  if (student?.active) tag = "Regular";

  const foundUserStatusMaster = userStatusMasterDtos.find(
    (ele) => ele.tag === tag,
  )!;

  return foundUserStatusMaster;
}

const FREQUENCY_ORDER = [
  "ALWAYS_NEW_ENTRY",
  "PER_ACADEMIC_YEAR",
  "PER_SEMESTER",
  "ONLY_ONCE",
  "REQUIRED",
  "OPTIONAL",
] as const;

type Frequency = (typeof FREQUENCY_ORDER)[number];

type Validator = (dto: UserStatusMappingDto) => Promise<boolean>;

const excludeCurrent = (dto: UserStatusMappingDto) =>
  dto.id ? ne(userStatusMappingModel.id, dto.id) : undefined;

const validators: Record<Frequency, Validator> = {
  /**
   * Absolute override
   */
  ALWAYS_NEW_ENTRY: async () => {
    return true;
  },

  /**
   * Only once per user + status master (only check active entries)
   */
  ONLY_ONCE: async (dto) => {
    const conditions = [
      eq(userStatusMappingModel.userId, dto.userId),
      eq(userStatusMappingModel.userStatusMasterId, dto.userStatusMaster.id!),
      eq(userStatusMappingModel.isActive, true),
    ];

    if (dto.id) {
      conditions.push(ne(userStatusMappingModel.id, dto.id));
    }

    const existing = await db
      .select({ id: userStatusMappingModel.id }) // ⚡ lighter query
      .from(userStatusMappingModel)
      .where(and(...conditions))
      .limit(1);

    return existing.length === 0;
  },

  /**
   * One entry per academic year (only check active entries)
   */
  PER_ACADEMIC_YEAR: async (dto) => {
    const [session] = await db
      .select({ academicYearId: sessionModel.academicYearId })
      .from(sessionModel)
      .where(eq(sessionModel.id, dto.sessionId));

    if (!session) {
      throw new Error("Invalid session id");
    }

    const conditions = [
      eq(userStatusMappingModel.userId, dto.userId),
      eq(sessionModel.academicYearId, session.academicYearId!),
      eq(userStatusMappingModel.userStatusMasterId, dto.userStatusMaster.id!),
      eq(userStatusMappingModel.isActive, true),
    ];

    if (dto.id) {
      conditions.push(ne(userStatusMappingModel.id, dto.id));
    }

    const existing = await db
      .select({ id: userStatusMappingModel.id })
      .from(userStatusMappingModel)
      .leftJoin(
        sessionModel,
        eq(sessionModel.id, userStatusMappingModel.sessionId),
      )
      .where(and(...conditions))
      .limit(1);

    return existing.length === 0;
  },

  /**
   * One entry per semester/class (only check active entries)
   */
  PER_SEMESTER: async (dto) => {
    if (!dto.promotionId) {
      throw new Error("PromotionId required for semester validation");
    }

    const [promotion] = await db
      .select({ classId: promotionModel.classId })
      .from(promotionModel)
      .where(eq(promotionModel.id, dto.promotionId));

    if (!promotion) {
      throw new Error("Invalid promotion id");
    }

    const conditions = [
      eq(userStatusMappingModel.userId, dto.userId),
      eq(promotionModel.classId, promotion.classId),
      eq(userStatusMappingModel.userStatusMasterId, dto.userStatusMaster.id!),
      eq(userStatusMappingModel.isActive, true),
    ];

    if (dto.id) {
      conditions.push(ne(userStatusMappingModel.id, dto.id));
    }

    const existing = await db
      .select({ id: userStatusMappingModel.id })
      .from(userStatusMappingModel)
      .leftJoin(
        promotionModel,
        eq(promotionModel.id, userStatusMappingModel.promotionId),
      )
      .where(and(...conditions))
      .limit(1);

    return existing.length === 0;
  },

  /**
   * REQUIRED → Example logic
   * (You can customize this based on business rules)
   */
  REQUIRED: async (dto) => {
    // Example check:
    if (!dto.sessionId) {
      throw new Error("Session is required");
    }

    return true;
  },

  /**
   * OPTIONAL → Always allowed
   */
  OPTIONAL: async () => true,
};

async function checkValidation(dto: UserStatusMappingDto) {
  const masterFrequencies = dto.userStatusMaster.frequencies.map(
    (f) => f.frequency as Frequency,
  );

  const sortedFrequencies = FREQUENCY_ORDER.filter((freq) =>
    masterFrequencies.includes(freq),
  );

  for (const freq of sortedFrequencies) {
    if (freq === "ALWAYS_NEW_ENTRY") continue;

    const isValid = await validators[freq](dto);

    if (!isValid) return false;
  }

  return true;
}

export async function createUserStatusMapping(givenDto: UserStatusMappingDto) {
  const isValid = await checkValidation(givenDto);

  if (!isValid) {
    return {
      data: null,
      message: "User status record already exist!",
      status: 409,
    };
  }

  // Additional validation: Only one Regular status per semester
  if (
    givenDto.userStatusMaster.tag.toLowerCase().includes("regular") &&
    givenDto.promotionId
  ) {
    const existingRegular = await db
      .select()
      .from(userStatusMappingModel)
      .leftJoin(
        userStatusMasterModel,
        eq(userStatusMappingModel.userStatusMasterId, userStatusMasterModel.id),
      )
      .where(
        and(
          eq(userStatusMappingModel.studentId, givenDto.studentId!),
          eq(userStatusMappingModel.promotionId, givenDto.promotionId),
          ilike(userStatusMasterModel.tag, "%regular%"),
          eq(userStatusMappingModel.isActive, true),
        ),
      );

    if (existingRegular.length > 0) {
      return {
        data: null,
        message:
          "A Regular status already exists for this semester. Only one Regular status is allowed per semester.",
        status: 409,
      };
    }
  }

  // Mutual exclusivity: Regular and Casual cannot coexist for the same semester
  const isRegular = givenDto.userStatusMaster.tag
    .toLowerCase()
    .includes("regular");
  const isCasual = givenDto.userStatusMaster.tag
    .toLowerCase()
    .includes("casual");

  if ((isRegular || isCasual) && givenDto.promotionId) {
    const conflictingTag = isRegular ? "%casual%" : "%regular%";
    const existingConflict = await db
      .select()
      .from(userStatusMappingModel)
      .leftJoin(
        userStatusMasterModel,
        eq(userStatusMappingModel.userStatusMasterId, userStatusMasterModel.id),
      )
      .where(
        and(
          eq(userStatusMappingModel.studentId, givenDto.studentId!),
          eq(userStatusMappingModel.promotionId, givenDto.promotionId),
          ilike(userStatusMasterModel.tag, conflictingTag),
          eq(userStatusMappingModel.isActive, true),
        ),
      );

    if (existingConflict.length > 0) {
      const currentTag = isRegular ? "Regular" : "Casual";
      const existingTag = isRegular ? "Casual" : "Regular";
      return {
        data: null,
        message: `Cannot add "${currentTag}" status. A "${existingTag}" status already exists for this semester. Only one of Regular or Casual is allowed per semester.`,
        status: 409,
      };
    }
  }

  const { userStatusMaster, id, createdAt, updatedAt, ...rest } = givenDto;

  const [newUserStatusMapping] = await db
    .insert(userStatusMappingModel)
    .values({
      ...rest,
      userStatusMasterId: userStatusMaster.id!,
      isActive: true, // Always active on creation
    })
    .returning();

  // Check if this is a terminal status (Alumni, TC, Cancelled Admission)
  const terminalTags = ["alumni", "transfer certificate", "tc", "cancel"];
  const isTerminal = terminalTags.some((tag) =>
    givenDto.userStatusMaster.tag.toLowerCase().includes(tag),
  );

  if (isTerminal && givenDto.promotionId) {
    // Find the academic year for this promotion
    const promotion = await db
      .select({
        academicYearId: sessionModel.academicYearId,
      })
      .from(promotionModel)
      .leftJoin(sessionModel, eq(promotionModel.sessionId, sessionModel.id))
      .where(eq(promotionModel.id, givenDto.promotionId))
      .limit(1);

    if (promotion.length > 0 && promotion[0].academicYearId) {
      const academicYearId = promotion[0].academicYearId;

      // Find all ACTIVE mappings for this student in the same academic year
      const mappingsToDeactivate = await db
        .select({ id: userStatusMappingModel.id })
        .from(userStatusMappingModel)
        .leftJoin(
          promotionModel,
          eq(userStatusMappingModel.promotionId, promotionModel.id),
        )
        .leftJoin(sessionModel, eq(promotionModel.sessionId, sessionModel.id))
        .where(
          and(
            eq(userStatusMappingModel.studentId, givenDto.studentId!),
            eq(sessionModel.academicYearId, academicYearId),
            eq(userStatusMappingModel.isActive, true), // Only deactivate ACTIVE mappings
            ne(userStatusMappingModel.id, newUserStatusMapping.id),
          ),
        );

      // Deactivate them
      for (const mapping of mappingsToDeactivate) {
        await db
          .update(userStatusMappingModel)
          .set({ isActive: false })
          .where(eq(userStatusMappingModel.id, mapping.id));
      }
    }
  }

  return {
    data: newUserStatusMapping,
    message: "Created!",
    status: 201,
  };
}

export async function getUserStatusMappingById(id: number) {
  const foundUserStatusMapping = await db
    .select()
    .from(userStatusMappingModel)
    .where(eq(userStatusMappingModel.id, id!));

  return {
    data: foundUserStatusMapping,
    message: foundUserStatusMapping ? "Retrieved!" : "Not found",
    status: foundUserStatusMapping ? 200 : 404,
  };
}

export async function updateUserStatusMapping(givenDto: UserStatusMappingDto) {
  // For updates, only validate if not changing isActive flag
  const existingMapping = await db
    .select()
    .from(userStatusMappingModel)
    .where(eq(userStatusMappingModel.id, givenDto.id!))
    .limit(1);

  if (existingMapping.length === 0) {
    return { data: null, message: "Mapping not found", status: 404 };
  }

  // Check if we're deactivating a terminal status
  const terminalTags = ["alumni", "transfer certificate", "tc", "cancel"];
  const isTerminal = terminalTags.some((tag) =>
    givenDto.userStatusMaster.tag.toLowerCase().includes(tag),
  );
  const wasActive = existingMapping[0].isActive;
  const willBeInactive = givenDto.isActive === false;

  const { userStatusMaster, id, createdAt, updatedAt, ...rest } = givenDto;

  const [savedUserStatusMapping] = await db
    .update(userStatusMappingModel)
    .set({
      ...rest,
      userStatusMasterId: userStatusMaster.id!,
      isActive: givenDto.isActive !== undefined ? givenDto.isActive : true,
    })
    .where(eq(userStatusMappingModel.id, givenDto.id!))
    .returning();

  // If we're deactivating a terminal status, reactivate other NON-TERMINAL mappings in the same academic year
  if (isTerminal && wasActive && willBeInactive && givenDto.promotionId) {
    const promotion = await db
      .select({
        academicYearId: sessionModel.academicYearId,
      })
      .from(promotionModel)
      .leftJoin(sessionModel, eq(promotionModel.sessionId, sessionModel.id))
      .where(eq(promotionModel.id, givenDto.promotionId))
      .limit(1);

    if (promotion.length > 0 && promotion[0].academicYearId) {
      const academicYearId = promotion[0].academicYearId;

      // Find all inactive mappings for this student in the same academic year
      const mappingsToReactivate = await db
        .select({
          id: userStatusMappingModel.id,
          masterTag: userStatusMasterModel.tag,
        })
        .from(userStatusMappingModel)
        .leftJoin(
          promotionModel,
          eq(userStatusMappingModel.promotionId, promotionModel.id),
        )
        .leftJoin(sessionModel, eq(promotionModel.sessionId, sessionModel.id))
        .leftJoin(
          userStatusMasterModel,
          eq(
            userStatusMappingModel.userStatusMasterId,
            userStatusMasterModel.id,
          ),
        )
        .where(
          and(
            eq(userStatusMappingModel.studentId, givenDto.studentId!),
            eq(sessionModel.academicYearId, academicYearId),
            eq(userStatusMappingModel.isActive, false),
            ne(userStatusMappingModel.id, givenDto.id!),
          ),
        );

      // Reactivate them ONLY if they are not terminal statuses
      for (const mapping of mappingsToReactivate) {
        const isTerminalStatus = terminalTags.some((tag) =>
          mapping.masterTag?.toLowerCase().includes(tag),
        );

        // Only reactivate non-terminal statuses
        if (!isTerminalStatus) {
          await db
            .update(userStatusMappingModel)
            .set({ isActive: true })
            .where(eq(userStatusMappingModel.id, mapping.id));
        }
      }
    }
  }

  // If activating a terminal status, deactivate other ACTIVE mappings
  if (isTerminal && !wasActive && !willBeInactive && givenDto.promotionId) {
    const promotion = await db
      .select({
        academicYearId: sessionModel.academicYearId,
      })
      .from(promotionModel)
      .leftJoin(sessionModel, eq(promotionModel.sessionId, sessionModel.id))
      .where(eq(promotionModel.id, givenDto.promotionId))
      .limit(1);

    if (promotion.length > 0 && promotion[0].academicYearId) {
      const academicYearId = promotion[0].academicYearId;

      const mappingsToDeactivate = await db
        .select({ id: userStatusMappingModel.id })
        .from(userStatusMappingModel)
        .leftJoin(
          promotionModel,
          eq(userStatusMappingModel.promotionId, promotionModel.id),
        )
        .leftJoin(sessionModel, eq(promotionModel.sessionId, sessionModel.id))
        .where(
          and(
            eq(userStatusMappingModel.studentId, givenDto.studentId!),
            eq(sessionModel.academicYearId, academicYearId),
            eq(userStatusMappingModel.isActive, true), // Only deactivate ACTIVE mappings
            ne(userStatusMappingModel.id, givenDto.id!),
          ),
        );

      for (const mapping of mappingsToDeactivate) {
        await db
          .update(userStatusMappingModel)
          .set({ isActive: false })
          .where(eq(userStatusMappingModel.id, mapping.id));
      }
    }
  }

  return {
    data: savedUserStatusMapping,
    message: "Updated!",
    status: 200,
  };
}

export async function getUserStatusMappingsByStudentId(studentId: number) {
  const mappings = await db
    .select()
    .from(userStatusMappingModel)
    .where(eq(userStatusMappingModel.studentId, studentId));

  if (!mappings.length) {
    return { data: [], message: "No mappings found", status: 200 };
  }

  const results: UserStatusMappingDto[] = [];

  for (const mapping of mappings) {
    // Get master
    const [master] = await db
      .select()
      .from(userStatusMasterModel)
      .where(eq(userStatusMasterModel.id, mapping.userStatusMasterId));

    if (!master) continue;

    // Get levels, domains, frequencies
    const [levels, domains, frequencies] = await Promise.all([
      db
        .select()
        .from(userStatusMasterLevelModel)
        .where(eq(userStatusMasterLevelModel.userStatusMasterId, master.id)),
      db
        .select()
        .from(userStatusMasterDomainModel)
        .where(eq(userStatusMasterDomainModel.userStatusMasterId, master.id)),
      db
        .select()
        .from(userStatusMasterFrequencyModel)
        .where(
          eq(userStatusMasterFrequencyModel.userStatusMasterId, master.id),
        ),
    ]);

    // Get session -> academic year
    let sessionData = null;
    let academicYearData = null;
    if (mapping.sessionId) {
      const [sess] = await db
        .select()
        .from(sessionModel)
        .where(eq(sessionModel.id, mapping.sessionId));
      sessionData = sess ?? null;
      if (sess?.academicYearId) {
        const [ay] = await db
          .select()
          .from(academicYearModel)
          .where(eq(academicYearModel.id, sess.academicYearId));
        academicYearData = ay ?? null;
      }
    }

    // Get promotion -> class (semester)
    let promotionData = null;
    let classData = null;
    if (mapping.promotionId) {
      const [prom] = await db
        .select()
        .from(promotionModel)
        .where(eq(promotionModel.id, mapping.promotionId));
      promotionData = prom ?? null;
      if (prom?.classId) {
        const { classModel } =
          await import("@repo/db/schemas/models/academics");
        const [cls] = await db
          .select()
          .from(classModel)
          .where(eq(classModel.id, prom.classId));
        classData = cls ?? null;
      }
    }

    const { userStatusMasterId, ...restMapping } = mapping;
    results.push({
      ...restMapping,
      userStatusMaster: {
        ...master,
        levels,
        domains,
        frequencies,
      },
      // Attach extra data for frontend convenience
      session: sessionData,
      academicYear: academicYearData,
      class: classData,
    } as UserStatusMappingDto & {
      session?: unknown;
      academicYear?: unknown;
      class?: unknown;
    });
  }

  return { data: results, message: "Retrieved!", status: 200 };
}

export async function getAllUserStatusMasters() {
  const masters = await db.select().from(userStatusMasterModel);
  const results: UserStatusMasterDto[] = [];

  for (const master of masters) {
    const [levels, domains, frequencies] = await Promise.all([
      db
        .select()
        .from(userStatusMasterLevelModel)
        .where(eq(userStatusMasterLevelModel.userStatusMasterId, master.id)),
      db
        .select()
        .from(userStatusMasterDomainModel)
        .where(eq(userStatusMasterDomainModel.userStatusMasterId, master.id)),
      db
        .select()
        .from(userStatusMasterFrequencyModel)
        .where(
          eq(userStatusMasterFrequencyModel.userStatusMasterId, master.id),
        ),
    ]);

    results.push({ ...master, levels, domains, frequencies });
  }

  return { data: results, message: "Retrieved!", status: 200 };
}

export async function getPromotionsByStudentId(studentId: number) {
  const promotions = await db
    .select()
    .from(promotionModel)
    .where(eq(promotionModel.studentId, studentId))
    .orderBy(desc(promotionModel.id));

  const results = [];

  // Get student's program course to determine total semesters
  const [student] = await db
    .select()
    .from(studentModel)
    .where(eq(studentModel.id, studentId));

  let programCourse = null;
  if (student?.programCourseId) {
    const [pc] = await db
      .select()
      .from(programCourseModel)
      .where(eq(programCourseModel.id, student.programCourseId));
    programCourse = pc ?? null;
  }

  for (const promotion of promotions) {
    // Get session
    const [session] = await db
      .select()
      .from(sessionModel)
      .where(eq(sessionModel.id, promotion.sessionId));

    // Get academic year from session
    let academicYear = null;
    if (session?.academicYearId) {
      const [ay] = await db
        .select()
        .from(academicYearModel)
        .where(eq(academicYearModel.id, session.academicYearId));
      academicYear = ay ?? null;
    }

    // Get class (semester)
    const [cls] = await db
      .select()
      .from(classModel)
      .where(eq(classModel.id, promotion.classId));

    results.push({
      ...promotion,
      session: session ?? null,
      academicYear,
      class: cls ?? null,
    });
  }

  return {
    data: results,
    message: "Retrieved!",
    status: 200,
    meta: {
      totalSemesters: programCourse?.totalSemesters ?? null,
      completedSemesters: promotions.length,
    },
  };
}

export async function deleteUserStatusMapping(id: number) {
  const deleted = await db
    .delete(userStatusMappingModel)
    .where(eq(userStatusMappingModel.id, id))
    .returning();

  if (!deleted.length) {
    return {
      data: null,
      message: "Record not found",
      status: 404,
    };
  }

  return {
    data: deleted[0],
    message: "Deleted!",
    status: 200,
  };
}
