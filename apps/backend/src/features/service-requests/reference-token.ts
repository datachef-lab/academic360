import "dotenv/config";
import jwt from "jsonwebtoken";

/**
 * Alumni reference tokens are NOT user access tokens. They authorize a single
 * credential-less alumnus to submit / track exactly one service ticket.
 *
 * To prevent token-type confusion we:
 *   1. Sign with a DEDICATED secret (distinct from ACCESS_TOKEN_SECRET even when
 *      ALUMNI_REFERENCE_TOKEN_SECRET is not set), so a real user access token can
 *      never validate here and vice-versa.
 *   2. Carry an explicit `kind` discriminator and explicit `ticketId`/`intakeId`
 *      claims — never a generic `id` shared with the user-token shape.
 */
const ALUMNI_REF_KIND = "ALUMNI_REFERENCE" as const;

function referenceSecret(): string {
  return (
    process.env.ALUMNI_REFERENCE_TOKEN_SECRET ||
    `${process.env.ACCESS_TOKEN_SECRET ?? ""}:alumni-reference`
  );
}

export interface AlumniReferenceClaims {
  ticketId: number;
  intakeId: number;
}

export function signAlumniReferenceToken(
  claims: AlumniReferenceClaims,
  expiresIn: string = "7d",
): string {
  return jwt.sign(
    { kind: ALUMNI_REF_KIND, ticketId: claims.ticketId, intakeId: claims.intakeId },
    referenceSecret(),
    { expiresIn } as jwt.SignOptions,
  );
}

/** Returns the validated claims, or null if the token is invalid/expired/wrong-kind. */
export function verifyAlumniReferenceToken(
  token: string,
): AlumniReferenceClaims | null {
  try {
    const decoded = jwt.verify(token, referenceSecret()) as Record<string, unknown>;
    if (decoded?.kind !== ALUMNI_REF_KIND) return null;
    if (typeof decoded.ticketId !== "number" || typeof decoded.intakeId !== "number") {
      return null;
    }
    return { ticketId: decoded.ticketId, intakeId: decoded.intakeId };
  } catch {
    return null;
  }
}
