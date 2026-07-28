import { axiosInstance } from "@/lib/utils";
import type { DeclarationMasterDto } from "@repo/db/dtos/academics";

/** Contexts a declaration master can belong to (declaration_master_context). */
export type DeclarationContext = "ADMISSION" | "EXAM" | "FEES" | "LIBRARY" | "OTHER";

export type DeclarationStatementRow = {
  id: number;
  declarationMasterStatementId: number;
  isAgreed: boolean;
};

export type DeclarationRow = {
  id: number;
  declarationMasterId: number;
  promotionId: number;
  createdAt?: string;
  statements: DeclarationStatementRow[];
};

export type DeclarationStateResponse = {
  master: DeclarationMasterDto | null;
  declaration: DeclarationRow | null;
};

export type SubmitDeclarationBody = {
  promotionId: number;
  declarationMasterId: number;
  statements: {
    declarationMasterStatementId: number;
    isAgreed: boolean;
    fields?: {
      declarationMasterStatementFieldId: number;
      declarationMasterStatementFieldOptionId?: number | null;
      value?: string;
    }[];
  }[];
};

/**
 * The master for a context plus this promotion's existing declaration
 * (null when the student hasn't declared yet for this cycle).
 */
export async function fetchDeclarationState(
  promotionId: number,
  context: DeclarationContext,
): Promise<DeclarationStateResponse> {
  const { data } = await axiosInstance.get<{ payload?: DeclarationStateResponse }>(
    `/api/academics/declarations/promotion/${promotionId}`,
    { params: { context } },
  );
  return data?.payload ?? { master: null, declaration: null };
}

export async function submitDeclaration(
  body: SubmitDeclarationBody,
): Promise<DeclarationRow | null> {
  const { data } = await axiosInstance.post<{ payload?: DeclarationRow }>(
    `/api/academics/declarations`,
    body,
  );
  return data?.payload ?? null;
}
