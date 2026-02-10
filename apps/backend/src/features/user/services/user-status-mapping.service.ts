import { db } from "@/db";
import { UserStatusMappingDto } from "@repo/db/dtos";
import {
  promotionModel,
  sessionModel,
  userStatusMappingModel,
  userStatusMasterDomainModel,
  userStatusMasterFrequencyModel,
  userStatusMasterFrequencyTypeEnum,
  userStatusMasterLevelModel,
  userStatusMasterModel,
} from "@repo/db/schemas";
import { and, eq, ilike, ne } from "drizzle-orm";
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
   * Only once per user + status master
   */
  ONLY_ONCE: async (dto) => {
    const conditions = [
      eq(userStatusMappingModel.userId, dto.userId),
      eq(userStatusMappingModel.userStatusMasterId, dto.userStatusMaster.id!),
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
   * One entry per academic year
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
   * One entry per semester/class
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

  const { userStatusMaster, id, createdAt, updatedAt, ...rest } = givenDto;

  const [newUserStatusMapping] = await db
    .insert(userStatusMappingModel)
    .values({
      ...rest,
      userStatusMasterId: userStatusMaster.id!,
    })
    .returning();

  return {
    data: newUserStatusMapping,
    message: "Created!",
    status: 201,
  };
}

export async function getUserStatusMappingById(id: number) {
  const [foundUserStatusMapping] = await db
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
  const isValid = await checkValidation(givenDto);

  if (!isValid) {
    return { data: null, message: "Invalid update", status: 429 };
  }

  const { userStatusMaster, id, createdAt, updatedAt, ...rest } = givenDto;

  const [savedUserStatusMapping] = await db
    .update(userStatusMappingModel)
    .set({
      ...rest,
      userStatusMasterId: userStatusMaster.id!,
    })
    .where(eq(userStatusMappingModel.id, givenDto.id!))
    .returning();

  return {
    data: savedUserStatusMapping,
    message: "Updated!",
    status: 200,
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
