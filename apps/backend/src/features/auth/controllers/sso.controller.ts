import crypto from "node:crypto";

import type { NextFunction, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { createRemoteJWKSet, jwtVerify } from "jose";
import type { StringValue } from "ms";

import { db } from "@/db/index.js";
import { userModel } from "@repo/db/schemas/models/user";
import { generateToken } from "@/utils/generateToken.js";
import { handleError } from "@/utils/handleError.js";

/**
 * HR360 SSO (OIDC relying party) — staff/admin only.
 *
 * GET /auth/sso/login     -> redirect to the HR360 authorize endpoint
 * GET /auth/sso/callback  -> exchange code, verify ID token via JWKS, match the
 *                            local user (sso_sub, then email), set the same
 *                            "jwt" cookie the password/Google logins set.
 *
 * Identity-only: HR360 says WHO the person is. Academic360 decides who may
 * enter — users are NOT auto-created here; unknown staff are sent back to the
 * login page with an error. Student OTP flow is untouched.
 */

const SSO_TX_COOKIE = "sso_tx"; // state + PKCE verifier while the redirect is in flight

const issuer = () => process.env.SSO_ISSUER!; // e.g. https://hr360.academic360.app
const clientId = () => process.env.SSO_CLIENT_ID!;
const clientSecret = () => process.env.SSO_CLIENT_SECRET!;
const redirectUri = () => process.env.SSO_REDIRECT_URI!; // e.g. https://api.academic360.app/auth/sso/callback

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
const getJwks = () => {
  if (!jwks) jwks = createRemoteJWKSet(new URL(`${issuer()}/oauth/jwks.json`));
  return jwks;
};

const b64url = (buf: Buffer) => buf.toString("base64url");

export const ssoLogin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!process.env.SSO_ISSUER || !process.env.SSO_CLIENT_ID) {
      res.status(503).json({ message: "SSO is not configured" });
      return;
    }
    const state = b64url(crypto.randomBytes(24));
    const verifier = b64url(crypto.randomBytes(48));
    const challenge = b64url(
      crypto.createHash("sha256").update(verifier).digest(),
    );

    const isProduction = process.env.NODE_ENV === "production";
    res.cookie(SSO_TX_COOKIE, JSON.stringify({ state, verifier }), {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 1000 * 60 * 10,
      path: "/auth/sso",
    });

    const q = new URLSearchParams({
      response_type: "code",
      client_id: clientId(),
      redirect_uri: redirectUri(),
      scope: "openid profile email",
      state,
      code_challenge: challenge,
      code_challenge_method: "S256",
    });
    res.redirect(`${issuer()}/oauth/authorize?${q.toString()}`);
  } catch (error) {
    handleError(error, res, next);
  }
};

export const ssoCallback = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const loginUrl = `${process.env.CORS_ORIGIN!.split(",")[0].trim()}/login`;
  try {
    const { code, state } = req.query as { code?: string; state?: string };
    const rawTx = req.cookies?.[SSO_TX_COOKIE];
    res.clearCookie(SSO_TX_COOKIE, { path: "/auth/sso" });

    if (!code || !state || !rawTx) {
      res.redirect(`${loginUrl}?error=sso_invalid_state`);
      return;
    }
    let tx: { state: string; verifier: string };
    try {
      tx = JSON.parse(rawTx);
    } catch {
      res.redirect(`${loginUrl}?error=sso_invalid_state`);
      return;
    }
    if (tx.state !== state) {
      res.redirect(`${loginUrl}?error=sso_invalid_state`);
      return;
    }

    // authorization code -> tokens
    const tokenRes = await fetch(`${issuer()}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri(),
        client_id: clientId(),
        client_secret: clientSecret(),
        code_verifier: tx.verifier,
      }),
    });
    if (!tokenRes.ok) {
      console.error(
        "[SSO] token exchange failed:",
        tokenRes.status,
        await tokenRes.text(),
      );
      res.redirect(`${loginUrl}?error=sso_failed`);
      return;
    }
    const tokens = (await tokenRes.json()) as { id_token: string };

    // verify ID token signature + iss + aud against HR360's JWKS
    const { payload } = await jwtVerify(tokens.id_token, getJwks(), {
      issuer: issuer(),
      audience: clientId(),
    });
    const ssoSub = String(payload.sub);
    const email = typeof payload.email === "string" ? payload.email : undefined;

    // match existing user: sso_sub first, then email (first-time link)
    let [foundUser] = await db
      .select()
      .from(userModel)
      .where(eq(userModel.ssoSub, ssoSub));
    if (!foundUser && email) {
      const [byEmail] = await db
        .select()
        .from(userModel)
        .where(eq(userModel.email, email));
      if (
        byEmail &&
        (byEmail.type === "STAFF" ||
          byEmail.type === "ADMIN" ||
          byEmail.type === "FACULTY")
      ) {
        [foundUser] = await db
          .update(userModel)
          .set({ ssoSub })
          .where(eq(userModel.id, byEmail.id))
          .returning();
      }
    }

    if (!foundUser || foundUser.isSuspended || foundUser.isActive === false) {
      // identity verified, but this app has not provisioned the person -> no entry
      res.redirect(`${loginUrl}?error=sso_no_account`);
      return;
    }
    if (foundUser.type === "STUDENT") {
      // students never log in through staff SSO
      res.redirect(`${loginUrl}?error=sso_no_account`);
      return;
    }

    const refreshToken = generateToken(
      { id: foundUser.id!, type: foundUser.type },
      process.env.REFRESH_TOKEN_SECRET!,
      process.env.REFRESH_TOKEN_EXPIRY! as StringValue,
    );

    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24, // 1 day — same as password/Google logins
    });

    res.redirect(`${process.env.CORS_ORIGIN!.split(",")[0].trim()}/dashboard`);
  } catch (error) {
    console.error("[SSO] callback error:", error);
    res.redirect(`${loginUrl}?error=sso_failed`);
  }
};
