import { useEffect, useState } from "react";
import axiosInstance from "@/utils/api";

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
  if (host === "admin.academic360.app") return "production";
  if (host.startsWith("stage.")) return "staging";
  return "development";
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
 * console reflects the data it is actually talking to — a localhost frontend
 * pointed at staging shows staging colors. Hostname guess until it resolves.
 */
export function useAppEnv(): AppEnv {
  const [env, setEnv] = useState<AppEnv>(cachedEnv ?? guessAppEnvFromHostname());
  useEffect(() => {
    applyEnvToDocument(cachedEnv ?? guessAppEnvFromHostname());
    if (cachedEnv) return;
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

type SidebarEnvTheme = {
  headerGradient: string;
  headerHover: string;
  surface: string;
  footerBorder: string;
  itemHover: string;
  /** Badge label shown in the sidebar header; null = no badge. */
  badge: string | null;
};

/**
 * Sidebar surfaces per environment so nobody mistakes staging/development for
 * production: purple = production, orange = staging, blue = development.
 */
export const SIDEBAR_ENV_THEME: Record<AppEnv, SidebarEnvTheme> = {
  production: {
    headerGradient: "bg-gradient-to-r from-purple-900 to-purple-800",
    headerHover: "hover:bg-purple-700/50",
    surface: "bg-purple-800/95",
    footerBorder: "border-purple-500",
    itemHover: "hover:bg-purple-700/80",
    badge: null,
  },
  staging: {
    // Pink (#ec4899 = pink-500), per the team's pick — unmistakably not prod.
    headerGradient: "bg-gradient-to-r from-pink-600 to-pink-500",
    headerHover: "hover:bg-pink-400/50",
    surface: "bg-pink-500/95",
    footerBorder: "border-pink-300",
    itemHover: "hover:bg-pink-400/80",
    badge: "STAGING",
  },
  development: {
    headerGradient: "bg-gradient-to-r from-blue-900 to-blue-800",
    headerHover: "hover:bg-blue-700/50",
    surface: "bg-blue-800/95",
    footerBorder: "border-blue-500",
    itemHover: "hover:bg-blue-700/80",
    badge: null,
  },
};
