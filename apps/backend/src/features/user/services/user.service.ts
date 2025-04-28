import bcrypt from "bcrypt";
import { eq, count, desc, or, ilike } from "drizzle-orm";
import { db } from "@/db/index.js";
import { User, userModel } from "../models/user.model.js";
import { PayloadType, UserType } from "@/types/user/user.js";
import { PaginatedResponse } from "@/utils/PaginatedResponse.js";
import { findStudentById, findStudentByUserId } from "./student.service.js";
import { findAll } from "@/utils/helper.js";

export async function addUser(user: User) {
    // Hash the password before storing it in the database
    let hashedPassword = await bcrypt.hash(user.password, 10)
    
    user.password = hashedPassword;

    // Create a new user
    const [newUser] = await db.insert(userModel).values(user).returning();

    const formattedUser = await userResponseFormat(newUser);

    return formattedUser;
}

export async function findAllUsers(
    page: number = 1, 
    pageSize: number = 10,
    isAdminCheck: boolean = false
): Promise<PaginatedResponse<UserType>> {
    // Use proper Drizzle eq condition
    const whereCondition = isAdminCheck ? eq(userModel.type, "ADMIN") : undefined;

    const usersResponse = await findAll<UserType>(
        userModel, 
        page, 
        pageSize,
        "id", 
        whereCondition 
    );

    // Await Promise.all to resolve async operations
    const content = await Promise.all(usersResponse.content.map(async (user) => {
        return await userResponseFormat(user);
    })) as UserType[];

    // Count should use the same where condition
    const countQuery = whereCondition
        ? db.select({ count: count() }).from(userModel).where(whereCondition)
        : db.select({ count: count() }).from(userModel);
    const [{ count: countRows }] = await countQuery;

    return {
        content,
        page,
        pageSize,
        totalElements: Number(countRows),
        totalPages: Math.ceil(Number(countRows) / pageSize)
    };
}

export async function findUserById(id: number) {
    const [foundUser] = await db.select().from(userModel).where(eq(userModel.id, id));

    const formattedUser = await userResponseFormat(foundUser);

    return formattedUser;
}

export async function findUserByEmail(email: string) {
    const [foundUser] = await db.select().from(userModel).where(eq(userModel.email, email));

    const formattedUser = await userResponseFormat(foundUser);

    return formattedUser;
}

export async function saveUser(id: number, user: User) {
    const [foundUser] = await db.select().from(userModel).where(eq(userModel.id, id));
    if (!foundUser) {
        return null;
    }
    const [updatedUser] = await db.update(userModel).set({
        name: user.name,
        image: user.image,
        phone: user.phone,
        whatsappNumber: user.whatsappNumber,
    }).where(eq(userModel.id, foundUser.id)).returning();

    const formattedUser = await userResponseFormat(updatedUser);

    return formattedUser;
}

export async function toggleUser(id: number) {
    const [foundUser] = await db.select().from(userModel).where(eq(userModel.id, id));
    if (!foundUser) {
        return null;
    }

    const [updatedUser] = await db.update(userModel).set({
        disabled: !foundUser.disabled
    })
        .where(eq(userModel.id, foundUser.id))
        .returning();

    const formattedUser = await userResponseFormat(updatedUser);

    return formattedUser;
}


export async function searchUser(searchText: string, page: number = 1, pageSize: number = 10) {
    // Trim spaces and convert searchText to lowercase
    searchText = searchText.trim().toLowerCase();

    // Query students based on student name, roll number, registration number, etc.
    const userQuery = db
        .select()
        .from(userModel)
        .where(
            or(
                ilike(userModel.name, `%${searchText}%`),
                ilike(userModel.email, `%${searchText}%`),
                ilike(userModel.phone, `%${searchText}%`),
                ilike(userModel.whatsappNumber, `%${searchText}%`),
            )
        );

    // Get the paginated students
    const users = await userQuery.limit(pageSize).offset((page - 1) * pageSize);

    // Get the total count of students matching the filter
    const [{ count: countRows }] = await db
        .select({ count: count() })
        .from(userModel)
        .where(
            or(
                ilike(userModel.name, `%${searchText}%`),
                ilike(userModel.email, `%${searchText}%`),
                ilike(userModel.phone, `%${searchText}%`),
                ilike(userModel.whatsappNumber, `%${searchText}%`),
            )
        );

    // Map the result to a properly formatted response
    const content = await Promise.all(users.map(async (userRecord) => {
        return await userResponseFormat(userRecord);
    }));

    return {
        content,
        page,
        pageSize,
        totalElements: Number(countRows), // Now this count is correct!
        totalPages: Math.ceil(Number(countRows) / pageSize)
    };
}



export async function userResponseFormat(givenUser: User): Promise<UserType | null> {
    if (!givenUser) {
        return null;
    }

    let payload: PayloadType = null;
    if (givenUser.type == "STUDENT") {
        const studentPayload = await findStudentByUserId(givenUser.id as number);
        payload = studentPayload ? studentPayload : null;
    }
    return { ...givenUser, payload };
}