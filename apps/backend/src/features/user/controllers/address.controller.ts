import { NextFunction, Response, Request } from "express";
import { handleError } from "@/utils/handleError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import { addressModel, createAddressSchema } from "@/features/user/models/address.model.js";
import { addAddress, findAddressById, saveAddress } from "@/features/user/services/address.service.js";
import { AddressType } from "@/types/user/address.js";

export const createAddress = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const newAddress = await addAddress(req.body as AddressType);

        res.status(201).json(new ApiResponse(201, "SUCCESS", newAddress, "New Address is added to db!"));

    } catch (error) {
        handleError(error, res, next);
    }
};



export const getAddressById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.query;

        const foundAddress = await findAddressById(Number(id));

        if (!foundAddress) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Address of ID${id}  not found`));
            return;
        }
        
        res.status(200).json(new ApiResponse(200, "SUCCESS", foundAddress, "Fetched Address successfully!"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const updateAddress = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.query;

        const updatedAddress = await saveAddress(Number(id), req.body as AddressType);

        if (!updatedAddress) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Address not found"));
            return;
        }
       
        res.status(200).json(new ApiResponse(200, "UPDATED", updatedAddress, "Address updated successfully"));

    } catch (error) {
        handleError(error, res, next);
    }
};