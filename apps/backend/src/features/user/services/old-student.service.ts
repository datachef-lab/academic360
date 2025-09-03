import { mysqlConnection } from "@/db";
import { OldStaff } from "@repo/db/legacy-system-types/users";
import { bloodGroupModel, categoryModel, countryModel, languageMediumModel, nationalityModel, occupationModel, religionModel, specializationModel, stateModel } from "@repo/db/schemas";
import { and, eq, or } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "mysql2/typings/mysql/lib/Pool";

const BATCH_SIZE = 500;

type DbType = NodePgDatabase<Record<string, never>> & {
    $client: Pool;
}

export async function loadData() {
    // Step 1: Load all the old staffs and admins
    const [oldStaffs] = await mysqlConnection.query(`
        SELECT * 
        FROM staffpersonaldetails
    `) as [OldStaff[], any];

    
    

































    // STEP 1: Count the total numbers of students
    console.log('\n\nCounting rows from table \`coursedetails\`...');
    const [rows] = await mysqlConnection.query(`
        SELECT COUNT(*) AS totalRows
        FROM coursedetails
        WHERE uid IS NOT NULL AND shiftid = 2;
    `);
    const { totalRows } = (rows as { totalRows: number }[])[0];
    // STEP 2: Calculate the number of batches
    const totalBatches = Math.ceil(totalRows / BATCH_SIZE); // Calculate total number of batches
    console.log(`\nTotal rows to migrate: ${totalRows}`);
    // STEP 3: Loop over the batches
    for (let offset = 0; offset < totalRows; offset += BATCH_SIZE) {
        const currentBatch = Math.ceil((offset + 1) / BATCH_SIZE); // Determine current batch number

        // console.log(`\nMigrating batch: ${offset + 1} to ${Math.min(offset + BATCH_SIZE, totalRows)}`);
        // const [rows] = await mysqlConnection.query(`
        //     SELECT * 
        //     FROM studentpersonaldetails
        //     WHERE academicyearid = 17 OR academicyearid = 18
        //     LIMIT ${BATCH_SIZE} 
        //     OFFSET ${offset};
        // `) as [OldStudent[], any];

        console.log(`\nMigrating batch: ${offset + 1} to ${Math.min(offset + BATCH_SIZE, totalRows)}`);
        const [rows] = await mysqlConnection.query(`
            SELECT * 
            FROM coursedetails
            WHERE uid IS NOT NULL AND shiftid = 2
            LIMIT ${BATCH_SIZE}
            OFFSET ${offset};
        `) as [CourseDetails[], any];

        const oldDataArr = rows as CourseDetails[];

        for (let i = 0; i < oldDataArr.length; i++) {
            // Fetch the related studentpersonalDetail
            const [studentPersonalDetailRows] = await mysqlConnection.query(`
                SELECT * 
                FROM studentpersonaldetails
                WHERE admissionid = ${oldDataArr[i].id};
            `) as [OldStudent[], any];
            try {
                if (studentPersonalDetailRows.length === 0) {
                    console.log(`No studentpersonaldetails found for admissionid: ${oldDataArr[i].id}`);
                    continue; // Skip to the next iteration if no related record is found
                }
                await processStudent(studentPersonalDetailRows[0], oldDataArr[i]);
            } catch (error) {
                console.log(error)
            }
            console.log(`Batch: ${currentBatch}/${totalBatches} | Done: ${i + 1}/${oldDataArr.length} | Name: ${studentPersonalDetailRows[0]?.name}`);

        }
    }
}





export async function addOccupation(name: string, db: DbType, legacyOccupationId: number) {
    const [existingOccupation] = await db.select().from(occupationModel).where(eq(occupationModel.name, name.trim().toUpperCase()));
    if (existingOccupation) {
        return existingOccupation;
    }
    const [newOccupation] = await db.insert(occupationModel).values({
        name: name.trim().toUpperCase(),
        legacyOccupationId: legacyOccupationId,

    }).returning();

    return newOccupation;
}

export async function addBloodGroup(type: string, db: DbType, legacyBloodGroupId: number) {
    const [existingBloodGroup] = await db.select().from(bloodGroupModel).where(eq(bloodGroupModel.type, type.trim().toUpperCase()));
    if (existingBloodGroup) {
        return existingBloodGroup;
    }
    const [newBloodGroup] = await db.insert(bloodGroupModel).values({ legacyBloodGroupId: legacyBloodGroupId, type: type.trim().toUpperCase() }).returning();

    return newBloodGroup;
}

export async function addNationality(name: string, code: number | undefined | null, db: DbType, legacyNationalityId?: number) {
    const [existingNationality] = await db.select().from(nationalityModel).where(eq(nationalityModel.name, name.trim().toUpperCase()));
    if (existingNationality) {
        return existingNationality;
    }
    const [newNationality] = await db.insert(nationalityModel).values({ legacyNationalityId: legacyNationalityId, name: name.trim().toUpperCase(), code }).returning();

    return newNationality;
}

export async function addCategory(name: string, code: string, documentRequired: boolean | undefined, db: DbType, legacyCategoryId: number) {
    // Check if category exists by name OR code
    const [existingCategory] = await db.select().from(categoryModel).where(
        or(
            eq(categoryModel.name, name.trim().toUpperCase()),
            eq(categoryModel.code, code)
        )
    );
    if (existingCategory) {
        return existingCategory;
    }
    const [newCategory] = await db.insert(categoryModel).values({ legacyCategoryId: legacyCategoryId, name: name.trim().toUpperCase(), code, documentRequired }).returning();

    return newCategory;
}

export async function addReligion(name: string, db: DbType, legacyReligionId: number) {
    const [existingReligion] = await db.select().from(religionModel).where(eq(religionModel.name, name.trim().toUpperCase()));
    if (existingReligion) {
        return existingReligion;
    }
    const [newReligion] = await db.insert(religionModel).values({ legacyReligionId: legacyReligionId, name: name.trim().toUpperCase() }).returning();

    return newReligion;
}

export async function addLanguageMedium(name: string, db: DbType, legacyLanguageMediumId: number) {
    const [existingLanguage] = await db.select().from(languageMediumModel).where(eq(languageMediumModel.name, name.trim().toUpperCase()));
    if (existingLanguage) {
        return existingLanguage;
    }
    const [newLanguage] = await db.insert(languageMediumModel).values({ legacyLanguageMediumId: legacyLanguageMediumId, name: name.trim().toUpperCase() }).returning();

    return newLanguage;
}

export async function addSpecialization(name: string, db: DbType, legacySpecializationId: number) {
    const [existingSpecialization] = await db.select().from(specializationModel).where(eq(specializationModel.name, name.trim().toUpperCase()));
    if (existingSpecialization) {
        return existingSpecialization;
    }
    const [newSpecialization] = await db.insert(specializationModel).values({ legacySpecializationId: legacySpecializationId, name: name.trim().toUpperCase() }).returning();

    return newSpecialization;
}

async function addCountry(name: string, db: DbType, legacyCountryId: number) {
    const [existingCountry] = await db.select().from(countryModel).where(eq(countryModel.name, name.trim().toUpperCase()));
    if (existingCountry) {
        return existingCountry;
    }
    const [newCountry] = await db.insert(countryModel).values({ legacyCountryId: legacyCountryId, name: name.trim().toUpperCase() }).returning();

    return newCountry;
}

async function addState(name: string, db: DbType, legacyStateId: number) {
    const [[oldCountry]] = await mysqlConnection.query(`
        SELECT * 
        FROM country
        WHERE id = ${legacyCountryId};
    `) as [Country[], any];
    const [existingState] = await db
        .select()
        .from(stateModel)
        .where(
            and(
                eq(stateModel.name, name.trim().toUpperCase()),
                eq(stateModel.countryId, countryId)


            )
        );
    if (existingState) {
        return existingState;
    }

    const [newState] = await db.insert(stateModel).values({countryId legacyStateId: legacyStateId, name: name.trim().toUpperCase() }).returning();

    return newState;
}