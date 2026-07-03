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

function applyEnvToDocument(env: AppEnv) {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-env", env);
  }
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
  // SSR-safe: the initial render must match on server and client (Next.js
  // hydration), so start from the cached value or "production" and only apply
  // the hostname guess / backend answer after mount.
  const [env, setEnv] = useState<AppEnv>(cachedEnv ?? "production");
  useEffect(() => {
    if (cachedEnv) {
      setEnv(cachedEnv);
      applyEnvToDocument(cachedEnv);
      return;
    }
    const guess = guessAppEnvFromHostname();
    setEnv(guess);
    applyEnvToDocument(guess);
    let cancelled = false;
    void fetchBackendEnv().then((backendEnv) => {
      if (backendEnv && !cancelled) {
        cachedEnv = backendEnv;
        setEnv(backendEnv);
        applyEnvToDocument(backendEnv);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return env;
}
