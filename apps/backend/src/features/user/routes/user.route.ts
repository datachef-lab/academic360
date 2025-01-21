import express from "express";
import { getAllUsers, getUserByEmail, getUserById, toggleDisableUser, updateUser } from "../controllers/user.controller.ts";
import { verifyJWT } from "@/middlewares/verifyJWT.ts";

const router = express.Router();

router.use(verifyJWT);

router.get('/', getAllUsers);

router.get('/:id', getUserById);

router.get('/:email', getUserByEmail);

router.put('/:id', updateUser);

router.put('/:id', toggleDisableUser);


export default router;