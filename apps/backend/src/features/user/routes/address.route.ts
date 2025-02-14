import express from "express";
import { verifyJWT } from "@/middlewares/verifyJWT.js";

import { createAddress, getAddressById, updateAddress } from "../controllers/address.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.post("/", createAddress);

router.get("/query", (req, res, next) => {
    const { id } = req.query;
    console.log(id);
    if (id) {
        getAddressById(req, res, next);
    } else {
        next();
    }
});

router.put("/:id", updateAddress);

export default router;