import type { Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import * as service from "../services/declaration-master.service.js";

const num = (v: unknown): number | undefined => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

/* --------------------------------- masters -------------------------------- */

export async function getDeclarationMastersHandler(
  req: Request,
  res: Response,
) {
  try {
    // ?context=FEES returns the single active master for that context, fully
    // nested and active-only — this is what the student consoles call.
    const context = req.query.context as string | undefined;
    if (context) {
      const master = await service.findDeclarationMasterByContext(
        context as never,
      );
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            master,
            master
              ? "Declaration master fetched"
              : "No active declaration master for this context",
          ),
        );
    }

    const masters = await service.findAllDeclarationMasters();
    return res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", masters, "Declaration masters fetched"),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function getDeclarationMasterByIdHandler(
  req: Request,
  res: Response,
) {
  try {
    const id = num(req.params.id);
    if (!id) {
      return res
        .status(400)
        .json(new ApiResponse(400, "BAD_REQUEST", null, "Invalid id"));
    }
    const master = await service.findDeclarationMasterById(id);
    if (!master) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Declaration master not found",
          ),
        );
    }
    return res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", master, "Declaration master fetched"),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

/**
 * Rendered-email preview of the master's own template, filled with the
 * master's real statements/fields (the generic notifications-console preview
 * only ever shows "{{placeholder}}" text).
 */
export async function previewDeclarationMasterHandler(
  req: Request,
  res: Response,
) {
  try {
    const id = num(req.params.id);
    if (!id) {
      return res
        .status(400)
        .json(new ApiResponse(400, "BAD_REQUEST", null, "Invalid id"));
    }
    const preview = await service.previewDeclarationMaster(id);
    if (!preview) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Declaration master not found",
          ),
        );
    }
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          preview,
          "Declaration preview rendered",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

/**
 * Live preview of an UNSAVED master tree — the console posts the current
 * dialog draft on each edit, so the email updates as the admin types. Reads
 * and writes nothing; the body is the whole input.
 */
export async function previewDeclarationMasterDraftHandler(
  req: Request,
  res: Response,
) {
  try {
    const body = req.body as service.DeclarationMasterPreviewDraft | undefined;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, "BAD_REQUEST", null, "Invalid draft payload"),
        );
    }
    const preview = await service.previewDeclarationMasterDraft(body);
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          preview,
          "Declaration preview rendered",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function createDeclarationMasterHandler(
  req: Request,
  res: Response,
) {
  try {
    const created = await service.createDeclarationMaster(req.body);
    return res
      .status(201)
      .json(
        new ApiResponse(201, "CREATED", created, "Declaration master created"),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function updateDeclarationMasterHandler(
  req: Request,
  res: Response,
) {
  try {
    const id = num(req.params.id);
    if (!id) {
      return res
        .status(400)
        .json(new ApiResponse(400, "BAD_REQUEST", null, "Invalid id"));
    }
    const updated = await service.updateDeclarationMaster(id, req.body);
    if (!updated) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Declaration master not found",
          ),
        );
    }
    return res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", updated, "Declaration master updated"),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function deleteDeclarationMasterHandler(
  req: Request,
  res: Response,
) {
  try {
    const id = num(req.params.id);
    if (!id) {
      return res
        .status(400)
        .json(new ApiResponse(400, "BAD_REQUEST", null, "Invalid id"));
    }
    const ok = await service.deleteDeclarationMaster(id);
    return res
      .status(ok ? 200 : 404)
      .json(
        new ApiResponse(
          ok ? 200 : 404,
          ok ? "SUCCESS" : "NOT_FOUND",
          null,
          ok ? "Declaration master deleted" : "Declaration master not found",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

/* ------------------------------- statements ------------------------------- */

export async function getStatementsHandler(req: Request, res: Response) {
  try {
    const masterId = num(req.query.declarationMasterId);
    if (!masterId) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            null,
            "declarationMasterId is required",
          ),
        );
    }
    const rows = await service.findStatementsByMasterId(masterId);
    return res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", rows, "Statements fetched"));
  } catch (error) {
    return handleError(error, res);
  }
}

export async function createStatementHandler(req: Request, res: Response) {
  try {
    const created = await service.createStatement(req.body);
    return res
      .status(201)
      .json(new ApiResponse(201, "CREATED", created, "Statement created"));
  } catch (error) {
    return handleError(error, res);
  }
}

export async function updateStatementHandler(req: Request, res: Response) {
  try {
    const id = num(req.params.id);
    if (!id) {
      return res
        .status(400)
        .json(new ApiResponse(400, "BAD_REQUEST", null, "Invalid id"));
    }
    const updated = await service.updateStatement(id, req.body);
    if (!updated) {
      return res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "Statement not found"));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", updated, "Statement updated"));
  } catch (error) {
    return handleError(error, res);
  }
}

export async function deleteStatementHandler(req: Request, res: Response) {
  try {
    const id = num(req.params.id);
    if (!id) {
      return res
        .status(400)
        .json(new ApiResponse(400, "BAD_REQUEST", null, "Invalid id"));
    }
    const ok = await service.deleteStatement(id);
    return res
      .status(ok ? 200 : 404)
      .json(
        new ApiResponse(
          ok ? 200 : 404,
          ok ? "SUCCESS" : "NOT_FOUND",
          null,
          ok ? "Statement deleted" : "Statement not found",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

/* --------------------------------- fields --------------------------------- */

export async function getFieldsHandler(req: Request, res: Response) {
  try {
    const statementId = num(req.query.declarationMasterStatementId);
    if (!statementId) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            null,
            "declarationMasterStatementId is required",
          ),
        );
    }
    const rows = await service.findFieldsByStatementId(statementId);
    return res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", rows, "Fields fetched"));
  } catch (error) {
    return handleError(error, res);
  }
}

export async function createFieldHandler(req: Request, res: Response) {
  try {
    const created = await service.createField(req.body);
    return res
      .status(201)
      .json(new ApiResponse(201, "CREATED", created, "Field created"));
  } catch (error) {
    return handleError(error, res);
  }
}

export async function updateFieldHandler(req: Request, res: Response) {
  try {
    const id = num(req.params.id);
    if (!id) {
      return res
        .status(400)
        .json(new ApiResponse(400, "BAD_REQUEST", null, "Invalid id"));
    }
    const updated = await service.updateField(id, req.body);
    if (!updated) {
      return res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "Field not found"));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", updated, "Field updated"));
  } catch (error) {
    return handleError(error, res);
  }
}

export async function deleteFieldHandler(req: Request, res: Response) {
  try {
    const id = num(req.params.id);
    if (!id) {
      return res
        .status(400)
        .json(new ApiResponse(400, "BAD_REQUEST", null, "Invalid id"));
    }
    const ok = await service.deleteField(id);
    return res
      .status(ok ? 200 : 404)
      .json(
        new ApiResponse(
          ok ? 200 : 404,
          ok ? "SUCCESS" : "NOT_FOUND",
          null,
          ok ? "Field deleted" : "Field not found",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

/* --------------------------------- options -------------------------------- */

export async function getOptionsHandler(req: Request, res: Response) {
  try {
    const fieldId = num(req.query.declarationMasterStatementFieldId);
    if (!fieldId) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            null,
            "declarationMasterStatementFieldId is required",
          ),
        );
    }
    const rows = await service.findOptionsByFieldId(fieldId);
    return res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", rows, "Options fetched"));
  } catch (error) {
    return handleError(error, res);
  }
}

export async function createOptionHandler(req: Request, res: Response) {
  try {
    const created = await service.createOption(req.body);
    return res
      .status(201)
      .json(new ApiResponse(201, "CREATED", created, "Option created"));
  } catch (error) {
    return handleError(error, res);
  }
}

export async function updateOptionHandler(req: Request, res: Response) {
  try {
    const id = num(req.params.id);
    if (!id) {
      return res
        .status(400)
        .json(new ApiResponse(400, "BAD_REQUEST", null, "Invalid id"));
    }
    const updated = await service.updateOption(id, req.body);
    if (!updated) {
      return res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "Option not found"));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", updated, "Option updated"));
  } catch (error) {
    return handleError(error, res);
  }
}

export async function deleteOptionHandler(req: Request, res: Response) {
  try {
    const id = num(req.params.id);
    if (!id) {
      return res
        .status(400)
        .json(new ApiResponse(400, "BAD_REQUEST", null, "Invalid id"));
    }
    const ok = await service.deleteOption(id);
    return res
      .status(ok ? 200 : 404)
      .json(
        new ApiResponse(
          ok ? 200 : 404,
          ok ? "SUCCESS" : "NOT_FOUND",
          null,
          ok ? "Option deleted" : "Option not found",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}
