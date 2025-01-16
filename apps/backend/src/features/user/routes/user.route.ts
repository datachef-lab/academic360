import express from "express";
import { createUser, getAllUsers, getUserByEmail, getUserById, toggleDisableUser, updateUser } from "../controllers/user.controller.ts";

const router = express.Router();

router.post('/', createUser);

router.get('/', getAllUsers);

router.get('/:id', getUserById);

router.get('/:email', getUserByEmail);

router.put('/:id', updateUser);

router.put('/:id', toggleDisableUser);


export default router;