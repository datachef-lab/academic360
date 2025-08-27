"use client";

import * as React from "react";
import { User } from "lucide-react";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Image from "next/image";

interface StudentProfileProps {
  student: {
    name: string;
    uid: string;
    avatarUrl?: string;
  };
}

export function StudentProfile({ student }: StudentProfileProps) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="cursor-default hover:bg-transparent"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            {student.avatarUrl ? (
              <Image
                width={32}
                height={32}
                src={student.avatarUrl}
                alt={student.name}
                className="size-8 rounded-lg object-cover"
              />
            ) : (
              <User className="size-4" />
            )}
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{student.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              UID: {student.uid}
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
