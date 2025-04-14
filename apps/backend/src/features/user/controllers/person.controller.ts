import { NextFunction, Response, Request } from "express";
import { handleError } from "@/utils/handleError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import { createPersonSchema, personModel } from "../models/person.model.js";
import { addPerson, findPersonById, savePerson } from "../services/person.service.js";
import { PersonType } from "@/types/user/person.js";

export const createPerson = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const newPerson = await addPerson(req.body as PersonType);

        res.status(201).json(new ApiResponse(201, "SUCCESS", newPerson, "New Person is added to db!"));

    } catch (error) {
        handleError(error, res, next);
    }
};

// export const getPersonById = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const { id } = req.query;

//         const foundPerson = await findPersonById(Number(id));

//         if (!foundPerson) {
//             res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Person of ID${id}  not found`));
//             return;
//         }

//         res.status(200).json(new ApiResponse(200, "SUCCESS", foundPerson, "Fetched Person successfully!"));

//     } catch (error) {
//         handleError(error, res, next);
//     }
// };

// getPersonById
// Get a specific blood group
export const getPersonById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const person = await db
      .select()
      .from(personModel)
      .where(eq(personModel.id, Number(id)))
      .limit(1);

    if (!person[0]) {
      res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "person not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", person[0], "Fetched all persons!"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updatePerson = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.query;

        const updatedPerson = await savePerson(Number(id), req.body as PersonType);

        if (!updatedPerson) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Person not found"));
            return;
        }
        res.status(200).json(new ApiResponse(200, "UPDATED", updatedPerson, "Person updated successfully"));

    } catch (error) {
        handleError(error, res, next);
    }
};