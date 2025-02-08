import express, { NextFunction, Request, Response } from "express";
import { getAllUsers, getUserByEmail, getUserById, toggleDisableUser, updateUser } from "../controllers/user.controller.js";
import { verifyJWT } from "@/middlewares/verifyJWT.js";

const router = express.Router();

router.use(verifyJWT);

router.get('/', getAllUsers);

router.get('/query', (req: Request, res: Response, next: NextFunction) => {
    const { id, email } = req.query;
    if (id) {
        return getUserById(req, res, next);
    }
    else if (email) {
        return getUserByEmail(req, res, next);
    }
    else {
        next();
    }
});

router.put('/:id', updateUser);

router.put('/:id', toggleDisableUser);


export default router;