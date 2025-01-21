import { UserType } from "@/features/user/models/user.model.ts";

export { };

declare global {
    namespace Express {
        export interface Request {
            user: UserType;
        }
    }
}