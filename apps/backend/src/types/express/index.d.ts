import { UserType } from "@/features/user/models/user.model.js";

export { };

declare global {
    namespace Express {
        export interface Request {
            user: UserType;
        }
    }
}