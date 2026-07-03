"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/utils";

export type AppEnv = "production" | "staging" | "development";

function normalizeEnv(value: unknown): AppEnv | null {
  const v = String(value ?? "").toLowerCase();
  if (v === "production") return "production";
  if (v === "staging") return "staging";
  if (v === "development") return "development";
  return null;
}

/** Hostname-based guess used until the backend answers (and as fallback). */
function guessAppEnvFromHostname(): AppEnv {
  if (typeof window === "undefined") return "production";
  const host = window.location.hostname;
  if (host.startsWith("stage.")) return "staging";
  if (host.startsWith("develop.") || host === "localhost" || host === "127.0.0.1")
    return "development";
  return "production";
}

let cachedEnv: AppEnv | null = null;
let fetchPromise: Promise<AppEnv | null> | null = null;

function fetchBackendEnv(): Promise<AppEnv | null> {
  if (!fetchPromise) {
    fetchPromise = axiosInstance
      .get("/api/app-env")
      .then((res) => normalizeEnv(res.data?.env))
      .catch(() => null);
  }
  return fetchPromise;
}

/**
 * The environment the BACKEND runs as (NODE_ENV via GET /api/app-env), so the
 * console reflects the data it actually talks to. Hostname guess until it
 * resolves; production assumed for unknown hosts (fail-safe: no banner).
 */
export function useAppEnv(): AppEnv {
  const [env, setEnv] = useState<AppEnv>(cachedEnv ?? guessAppEnvFromHostname());
  useEffect(() => {
    if (cachedEnv) return;
    let cancelled = false;
    void fetchBackendEnv().then((backendEnv) => {
      if (backendEnv && !cancelled) {
        cachedEnv = backendEnv;
        setEnv(backendEnv);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return env;
}

/**
 * Student-console sidebar surface per environment: purple = production
 * (unchanged), pink (#ec4899) = staging, blue = development.
 */
export const STUDENT_SIDEBAR_ENV_BG: Record<AppEnv, string> = {
  production: "!bg-purple-600",
  staging: "!bg-pink-500",
  development: "!bg-blue-600",
};
