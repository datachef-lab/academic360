import bcrypt from "bcrypt";
import { eq, count, desc } from "drizzle-orm";
import { db } from "@/db/index.js";
import { User, userModel } from "../models/user.model.js";
import { PayloadType, UserType } from "@/types/user/user.js";
import { PaginatedResponse } from "@/utils/PaginatedResponse.js";
import { findStudentById } from "./student.service.js";
import { findAll } from "@/utils/helper.js";

export async function addUser(user: User) {
    // Hash the password before storing it in the database
    const hashedPassword = await bcrypt.hash(user.password, 10);
    user.password = hashedPassword;

    // Create a new user
    const [newUser] = await db.insert(userModel).values(user).returning();

    const formattedUser = await userResponseFormat(newUser);

    return formattedUser;
}

export async function findAllUsers(page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<UserType>> {
    const usersResponse = await findAll<UserType>(userModel, page, pageSize);

    // Await Promise.all to resolve async operations
    const content = await Promise.all(usersResponse.content.map(async (user) => {
        return await userResponseFormat(user);
    })) as UserType[];

    const [{ count: countRows }] = await db.select({ count: count() }).from(userModel);

    return {
        content,
        page,
        pageSize,
        totalElemets: Number(countRows),
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

export async function userResponseFormat(givenUser: User): Promise<UserType | null> {
    if (!givenUser) {
        return null;
    }

    let payload: PayloadType = null;
    if (givenUser.type == "STUDENT") {
        const studentPayload = await findStudentById(givenUser.id as number);
        payload = studentPayload ? studentPayload : null;
    }
    return { ...givenUser, payload };
}