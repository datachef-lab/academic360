import bcrypt from "bcrypt";
import { eq, count } from "drizzle-orm";
import { db } from "@/db/index.ts";
import { User, userModel } from "../models/user.model.ts";
import { PayloadType, UserType } from "@/types/user/user.ts";
import { PaginatedResponse } from "@/utils/PaginatedResponse.ts";
import { getStudentById } from "./student.service.ts";

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
    const offset = (page - 1) * pageSize;

    const users = await db.select().from(userModel).limit(pageSize).offset(offset);

    if (users.length === 0) {
        return {
            content: [],
            pageNumber: page,
            pageSize,
            totalElemets: 0,
            totalPages: 0
        };
    }

    // Await Promise.all to resolve async operations
    const tmpUsers = await Promise.all(users.map(async (user) => {
        return await userResponseFormat(user);
    })) as UserType[];

    const [{ count: countRows }] = await db.select({ count: count() }).from(userModel);

    return {
        content: tmpUsers,
        pageNumber: page,
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

async function userResponseFormat(givenUser: User): Promise<UserType | null> {
    if (!givenUser) {
        return null;
    }

    let payload: PayloadType;
    if (givenUser.type == "STUDENT") {
        payload = await getStudentById(givenUser.id as number);
    }
    return { ...givenUser, payload };
}