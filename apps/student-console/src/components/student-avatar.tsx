"use client";

import * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const SIZE_CLASS = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-lg",
} as const;

const COLOR_PALETTE = [
  "bg-rose-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-sky-500",
  "bg-indigo-500",
  "bg-fuchsia-500",
];

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  return h;
}

function initialsFromName(name?: string | null): string {
  if (!name) return "ST";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "ST";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase() || "ST";
}

function colorFromName(name?: string | null): string {
  if (!name) return COLOR_PALETTE[0];
  return COLOR_PALETTE[hashName(name) % COLOR_PALETTE.length];
}

type Props = {
  uid?: string | null;
  name?: string | null;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

/**
 * Student avatar that hits /api/students/uid/:uid/avatar — the unified
 * resolver runs the S3 → besc → hrclIRP fallback server-side. On 404 the
 * Avatar component renders initials.
 */
export function StudentAvatar({ uid, name, size = "md", className }: Props) {
  const src = uid ? `${API_BASE}/api/students/uid/${encodeURIComponent(uid)}/avatar` : null;
  const bgColor = colorFromName(name);

  return (
    <Avatar className={`${SIZE_CLASS[size]} overflow-hidden ${className ?? ""}`}>
      {src ? (
        <AvatarImage
          src={src}
          alt={name ? `${name} avatar` : "Student avatar"}
          className="object-cover"
        />
      ) : null}
      <AvatarFallback
        className={`text-white font-semibold flex items-center justify-center uppercase ${bgColor}`}
      >
        {initialsFromName(name)}
      </AvatarFallback>
    </Avatar>
  );
}
